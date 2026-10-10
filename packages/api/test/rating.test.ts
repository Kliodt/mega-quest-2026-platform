import {
  GameType,
  Location,
  StepKind,
  TeamStatus,
  TimeAdjustmentType,
  type TeamStep,
} from '@quest/shared';
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { type TimeAdjustment } from '../src/models/Team.js';
import { type ProgressStateInput } from '../src/utils/progress/types.js';
import { toRatingDto } from '../src/utils/rating/toRatingDto.js';
import { type RatingTeamInput } from '../src/utils/rating/types.js';

const t = (seconds: number): Date => new Date(1_700_000_000_000 + seconds * 1000);

const sequence: TeamStep[] = [
  { kind: StepKind.LOCATION_TRANSITION },
  { kind: StepKind.QUESTION, options: [{ location: Location.LOMO, roomNumber: '101' }] },
  { kind: StepKind.ROOM_TRANSITION },
  { kind: StepKind.QUESTION, options: [{ location: Location.LOMO, roomNumber: '205' }] },
];

const questionSnapshot = { gameType: GameType.ENCYCLOPEDIA, answerIsNextRoom: true };

function state(stepIndex: number, openedAt: Date, answeredAt: Date | null): ProgressStateInput {
  return {
    stepIndex,
    room: { location: Location.LOMO, roomNumber: '101' },
    questionSnapshot,
    openedAt,
    answeredAt,
    attempts: [],
    hintsTaken: [],
  };
}

function wrongAnswer(seconds: number, stepIndex: number, createdAt: Date): TimeAdjustment {
  return {
    _id: new Types.ObjectId(),
    timeAdjustmentSeconds: seconds,
    type: TimeAdjustmentType.WRONG_ANSWER,
    createdAt,
    comment: null,
    stepIndex,
  };
}

const finishedFast: RatingTeamInput = {
  id: '1',
  name: 'Быстрые',
  sequence,
  currentStepIndex: 4,
  timeAdjustments: [],
  states: [state(1, t(0), t(60)), state(3, t(70), t(100))],
};

const finishedSlowByPenalty: RatingTeamInput = {
  id: '2',
  name: 'Штрафники',
  sequence,
  currentStepIndex: 4,
  timeAdjustments: [wrongAnswer(100, 1, t(10))],
  states: [state(1, t(0), t(50)), state(3, t(60), t(90))],
};

const inProgressTwoSolved: RatingTeamInput = {
  id: '3',
  name: 'Идущие',
  sequence,
  currentStepIndex: 3,
  timeAdjustments: [],
  states: [state(1, t(0), t(30)), state(3, t(40), null)],
};

const inProgressOneSolved: RatingTeamInput = {
  id: '4',
  name: 'Отстающие',
  sequence,
  currentStepIndex: 2,
  timeAdjustments: [],
  states: [state(1, t(0), t(10))],
};

const notStarted: RatingTeamInput = {
  id: '5',
  name: 'Ждущие',
  sequence,
  currentStepIndex: 0,
  timeAdjustments: [],
  states: [],
};

describe('toRatingDto', () => {
  it('orders finished by total time, then in-progress by solved and time, then not started', () => {
    const rating = toRatingDto(
      [notStarted, inProgressOneSolved, finishedSlowByPenalty, inProgressTwoSolved, finishedFast],
      t(200),
    );
    expect(rating.entries.map((e) => [e.rank, e.teamName, e.status])).toEqual([
      [1, 'Быстрые', TeamStatus.FINISHED],
      [2, 'Штрафники', TeamStatus.FINISHED],
      [3, 'Идущие', TeamStatus.IN_PROGRESS],
      [4, 'Отстающие', TeamStatus.IN_PROGRESS],
      [5, 'Ждущие', TeamStatus.NOT_STARTED],
    ]);
  });

  it('includes time adjustments in total and reports finishedAt for finished teams', () => {
    const rating = toRatingDto([finishedSlowByPenalty], t(200));
    const entry = rating.entries[0];
    expect(entry?.elapsedSeconds).toBe(90);
    expect(entry?.timeAdjustmentSeconds).toBe(100);
    expect(entry?.totalSeconds).toBe(190);
    expect(entry?.finishedAt).toBe(t(90).toISOString());
    expect(entry?.solvedCount).toBe(2);
    expect(entry?.totalQuestions).toBe(2);
  });

  it('breaks ties among finished teams by finishedAt then name', () => {
    const a: RatingTeamInput = { ...finishedFast, id: 'a', name: 'Б' };
    const b: RatingTeamInput = {
      ...finishedFast,
      id: 'b',
      name: 'А',
      states: [state(1, t(1000), t(1060)), state(3, t(1070), t(1100))],
    };
    const rating = toRatingDto([b, a], t(2000));
    expect(rating.entries.map((e) => e.teamName)).toEqual(['Б', 'А']);
  });
});
