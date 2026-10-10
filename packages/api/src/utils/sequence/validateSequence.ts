import { getStepOptions, StepKind, toRoomKey, type Location, type TeamStep } from '@quest/shared';
import { getNextRooms } from './getNextRooms.js';
import { type SequenceQuestionLookup, type SequenceValidationResult } from './types.js';

export function validateSequence(
  sequence: TeamStep[],
  questions: SequenceQuestionLookup,
  teamSlug: string,
): SequenceValidationResult {
  const errors: string[] = [];

  if (sequence.length === 0) {
    return { ok: false, errors: ['Sequence is empty'] };
  }

  const first = sequence[0];
  if (first && first.kind !== StepKind.LOCATION_TRANSITION) {
    errors.push('Step 0: sequence must start with LOCATION_TRANSITION');
  }

  // Маршрут кончается вопросом или финишной аудиторией: её скан и закрывает квест
  const last = sequence[sequence.length - 1];
  if (last && last.kind !== StepKind.QUESTION && getStepOptions(last).length === 0) {
    errors.push(`Step ${sequence.length - 1}: sequence must end with QUESTION or a finish room`);
  }

  for (let i = 1; i < sequence.length; i += 1) {
    const prev = sequence[i - 1];
    const current = sequence[i];
    if (!prev || !current) {
      continue;
    }
    if (isTransition(prev) === isTransition(current)) {
      errors.push(`Step ${i}: transitions and questions must alternate`);
    }
  }

  const stepLocations = sequence.map((step, index) =>
    getStepLocation(step, questions, index, errors),
  );

  for (let i = 1; i < sequence.length - 1; i += 1) {
    const step = sequence[i];
    if (!step || step.kind === StepKind.QUESTION) {
      continue;
    }
    const before = stepLocations[i - 1];
    const after = stepLocations[i + 1];
    if (before === null || before === undefined || after === null || after === undefined) {
      continue;
    }
    if (step.kind === StepKind.ROOM_TRANSITION && before !== after) {
      errors.push(`Step ${i}: ROOM_TRANSITION between different locations (${before} -> ${after})`);
    }
    if (step.kind === StepKind.LOCATION_TRANSITION && before === after) {
      errors.push(`Step ${i}: LOCATION_TRANSITION inside the same location (${before})`);
    }
  }

  checkExitRooms(sequence, errors);
  checkAnswerLocations(sequence, questions, errors);
  checkNextRoomAnswers(sequence, questions, errors);
  checkDynamicAnswers(sequence, questions, errors);
  checkTeamVariants(sequence, questions, teamSlug, errors);

  return { ok: errors.length === 0, errors };
}

/**
 * Там, где варианты вопроса заведены по именам команд, у команды обязан быть свой:
 * иначе она откроет чужой текст, а ошибку заметят уже на квесте.
 */
function checkTeamVariants(
  sequence: TeamStep[],
  questions: SequenceQuestionLookup,
  teamSlug: string,
  errors: string[],
): void {
  sequence.forEach((step, index) => {
    if (step.kind !== StepKind.QUESTION) {
      return;
    }
    for (const option of step.options) {
      const room = toRoomKey(option);
      const inRoom = questions.get(room) ?? [];
      const named = inRoom.some((question) => question.teamSlugs.length > 0);
      const shared = inRoom.some((question) => question.teamSlugs.length === 0);
      const own = inRoom.some((question) => question.teamSlugs.includes(teamSlug));
      if (named && !shared && !own) {
        errors.push(`Step ${index}: room ${room} has no question variant for this team`);
      }
    }
  });
}

/**
 * До аудитории-ответа команда доходит, не выходя из корпуса: время останавливается только
 * на переходе. Значит, корпус закрывает своя аудитория в `options` перехода.
 */
function checkAnswerLocations(
  sequence: TeamStep[],
  questions: SequenceQuestionLookup,
  errors: string[],
): void {
  sequence.forEach((step, index) => {
    if (step.kind !== StepKind.QUESTION) {
      return;
    }
    const leadsToRoom = step.options
      .flatMap((option) => questions.get(toRoomKey(option)) ?? [])
      .some((question) => question.hasDynamicAnswer || question.nextRoomAnswers.length > 0);
    if (!leadsToRoom) {
      return;
    }
    const stranger = getNextRooms(sequence, index).find(
      (room) => room.location !== step.options[0]?.location,
    );
    if (stranger) {
      errors.push(
        `Step ${index}: answer leads to ${toRoomKey(stranger)} in another location, LOCATION_TRANSITION needs its own room`,
      );
    }
  });
}

/** Аудитория перехода закрывает предыдущий вопрос, поэтому у первого шага её быть не может. */
function checkExitRooms(sequence: TeamStep[], errors: string[]): void {
  const first = sequence[0];
  if (first?.kind === StepKind.LOCATION_TRANSITION && (first.options?.length ?? 0) > 0) {
    errors.push('Step 0: the first LOCATION_TRANSITION closes nothing and takes no rooms');
  }
}

/** Ответом станет следующая аудитория маршрута, поэтому она обязана быть и быть одна. */
function checkDynamicAnswers(
  sequence: TeamStep[],
  questions: SequenceQuestionLookup,
  errors: string[],
): void {
  sequence.forEach((step, index) => {
    if (step.kind !== StepKind.QUESTION) {
      return;
    }
    const dynamic = step.options
      .flatMap((option) => questions.get(toRoomKey(option)) ?? [])
      .filter((question) => question.hasDynamicAnswer);
    if (dynamic.length === 0) {
      return;
    }
    const nextRooms = getNextRooms(sequence, index);
    if (nextRooms.length === 0) {
      errors.push(`Step ${index}: answer is computed from the route, but no room follows`);
      return;
    }
    if (nextRooms.length > 1) {
      errors.push(`Step ${index}: answer is computed from the route, but several rooms follow`);
    }
  });
}

function isTransition(step: TeamStep): boolean {
  return step.kind !== StepKind.QUESTION;
}

/**
 * Вопросы, где ответ — номер следующей аудитории: каждый такой ответ должен вести
 * в ближайшую аудиторию маршрута, иначе команда введёт код и упрётся в тупик.
 */
function checkNextRoomAnswers(
  sequence: TeamStep[],
  questions: SequenceQuestionLookup,
  errors: string[],
): void {
  sequence.forEach((step, index) => {
    if (step.kind !== StepKind.QUESTION) {
      return;
    }
    const answers = step.options
      .flatMap((option) => questions.get(toRoomKey(option)) ?? [])
      .flatMap((question) => question.nextRoomAnswers);
    if (answers.length === 0) {
      return;
    }
    const rooms = getNextRooms(sequence, index);
    if (rooms.length === 0) {
      errors.push(`Step ${index}: answer is the next room number, but no room follows`);
      return;
    }
    const nextRooms = new Set(rooms.map((room) => room.roomNumber));
    for (const answer of new Set(answers)) {
      if (!nextRooms.has(answer.trim())) {
        errors.push(
          `Step ${index}: answer "${answer}" is not a room that follows (${[...nextRooms].join(', ')})`,
        );
      }
    }
  });
}

/** Корпус шага; ошибки про пустые options, неизвестные вопросы и разные корпуса копятся в errors. */
function getStepLocation(
  step: TeamStep,
  questions: SequenceQuestionLookup,
  index: number,
  errors: string[],
): Location | null {
  if (step.kind !== StepKind.QUESTION) {
    return null;
  }
  if (step.options.length === 0) {
    errors.push(`Step ${index}: QUESTION has no options`);
    return null;
  }
  const locations = new Set<Location>();
  for (const option of step.options) {
    const room = toRoomKey(option);
    if (!questions.has(room)) {
      errors.push(`Step ${index}: no question in room ${room}`);
      continue;
    }
    locations.add(option.location);
  }
  if (locations.size > 1) {
    errors.push(`Step ${index}: options span multiple locations (${[...locations].join(', ')})`);
    return null;
  }
  const [location] = locations;
  return location ?? null;
}
