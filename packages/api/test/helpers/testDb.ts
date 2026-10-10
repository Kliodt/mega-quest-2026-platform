import { GameType, Location, StepKind, type RoomRef, type TeamStep } from '@quest/shared';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { BindingModel } from '../../src/models/Binding.js';
import { getQuestionModel, QuestionModel } from '../../src/models/Question.js';
import { QuestionStateModel } from '../../src/models/QuestionState.js';
import { TeamModel, type TeamDocument } from '../../src/models/Team.js';

let server: MongoMemoryServer | null = null;

export async function startTestDb(): Promise<void> {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri(), { dbName: 'quest_test' });
}

export async function stopTestDb(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
  server = null;
}

export async function clearTestDb(): Promise<void> {
  const collections = (await mongoose.connection.db?.collections()) ?? [];
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

/** Два вопроса разных типов в разных аудиториях; `code` — код на двери этой аудитории. */
export const QUESTION_A = {
  gameType: GameType.ENCYCLOPEDIA,
  roomNumber: '101',
  location: Location.LOMO,
  code: 'aaaa1111',
};

export const QUESTION_B = {
  gameType: GameType.HISTORY,
  roomNumber: '205',
  location: Location.LOMO,
  code: 'bbbb2222',
};

export type TestQuestion = typeof QUESTION_A;

/** Аудитория вопроса: ссылка в маршруте и в состоянии шага. */
export function toRoom({ location, roomNumber }: TestQuestion): RoomRef {
  return { location, roomNumber };
}

/** Запрос к вопросам по одной из их аудиторий. */
export function roomFilter(question: TestQuestion): Record<string, unknown> {
  return { rooms: { $elemMatch: toRoom(question) } };
}

/** Коды на дверях обеих тестовых аудиторий. */
export async function loadBindings(): Promise<void> {
  await BindingModel.insertMany(
    [QUESTION_A, QUESTION_B].map((question) => ({
      code: question.code,
      roomNumber: question.roomNumber,
      location: question.location,
    })),
  );
}

export interface QuestionFixture {
  prompt: string;
  acceptedAnswers: string[];
  wrongAttemptPenaltySeconds: number;
  hintPenalties: number[];
  /** Ответ — номер следующей аудитории: маршрут проверяется на соответствие */
  answerIsNextRoom?: boolean;
  /** Номер подставляет ядро по маршруту при открытии; `acceptedAnswers` тогда не пишутся */
  hasDynamicAnswer?: boolean;
  /** Ответ уходит команде вместе с вопросом */
  shouldSendAnswer?: boolean;
  /** Ответ засчитывает внешний механизм; его номер — `externalAnswerCode` */
  waitsForExternalAnswer?: boolean;
  externalAnswerCode?: number;
  /** Все аудитории вопроса; по умолчанию одна — та, что в `ref` */
  rooms?: RoomRef[];
  /** Коды клеток поля: свои коды вопроса, к дверям отношения не имеют */
  cells?: { code: string; row: number; col: number }[];
}

/**
 * Пишет вопрос в общую коллекцию, как это делает `npm run load-questions`.
 * Фикстуры пишутся строками, в поля вопроса (`{ html, data }`) их заворачивает хелпер.
 */
export async function loadQuestion(ref: TestQuestion, fixture: QuestionFixture): Promise<void> {
  await getQuestionModel(ref.gameType).create({
    gameType: ref.gameType,
    rooms: fixture.rooms ?? [toRoom(ref)],
    html: fixture.prompt,
    acceptedAnswers: fixture.acceptedAnswers.map((answer) => ({ html: answer })),
    answerIsNextRoom: fixture.answerIsNextRoom ?? fixture.hasDynamicAnswer ?? false,
    hasDynamicAnswer: fixture.hasDynamicAnswer ?? false,
    shouldSendAnswer: fixture.shouldSendAnswer ?? false,
    waitsForExternalAnswer: fixture.waitsForExternalAnswer ?? false,
    externalAnswerCode: fixture.externalAnswerCode ?? null,
    cells: fixture.cells ?? [],
    wrongAttemptPenaltySeconds: fixture.wrongAttemptPenaltySeconds,
    hints: fixture.hintPenalties.map((penaltySeconds, hintIndex) => ({
      html: `Подсказка ${hintIndex + 1} для ауд. ${ref.roomNumber}`,
      penaltySeconds,
    })),
  });
}

export const LT: TeamStep = { kind: StepKind.LOCATION_TRANSITION };
export const RT: TeamStep = { kind: StepKind.ROOM_TRANSITION };
export const Q = (...questions: TestQuestion[]): TeamStep => ({
  kind: StepKind.QUESTION,
  options: questions.map(toRoom),
});

export async function loadTeam(
  sequence: TeamStep[],
  name = 'Тестовая',
  slug = `team_${name}`,
): Promise<TeamDocument> {
  return TeamModel.create({
    slug,
    name,
    passwordHash: 'not-used-in-service-tests',
    sessionId: null,
    sequence,
    currentStepIndex: 0,
  });
}

export async function readTeam(team: TeamDocument): Promise<TeamDocument> {
  const fresh = await TeamModel.findById(team._id);
  if (!fresh) {
    throw new Error('Team disappeared');
  }
  return fresh;
}

export async function ensureIndexes(): Promise<void> {
  await QuestionStateModel.syncIndexes();
  await QuestionModel.syncIndexes();
  await BindingModel.syncIndexes();
}
