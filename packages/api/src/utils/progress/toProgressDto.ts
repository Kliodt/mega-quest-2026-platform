import {
  getStepOptions,
  LocationTitles,
  QuestPhase,
  StepKind,
  StepState,
  type AchievementDto,
  type ProgressDto,
  type StepCardDto,
  type TeamStep,
} from '@quest/shared';
import { toAchievementDtos } from '../achievement/toAchievementDtos.js';
import { getNextQuestionLocation } from '../sequence/getNextQuestionLocation.js';
import { getStepTimeAdjustmentSeconds } from '../timeAdjustment/getStepTimeAdjustmentSeconds.js';
import { getTimeAdjustmentSeconds } from '../timeAdjustment/getTimeAdjustmentSeconds.js';
import { toTimeAdjustmentDtos } from '../timeAdjustment/toTimeAdjustmentDtos.js';
import { toTimerDto } from '../timer/toTimerDto.js';
import { buildTimerSteps } from './buildTimerSteps.js';
import { getStepState } from './getStepState.js';
import { type ProgressInput, type StatesByIndex } from './types.js';

const PHASE_BY_STEP_KIND: Record<StepKind, QuestPhase> = {
  [StepKind.LOCATION_TRANSITION]: QuestPhase.LOCATION_TRANSITION,
  [StepKind.ROOM_TRANSITION]: QuestPhase.ROOM_TRANSITION,
  [StepKind.QUESTION]: QuestPhase.QUESTION,
};

export function toProgressDto(input: ProgressInput): ProgressDto {
  const statesByIndex: StatesByIndex = new Map(
    input.states.map((state) => [state.stepIndex, state]),
  );
  const totalQuestions = input.sequence.filter((step) => step.kind === StepKind.QUESTION).length;
  const solvedCount = input.states.filter((state) => state.answeredAt !== null).length;
  const achievements = toAchievementDtos(solvedCount, totalQuestions);

  return {
    team: input.team,
    phase: getPhase(input.sequence, input.currentStepIndex),
    currentStepIndex: input.currentStepIndex,
    totalQuestions,
    solvedCount,
    achievements,
    steps: toStepCardDtos(input, statesByIndex, achievements),
    nextRoomNumbers: getNextRoomNumbers(input.sequence, input.currentStepIndex, statesByIndex),
    transitionHtml: input.transitionHtml,
    question: input.question,
    timer: toTimerDto(
      buildTimerSteps(input.sequence, statesByIndex),
      input.currentStepIndex,
      input.now,
      getTimeAdjustmentSeconds(input.timeAdjustments),
    ),
    timeAdjustments: toTimeAdjustmentDtos(input.timeAdjustments),
    serverNow: input.now.toISOString(),
  };
}

/**
 * Куда команде идти прямо сейчас. Между аудиториями корпуса — в следующую, на финишном
 * переходе — к его двери. На смене корпуса не подсказываем: сначала нужно доехать.
 *
 * Шаг перечисляет все аудитории, куда он может привести, но команде нужна одна. Её знает
 * решённый вопрос: у вопроса-аудитории ответ и есть следующая дверь, а какой вариант
 * достался команде, уже решено при открытии. Телевизоры у лифта так и работают: пять
 * вариантов в одной аудитории, и каждый ведёт в свою.
 */
function getNextRoomNumbers(
  sequence: TeamStep[],
  currentStepIndex: number,
  statesByIndex: StatesByIndex,
): string[] | null {
  const current = sequence[currentStepIndex];
  if (!current || current.kind === StepKind.QUESTION) {
    return null;
  }
  if (currentStepIndex === sequence.length - 1) {
    return getStepOptions(current).map((room) => room.roomNumber);
  }
  if (current.kind !== StepKind.ROOM_TRANSITION) {
    return null;
  }

  const answered = statesByIndex.get(currentStepIndex - 1);
  const snapshot = answered?.questionSnapshot;
  if (answered?.answeredAt && snapshot?.answerIsNextRoom === true) {
    const rooms = (snapshot.acceptedAnswers ?? []).map((answer) => answer.html);
    if (rooms.length > 0) {
      return rooms;
    }
  }

  const next = sequence[currentStepIndex + 1];
  return next ? getStepOptions(next).map((room) => room.roomNumber) : null;
}

function getPhase(sequence: TeamStep[], currentStepIndex: number): QuestPhase {
  const step = sequence[currentStepIndex];
  if (!step) {
    return QuestPhase.FINISHED;
  }
  return PHASE_BY_STEP_KIND[step.kind];
}

function toStepCardDtos(
  input: ProgressInput,
  statesByIndex: StatesByIndex,
  achievements: AchievementDto[],
): StepCardDto[] {
  const cards: StepCardDto[] = [];
  /** Сколько ответов уже засчитано выше по маршруту: по нему и находится достижение */
  let answerNumber = 0;

  input.sequence.forEach((step, index) => {
    if (step.kind !== StepKind.QUESTION) {
      if (step.kind === StepKind.LOCATION_TRANSITION) {
        const location = getNextQuestionLocation(input.sequence, index);
        if (location !== null) {
          cards.push({
            kind: StepKind.LOCATION_TRANSITION,
            stepIndex: index,
            location,
            locationTitle: LocationTitles[location],
            state: getStepState(step, index, input.currentStepIndex, undefined),
          });
        }
      }
      return;
    }

    const state = statesByIndex.get(index);
    const cardState = getStepState(step, index, input.currentStepIndex, state);

    let roomNumbers: string[] | null = null;
    let solvedSeconds: number | null = null;
    let timeAdjustmentSeconds: number | null = null;
    let achievement: AchievementDto | null = null;
    if (cardState === StepState.DONE && state?.answeredAt) {
      roomNumbers = [state.room.roomNumber];
      solvedSeconds = Math.floor((state.answeredAt.getTime() - state.openedAt.getTime()) / 1000);
      timeAdjustmentSeconds = getStepTimeAdjustmentSeconds(input.timeAdjustments, index);
      answerNumber += 1;
      achievement = achievements[answerNumber] ?? null;
    } else if (cardState === StepState.AWAITING_CODE && isBetweenRooms(input.sequence, index)) {
      roomNumbers = step.options.map((option) => option.roomNumber);
    }

    cards.push({
      kind: StepKind.QUESTION,
      stepIndex: index,
      roomNumbers,
      state: cardState,
      solvedSeconds,
      timeAdjustmentSeconds,
      hintsCount: state?.hintsTaken.length ?? 0,
      achievement,
    });
  });

  return cards;
}

/**
 * Команда идёт между аудиториями одного корпуса: предыдущий вопрос отвечен, следующий ещё
 * не открыт — самое время сказать, куда идти. На переходе между корпусами аудиторию не
 * показываем: команда сначала добирается до корпуса.
 */
function isBetweenRooms(sequence: TeamStep[], index: number): boolean {
  return sequence[index - 1]?.kind === StepKind.ROOM_TRANSITION;
}
