import { type TeamDocument } from '../../models/Team.js';
import { NoOpenQuestionError } from '../../utils/errors/index.js';
import { type OpenQuestionContext } from '../../utils/question/types.js';
import { assertNotFinished } from '../../utils/team/assertNotFinished.js';
import { readOpenQuestion } from './readOpenQuestion.js';

/** Как readOpenQuestion, но для действий команды: без открытого вопроса — 409. */
export async function requireOpenQuestion(team: TeamDocument): Promise<OpenQuestionContext> {
  assertNotFinished(team);
  const open = await readOpenQuestion(team);
  if (!open) {
    throw new NoOpenQuestionError();
  }
  return open;
}
