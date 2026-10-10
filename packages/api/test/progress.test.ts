import {
  GameType,
  Location,
  QuestPhase,
  StepState,
  StepKind,
  TeamStatus,
  TimeAdjustmentType,
  toRoomKey,
  type RoomRef,
  type TeamStep,
} from '@quest/shared';
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { type TimeAdjustment } from '../src/models/Team.js';
import { toProgressDto } from '../src/utils/progress/toProgressDto.js';
import {
  type ProgressInput,
  type ProgressQuestionInput,
  type ProgressStateInput,
} from '../src/utils/progress/types.js';

const t = (seconds: number): Date => new Date(1_700_000_000_000 + seconds * 1000);

const LOMO_101: RoomRef = { location: Location.LOMO, roomNumber: '101' };
const LOMO_205: RoomRef = { location: Location.LOMO, roomNumber: '205' };
const BIRJA_12: RoomRef = { location: Location.BIRJA, roomNumber: '12' };

const QUESTION: ProgressQuestionInput = { gameType: GameType.ENCYCLOPEDIA };

function answeredAt(stepIndex: number, room: RoomRef): ProgressStateInput {
  return {
    stepIndex,
    room,
    questionSnapshot: QUESTION,
    openedAt: t(0),
    answeredAt: t(60),
    attempts: [],
    hintsTaken: [],
  };
}

const questions = new Map<string, ProgressQuestionInput[]>(
  [LOMO_101, LOMO_205, BIRJA_12].map((room) => [toRoomKey(room), [QUESTION]]),
);

const sequence: TeamStep[] = [
  { kind: StepKind.LOCATION_TRANSITION },
  { kind: StepKind.QUESTION, options: [LOMO_101, LOMO_205] },
  { kind: StepKind.ROOM_TRANSITION },
  { kind: StepKind.QUESTION, options: [LOMO_205] },
  { kind: StepKind.LOCATION_TRANSITION },
  { kind: StepKind.QUESTION, options: [BIRJA_12] },
];

function makeInput(
  currentStepIndex: number,
  states: ProgressStateInput[],
  timeAdjustments: TimeAdjustment[] = [],
): ProgressInput {
  return {
    team: { id: 't1', name: 'Альфа', status: TeamStatus.IN_PROGRESS },
    sequence,
    currentStepIndex,
    states,
    questionsByRoom: questions,
    timeAdjustments,
    question: null,
    transitionHtml: null,
    now: t(1000),
  };
}

describe('toProgressDto step cards', () => {
  it('marks first transition active and first question awaiting code before start', () => {
    const progress = toProgressDto(makeInput(0, []));
    expect(progress.phase).toBe(QuestPhase.LOCATION_TRANSITION);
    expect(progress.steps.map((card) => card.state)).toEqual([
      StepState.ACTIVE,
      StepState.AWAITING_CODE,
      StepState.LOCKED,
      StepState.LOCKED,
      StepState.LOCKED,
    ]);
    const first = progress.steps[0];
    expect(first?.kind).toBe(StepKind.LOCATION_TRANSITION);
    if (first?.kind === StepKind.LOCATION_TRANSITION) {
      expect(first.locationTitle).toBe('Ломоносова');
    }
    const question = progress.steps[1];
    if (question?.kind === StepKind.QUESTION) {
      // Аудитория нерешённого вопроса скрыта: ответом бывает её номер
      expect(question.roomNumbers).toBeNull();
    }
  });

  /** Команда идёт между аудиториями корпуса: показываем, в какую именно. */
  it('reveals the awaiting room on a room transition', () => {
    const cards = toProgressDto(makeInput(2, [answeredAt(1, LOMO_101)])).steps;

    const awaiting = cards.find((card) => card.state === StepState.AWAITING_CODE);
    expect(awaiting?.kind).toBe(StepKind.QUESTION);
    expect(awaiting?.kind === StepKind.QUESTION && awaiting.roomNumbers).toEqual(['205']);
  });

  /** На переходе между корпусами команда сначала добирается до корпуса. */
  it('keeps the awaiting room hidden on a location transition', () => {
    const states = [answeredAt(1, LOMO_101), answeredAt(3, LOMO_205)];

    const cards = toProgressDto(makeInput(4, states)).steps;

    const awaiting = cards.find((card) => card.state === StepState.AWAITING_CODE);
    expect(awaiting?.kind === StepKind.QUESTION && awaiting.roomNumbers).toBeNull();
  });

  it('shows chosen game only and solved time for a done question', () => {
    const states: ProgressStateInput[] = [
      {
        stepIndex: 1,
        room: LOMO_205,
        questionSnapshot: QUESTION,
        openedAt: t(0),
        answeredAt: t(90),
        attempts: [{ submittedAt: t(40), payload: {}, correct: false }],
        hintsTaken: [],
      },
    ];
    const timeAdjustments: TimeAdjustment[] = [
      {
        _id: new Types.ObjectId(),
        timeAdjustmentSeconds: 30,
        type: TimeAdjustmentType.WRONG_ANSWER,
        createdAt: t(40),
        comment: null,
        stepIndex: 1,
      },
    ];
    const progress = toProgressDto(makeInput(2, states, timeAdjustments));
    expect(progress.phase).toBe(QuestPhase.ROOM_TRANSITION);
    expect(progress.solvedCount).toBe(1);
    expect(progress.totalQuestions).toBe(3);
    const done = progress.steps[1];
    expect(done?.state).toBe(StepState.DONE);
    if (done?.kind === StepKind.QUESTION) {
      expect(done.roomNumbers).toEqual(['205']);
      expect(done.solvedSeconds).toBe(90);
      expect(done.timeAdjustmentSeconds).toBe(30);
    }
    const awaiting = progress.steps[2];
    expect(awaiting?.state).toBe(StepState.AWAITING_CODE);
    if (awaiting?.kind === StepKind.QUESTION) {
      expect(awaiting.roomNumbers).toEqual(['205']);
    }
    expect(JSON.stringify(progress.steps)).not.toContain('12');
    expect(progress.timer.running).toBe(true);
    expect(progress.timer.timeAdjustmentSeconds).toBe(30);
    expect(progress.timeAdjustments.map((adjustment) => adjustment.stepIndex)).toEqual([1]);
  });

  it('reports FINISHED when index is past the end', () => {
    const progress = toProgressDto(makeInput(sequence.length, []));
    expect(progress.phase).toBe(QuestPhase.FINISHED);
    expect(progress.question).toBeNull();
  });
});

describe('toProgressDto achievements', () => {
  it('даёт первое достижение за вход и по одному за каждый ответ', () => {
    const notStarted = toProgressDto(makeInput(0, []));
    expect(notStarted.achievements).toHaveLength(1);
    expect(notStarted.achievements[0]?.image).toMatch(/^\/achievements\/\w+\.png$/);

    const solvedOne = toProgressDto(makeInput(2, [answeredAt(1, LOMO_101)]));
    expect(solvedOne.achievements).toHaveLength(2);
    expect(solvedOne.achievements[0]).toEqual(notStarted.achievements[0]);

    const solvedTwo = toProgressDto(
      makeInput(4, [answeredAt(1, LOMO_101), answeredAt(3, LOMO_205)]),
    );
    expect(solvedTwo.achievements).toHaveLength(3);
    // Порядок один на все команды: ответ на стикерах тоже один на всех
    expect(solvedTwo.achievements.slice(0, 2)).toEqual(solvedOne.achievements);
  });

  it('кладёт достижение ответа в карточку своего задания', () => {
    const progress = toProgressDto(
      makeInput(4, [answeredAt(1, LOMO_101), answeredAt(3, LOMO_205)]),
    );
    const solved = progress.steps.filter(
      (card) => card.kind === StepKind.QUESTION && card.state === StepState.DONE,
    );

    expect(solved).toHaveLength(2);
    solved.forEach((card, index) => {
      // Первый ответ приносит второе достижение: первое уже выдано за вход
      expect(card.kind === StepKind.QUESTION && card.achievement).toEqual(
        progress.achievements[index + 1],
      );
    });
  });

  it('у нерешённого задания достижения нет', () => {
    const progress = toProgressDto(makeInput(0, []));
    const locked = progress.steps.find((card) => card.kind === StepKind.QUESTION);

    expect(locked?.kind === StepKind.QUESTION && locked.achievement).toBeNull();
  });
});

describe('toProgressDto next room', () => {
  const branching: TeamStep[] = [
    { kind: StepKind.LOCATION_TRANSITION },
    { kind: StepKind.QUESTION, options: [LOMO_101] },
    { kind: StepKind.ROOM_TRANSITION },
    // Шаг ведёт в любую из аудиторий, но команде нужна одна: та, куда указал её вариант
    {
      kind: StepKind.QUESTION,
      options: [
        LOMO_205,
        { location: Location.LOMO, roomNumber: '305' },
        { location: Location.LOMO, roomNumber: '405' },
      ],
    },
  ];

  function onTransition(snapshot: ProgressQuestionInput): ProgressInput {
    return {
      ...makeInput(2, [{ ...answeredAt(1, LOMO_101), questionSnapshot: snapshot }]),
      sequence: branching,
    };
  }

  it('называет аудиторию из ответа выданного варианта', () => {
    const progress = toProgressDto(
      onTransition({
        gameType: GameType.TELEVISIONS,
        answerIsNextRoom: true,
        acceptedAnswers: [{ html: '305' }],
      }),
    );
    expect(progress.nextRoomNumbers).toEqual(['305']);
  });

  it('без ответа-аудитории берёт аудитории следующего шага', () => {
    const progress = toProgressDto(onTransition({ gameType: GameType.LIGHT }));
    expect(progress.nextRoomNumbers).toEqual(['205', '305', '405']);
  });
});
