import {
  getStepOptions,
  StepKind,
  toRoomKey,
  type AdminStepDto,
  type AdminTeamDetailDto,
  type RoomRef,
} from '@quest/shared';
import { type TimeAdjustment } from '../../models/Team.js';
import { buildTimerSteps } from '../progress/buildTimerSteps.js';
import { getStepState } from '../progress/getStepState.js';
import {
  type ProgressQuestionInput,
  type ProgressStateInput,
  type StatesByIndex,
} from '../progress/types.js';
import { toAdminQuestionRefDto } from '../question/toAdminQuestionRefDto.js';
import { getStepTimeAdjustmentSeconds } from '../timeAdjustment/getStepTimeAdjustmentSeconds.js';
import { getTimeAdjustmentSeconds } from '../timeAdjustment/getTimeAdjustmentSeconds.js';
import { toTimeAdjustmentDtos } from '../timeAdjustment/toTimeAdjustmentDtos.js';
import { toTimerDto } from '../timer/toTimerDto.js';
import { type AdminTeamDetailInput } from './types.js';

/** Карта команды для организатора: каждый шаг маршрута со сводкой и полными попытками. */
export function toAdminTeamDetailDto(input: AdminTeamDetailInput): AdminTeamDetailDto {
  const statesByIndex: StatesByIndex = new Map(
    input.states.map((state) => [state.stepIndex, state]),
  );
  const steps: AdminStepDto[] = input.team.sequence.map((step, index) => {
    const state = statesByIndex.get(index);
    const cardState = getStepState(step, index, input.team.currentStepIndex, state);
    if (step.kind !== StepKind.QUESTION) {
      return { kind: step.kind, stepIndex: index, state: cardState, options: getStepOptions(step) };
    }
    return toAdminQuestionStepDto(
      index,
      step.options,
      cardState,
      state,
      input.questionsByRoom,
      input.timeAdjustments,
    );
  });

  return {
    team: {
      id: input.team.id,
      name: input.team.name,
      status: input.team.status,
      currentStepIndex: input.team.currentStepIndex,
      sequence: input.team.sequence,
    },
    timer: toTimerDto(
      buildTimerSteps(input.team.sequence, statesByIndex),
      input.team.currentStepIndex,
      input.now,
      getTimeAdjustmentSeconds(input.timeAdjustments),
    ),
    steps,
    timeAdjustments: toTimeAdjustmentDtos(input.timeAdjustments),
    serverNow: input.now.toISOString(),
  };
}

function toAdminQuestionStepDto(
  stepIndex: number,
  optionRooms: RoomRef[],
  cardState: AdminStepDto['state'],
  state: ProgressStateInput | undefined,
  questionsByRoom: ReadonlyMap<string, ProgressQuestionInput[]>,
  timeAdjustments: TimeAdjustment[],
): AdminStepDto {
  // В аудитории бывает несколько вопросов: организатору видны все
  const options = optionRooms.flatMap((room) =>
    (questionsByRoom.get(toRoomKey(room)) ?? []).map((question) =>
      toAdminQuestionRefDto(room, question),
    ),
  );

  const question = state ? toAdminQuestionRefDto(state.room, state.questionSnapshot) : null;

  let solvedSeconds: number | null = null;
  if (state?.answeredAt) {
    solvedSeconds = Math.floor((state.answeredAt.getTime() - state.openedAt.getTime()) / 1000);
  }

  return {
    kind: StepKind.QUESTION,
    stepIndex,
    state: cardState,
    options,
    question,
    openedAt: state?.openedAt.toISOString() ?? null,
    answeredAt: state?.answeredAt?.toISOString() ?? null,
    solvedSeconds,
    timeAdjustmentSeconds: getStepTimeAdjustmentSeconds(timeAdjustments, stepIndex),
    hintsCount: state?.hintsTaken.length ?? 0,
    attemptsCount: state?.attempts.length ?? 0,
    wrongAttemptsCount: state?.attempts.filter((attempt) => !attempt.correct).length ?? 0,
    attempts: (state?.attempts ?? []).map((attempt) => ({
      submittedAt: attempt.submittedAt.toISOString(),
      correct: attempt.correct,
      payload: attempt.payload,
    })),
    hints: (state?.hintsTaken ?? []).map((hint) => ({
      index: hint.index,
      takenAt: hint.takenAt.toISOString(),
    })),
  };
}
