import {
  getStepOptions,
  StepKind,
  toRoomKey,
  type ProgressDto,
  type RoomRef,
  type TeamStep,
} from '@quest/shared';
import { type FastifyBaseLogger } from 'fastify';
import { MOCK_CODE } from '../../config/env.js';
import { type QuestionDocument } from '../../models/Question.js';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';
import { QuestionAlreadyOpenError, WrongCodeError } from '../../utils/errors/index.js';
import { pickFreeQuestion } from '../../utils/question/pickFreeQuestion.js';
import { pickTeamQuestions } from '../../utils/question/pickTeamQuestions.js';
import { toQuestionSnapshot } from '../../utils/question/toQuestionSnapshot.js';
import { assertNotFinished } from '../../utils/team/assertNotFinished.js';
import { getCurrentStep } from '../../utils/team/getCurrentStep.js';
import { readBinding } from '../binding/readBinding.js';
import { readQuestionsByRooms } from '../question/readQuestionsByRooms.js';
import { readQuestionUsage } from '../question/readQuestionUsage.js';
import { advanceTeam } from './advanceTeam.js';
import { getProgress } from './getProgress.js';
import { readOpenState } from './readOpenState.js';

const MONGO_DUPLICATE_KEY = 11000;

/** @param mockCode по умолчанию из окружения; тесты передают `null`, чтобы проверить его отсутствие. */
export async function enterCode(
  team: TeamDocument,
  rawCode: string,
  log: FastifyBaseLogger,
  now = new Date(),
  mockCode = MOCK_CODE,
): Promise<ProgressDto> {
  assertNotFinished(team);
  const code = rawCode.trim();
  const isMockCode = mockCode !== null && code === mockCode;

  if (getCurrentStep(team)?.kind === StepKind.QUESTION) {
    const state = await readOpenState(team);
    if (state && (isMockCode || (await isCodeOf(code, state.room)))) {
      return getProgress(team, now);
    }
    throw new QuestionAlreadyOpenError();
  }

  const nextIndex = team.currentStepIndex + 1;
  if (nextIndex === team.sequence.length) {
    return finishByCode(team, code, isMockCode, now);
  }

  const options = getQuestionOptions(team.sequence[nextIndex]);
  const opened = await resolveQuestion(code, options, isMockCode, team.slug);
  if (!opened) {
    log.info({ teamId: team.id, code, stepIndex: team.currentStepIndex }, 'Wrong room code');
    throw new WrongCodeError();
  }
  if (isMockCode) {
    log.warn({ teamId: team.id, ...opened.room }, 'MOCK_CODE used to open a question');
  }

  const questionSnapshot = toQuestionSnapshot(opened.question, team.sequence, nextIndex);
  try {
    await QuestionStateModel.create({
      teamId: team._id,
      stepIndex: nextIndex,
      room: opened.room,
      questionId: opened.question._id,
      questionSnapshot,
      openedAt: now,
      answeredAt: null,
      attempts: [],
      hintsTaken: [],
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }
    log.warn({ teamId: team.id, stepIndex: nextIndex }, 'Question state already exists, reusing');
  }

  const advanced = await advanceTeam(team, team.currentStepIndex);
  return getProgress(advanced, now);
}

/** Последний шаг маршрута — финишный переход: вопросов за ним нет, его скан закрывает квест. */
async function finishByCode(
  team: TeamDocument,
  code: string,
  isMockCode: boolean,
  now: Date,
): Promise<ProgressDto> {
  const finish = getCurrentStep(team);
  const room = finish ? await resolveRoom(code, getStepOptions(finish), isMockCode) : null;
  if (!room) {
    throw new WrongCodeError();
  }
  const advanced = await advanceTeam(team, team.currentStepIndex);
  return getProgress(advanced, now);
}

function getQuestionOptions(step: TeamStep | undefined): RoomRef[] {
  if (step?.kind !== StepKind.QUESTION) {
    return [];
  }
  return getStepOptions(step);
}

interface OpenedQuestion {
  question: QuestionDocument;
  /** Аудитория шага, код которой отсканировали: один вопрос стоит в нескольких */
  room: RoomRef;
}

/** Аудитория шага, чей код отсканировали; тестовый код берёт первую аудиторию шага. */
async function resolveRoom(
  code: string,
  options: RoomRef[],
  isMockCode: boolean,
): Promise<RoomRef | null> {
  if (isMockCode) {
    return options[0] ?? null;
  }
  const binding = await readBinding(code);
  if (!binding) {
    return null;
  }
  return options.find((room) => toRoomKey(room) === toRoomKey(binding)) ?? null;
}

/**
 * Вопрос, который команда откроет в этой аудитории. Вопросов в ней бывает несколько:
 * именной вариант достаётся своей команде, а из общих берётся тот, что дольше всего
 * свободен, — так команды расходятся по разным.
 */
async function resolveQuestion(
  code: string,
  options: RoomRef[],
  isMockCode: boolean,
  teamSlug: string,
): Promise<OpenedQuestion | null> {
  const questionsByRoom = await readQuestionsByRooms(options);
  const room = await resolveRoom(code, options, isMockCode);
  const inRoom = room ? (questionsByRoom.get(toRoomKey(room)) ?? []) : [];
  if (!room || inRoom.length === 0) {
    return null;
  }
  const questions = pickTeamQuestions(inRoom, teamSlug);
  const [only] = questions;
  if (only && questions.length === 1) {
    return { room, question: only };
  }
  const usage = await readQuestionUsage(questions.map((question) => question._id));
  return { room, question: pickFreeQuestion(questions, usage) };
}

/** Повторный ввод кода открытой аудитории — не ошибка, а no-op. */
async function isCodeOf(code: string, room: RoomRef): Promise<boolean> {
  const binding = await readBinding(code);
  return binding !== null && toRoomKey(binding) === toRoomKey(room);
}

/** E11000 при двойном сабмите enter-code: состояние уже создано параллельным запросом. */
function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === MONGO_DUPLICATE_KEY
  );
}
