import { Location, StepKind, toRoomKey, type RoomRef, type TeamStep } from '@quest/shared';
import { describe, expect, it } from 'vitest';
import { type SequenceQuestion, type SequenceQuestionLookup } from '../src/utils/sequence/types.js';
import { validateSequence } from '../src/utils/sequence/validateSequence.js';

const LOMO_101: RoomRef = { location: Location.LOMO, roomNumber: '101' };
const LOMO_205: RoomRef = { location: Location.LOMO, roomNumber: '205' };
const CRONVA_1312: RoomRef = { location: Location.CRONVA, roomNumber: '1312' };
const MISSING: RoomRef = { location: Location.LOMO, roomNumber: '404' };

const TEAM = 'team_test';

function question(ref: RoomRef, nextRoomAnswers: string[] = []): SequenceQuestion {
  return { ...ref, nextRoomAnswers, hasDynamicAnswer: false, teamSlugs: [] };
}

function dynamicQuestion(ref: RoomRef): SequenceQuestion {
  return { ...ref, nextRoomAnswers: [], hasDynamicAnswer: true, teamSlugs: [] };
}

/** Вариант, заведённый конкретной команде: её и ищет валидатор. */
function teamQuestion(ref: RoomRef, ...teamSlugs: string[]): SequenceQuestion {
  return { ...ref, nextRoomAnswers: [], hasDynamicAnswer: false, teamSlugs };
}

function validate(
  sequence: TeamStep[],
  lookup: SequenceQuestionLookup = questions,
  teamName = TEAM,
): ReturnType<typeof validateSequence> {
  return validateSequence(sequence, lookup, teamName);
}

const questions: SequenceQuestionLookup = new Map([
  [toRoomKey(LOMO_101), [question(LOMO_101)]],
  [toRoomKey(LOMO_205), [question(LOMO_205)]],
  [toRoomKey(CRONVA_1312), [question(CRONVA_1312)]],
]);

const LT: TeamStep = { kind: StepKind.LOCATION_TRANSITION };
const RT: TeamStep = { kind: StepKind.ROOM_TRANSITION };
const Q = (...options: RoomRef[]): TeamStep => ({ kind: StepKind.QUESTION, options });
const EXIT = (...options: RoomRef[]): TeamStep => ({
  kind: StepKind.LOCATION_TRANSITION,
  options,
});

describe('validateSequence', () => {
  it('accepts a valid route', () => {
    const result = validate([LT, Q(LOMO_101), RT, Q(LOMO_205), LT, Q(CRONVA_1312)], questions);
    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('rejects an empty route', () => {
    expect(validate([], questions).ok).toBe(false);
  });

  it('rejects a route that does not start with LOCATION_TRANSITION', () => {
    const result = validate([Q(LOMO_101)], questions);
    expect(result.errors).toContain('Step 0: sequence must start with LOCATION_TRANSITION');
  });

  it('rejects a route that ends with a transition', () => {
    const result = validate([LT, Q(LOMO_101), RT], questions);
    expect(result.errors).toContain('Step 2: sequence must end with QUESTION or a finish room');
  });

  it('rejects two transitions in a row', () => {
    const result = validate([LT, RT, Q(LOMO_101)], questions);
    expect(result.errors).toContain('Step 1: transitions and questions must alternate');
  });

  it('rejects two questions in a row', () => {
    const result = validate([LT, Q(LOMO_101), Q(LOMO_205)], questions);
    expect(result.errors).toContain('Step 2: transitions and questions must alternate');
  });

  it('rejects a room without a question', () => {
    const result = validate([LT, Q(MISSING)], questions);
    expect(result.errors).toContain('Step 1: no question in room lomo/404');
  });

  it('rejects options spanning multiple locations', () => {
    const result = validate([LT, Q(LOMO_101, CRONVA_1312)], questions);
    expect(result.errors.some((e) => e.includes('span multiple locations'))).toBe(true);
  });

  it('rejects ROOM_TRANSITION between different locations', () => {
    const result = validate([LT, Q(LOMO_101), RT, Q(CRONVA_1312)], questions);
    expect(result.errors.some((e) => e.includes('ROOM_TRANSITION between different'))).toBe(true);
  });

  it('rejects LOCATION_TRANSITION inside the same location', () => {
    const result = validate([LT, Q(LOMO_101), LT, Q(LOMO_205)], questions);
    expect(result.errors.some((e) => e.includes('LOCATION_TRANSITION inside the same'))).toBe(true);
  });

  it('accepts a step with several options in one location', () => {
    const result = validate([LT, Q(LOMO_101, LOMO_205), LT, Q(CRONVA_1312)], questions);
    expect(result.ok).toBe(true);
  });

  /** Заранее известный ответ-аудитория обязан совпасть с аудиторией следующего шага. */
  describe('answers that must be the next room', () => {
    const withNextRoom: SequenceQuestionLookup = new Map([
      [toRoomKey(LOMO_101), [question(LOMO_101, ['205', '1312'])]],
      [toRoomKey(LOMO_205), [question(LOMO_205)]],
      [toRoomKey(CRONVA_1312), [question(CRONVA_1312)]],
    ]);

    it('accepts a route where every answer leads to an option of the next question', () => {
      const result = validate([LT, Q(LOMO_101), RT, Q(LOMO_205, CRONVA_1312)], withNextRoom);
      expect(result.errors.filter((e) => e.includes('is not a room'))).toEqual([]);
    });

    it('rejects a route where an answer leads nowhere', () => {
      const result = validate([LT, Q(LOMO_101), RT, Q(LOMO_205)], withNextRoom);
      expect(result.ok).toBe(false);
      expect(result.errors).toContain('Step 1: answer "1312" is not a room that follows (205)');
    });

    it('rejects such a question as the last step of the route', () => {
      const result = validate([LT, Q(LOMO_101)], withNextRoom);
      expect(result.errors).toContain(
        'Step 1: answer is the next room number, but no room follows',
      );
    });
  });

  /** Флаг hasDynamicAnswer: ответом станет аудитория следующего вопроса маршрута. */
  describe('answers computed from the route', () => {
    const withDynamic: SequenceQuestionLookup = new Map([
      [toRoomKey(LOMO_101), [dynamicQuestion(LOMO_101)]],
      [toRoomKey(LOMO_205), [question(LOMO_205)]],
      [toRoomKey(CRONVA_1312), [question(CRONVA_1312)]],
    ]);

    it('accepts a route where exactly one question follows', () => {
      const result = validate([LT, Q(LOMO_101), RT, Q(LOMO_205)], withDynamic);
      expect(result).toEqual({ ok: true, errors: [] });
    });

    it('rejects such a question as the last step of the route', () => {
      const result = validate([LT, Q(LOMO_101)], withDynamic);
      expect(result.errors).toContain(
        'Step 1: answer is computed from the route, but no room follows',
      );
    });

    it('rejects a branching next step: which room would be the answer', () => {
      const result = validate([LT, Q(LOMO_101), LT, Q(LOMO_205, CRONVA_1312)], withDynamic);
      expect(result.errors).toContain(
        'Step 1: answer is computed from the route, but several rooms follow',
      );
    });
  });

  /** Там, где варианты заведены по именам команд, у каждой команды должен быть свой. */
  describe('team variants', () => {
    const withTeamVariants: SequenceQuestionLookup = new Map([
      [toRoomKey(LOMO_101), [teamQuestion(LOMO_101, TEAM), teamQuestion(LOMO_101, 'team_other')]],
    ]);

    it('accepts a room where the team has its own variant', () => {
      expect(validate([LT, Q(LOMO_101)], withTeamVariants)).toEqual({ ok: true, errors: [] });
    });

    it('rejects a room where every variant belongs to other teams', () => {
      const result = validate([LT, Q(LOMO_101)], withTeamVariants, 'team_third');
      expect(result.errors).toContain(
        'Step 1: room lomo/101 has no question variant for this team',
      );
    });

    it('accepts a room that also has a shared variant', () => {
      const mixed: SequenceQuestionLookup = new Map([
        [toRoomKey(LOMO_101), [teamQuestion(LOMO_101, 'team_other'), question(LOMO_101)]],
      ]);
      expect(validate([LT, Q(LOMO_101)], mixed, 'team_third').ok).toBe(true);
    });
  });

  /** Корпус закрывает своя аудитория перехода: её скан останавливает время. */
  describe('rooms that close a location', () => {
    const LOMO_EXIT: RoomRef = { location: Location.LOMO, roomNumber: 'выход' };

    const withDynamic: SequenceQuestionLookup = new Map([
      [toRoomKey(LOMO_101), [dynamicQuestion(LOMO_101)]],
      [toRoomKey(CRONVA_1312), [question(CRONVA_1312)]],
    ]);

    it('accepts a corpus change through the exit room of the transition', () => {
      const result = validate([LT, Q(LOMO_101), EXIT(LOMO_EXIT), Q(CRONVA_1312)], withDynamic);
      expect(result).toEqual({ ok: true, errors: [] });
    });

    it('rejects an answer that leads into the next location', () => {
      const result = validate([LT, Q(LOMO_101), LT, Q(CRONVA_1312)], withDynamic);
      expect(result.errors).toContain(
        'Step 1: answer leads to cronva/1312 in another location, LOCATION_TRANSITION needs its own room',
      );
    });

    it('accepts a route that ends with the finish room', () => {
      const result = validate([LT, Q(LOMO_101), EXIT(LOMO_EXIT)], withDynamic);
      expect(result).toEqual({ ok: true, errors: [] });
    });

    it('rejects a room on the first transition: it closes nothing', () => {
      const result = validate([EXIT(LOMO_EXIT), Q(LOMO_101), EXIT(LOMO_EXIT)], withDynamic);
      expect(result.errors).toContain(
        'Step 0: the first LOCATION_TRANSITION closes nothing and takes no rooms',
      );
    });
  });
});
