import { StepKind, type TeamStep } from '@quest/shared';
import { LocationNoteModel } from '../../models/LocationNote.js';
import { getNextQuestionLocation } from '../../utils/sequence/getNextQuestionLocation.js';
import { getPreviousQuestionLocation } from '../../utils/sequence/getPreviousQuestionLocation.js';

/**
 * Текст организаторов про дорогу в следующий корпус. Читается только на переходе между
 * корпусами: на остальных шагах команде его показывать негде. Текст для этой пары корпусов
 * побеждает общий: дорога зависит и от того, откуда команда идёт.
 */
export async function readLocationNote(
  sequence: TeamStep[],
  currentStepIndex: number,
): Promise<string | null> {
  if (sequence[currentStepIndex]?.kind !== StepKind.LOCATION_TRANSITION) {
    return null;
  }
  const location = getNextQuestionLocation(sequence, currentStepIndex);
  if (location === null) {
    return null;
  }
  const from = getPreviousQuestionLocation(sequence, currentStepIndex);
  const notes = await LocationNoteModel.find({ location, from: { $in: [from, null] } });
  const exact = notes.find((note) => note.from === from);
  const common = notes.find((note) => note.from === null);
  return (exact ?? common)?.html ?? null;
}
