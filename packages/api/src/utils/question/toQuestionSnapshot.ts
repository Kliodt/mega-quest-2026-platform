import { type TeamStep } from '@quest/shared';
import { type QuestionDocument } from '../../models/Question.js';
import { type Question, type QuestionField } from '../../models/questionFields.js';
import { DynamicAnswerMissingError } from '../errors/index.js';
import { getNextRooms } from '../sequence/getNextRooms.js';

/** Вопрос, каким его увидит команда: снимок документа с уже посчитанными ответами. */
export function toQuestionSnapshot(
  question: QuestionDocument,
  sequence: TeamStep[],
  stepIndex: number,
): Question {
  const snapshot = question.toObject<Question>();
  if (!snapshot.hasDynamicAnswer) {
    return snapshot;
  }
  return { ...snapshot, acceptedAnswers: readNextRoomAnswers(question, sequence, stepIndex) };
}

/** Ближайшая аудитория маршрута: следующий вопрос или выход из корпуса. */
function readNextRoomAnswers(
  question: QuestionDocument,
  sequence: TeamStep[],
  stepIndex: number,
): QuestionField[] {
  const rooms = new Set(getNextRooms(sequence, stepIndex).map((room) => room.roomNumber));
  if (rooms.size === 0) {
    throw new DynamicAnswerMissingError(question.rooms, stepIndex);
  }
  return [...rooms].map((roomNumber) => ({ html: roomNumber }));
}
