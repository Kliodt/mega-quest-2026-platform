import { StepKind, toRoomKey } from '@quest/shared';
import { QuestionStateModel } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';
import { readOpenQuestion } from '../openQuestion/readOpenQuestion.js';
import { readQuestionsByRooms } from '../question/readQuestionsByRooms.js';
import { type QuestContext } from './types.js';

/** Состояния, вопросы маршрута и открытый вопрос команды одним чтением. */
export async function readQuestContext(team: TeamDocument): Promise<QuestContext> {
  const rooms = new Map(
    team.sequence
      .flatMap((step) => (step.kind === StepKind.QUESTION ? step.options : []))
      .map((option) => [toRoomKey(option), option]),
  );
  const [states, questionsByRoom] = await Promise.all([
    QuestionStateModel.find({ teamId: team._id }).sort({ stepIndex: 1 }),
    readQuestionsByRooms([...rooms.values()]),
  ]);
  const open = await readOpenQuestion(team, states);
  return { team, states, questionsByRoom, open };
}
