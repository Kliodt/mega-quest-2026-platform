import { type ProgressDto, type QuestionViewDto } from '@quest/shared';
import { type TeamDocument } from '../../models/Team.js';
import { toProgressDto } from '../../utils/progress/toProgressDto.js';
import { toQuestionViewDto } from '../../utils/question/toQuestionViewDto.js';
import { toTeamDto } from '../../utils/team/toTeamDto.js';
import { readLocationNote } from './readLocationNote.js';
import { readQuestContext } from './readQuestContext.js';

export async function getProgress(team: TeamDocument, now = new Date()): Promise<ProgressDto> {
  const [context, transitionHtml] = await Promise.all([
    readQuestContext(team),
    readLocationNote(team.sequence, team.currentStepIndex),
  ]);
  let question: QuestionViewDto | null = null;
  if (context.open) {
    question = toQuestionViewDto(context.open);
  }
  return toProgressDto({
    team: toTeamDto(team),
    sequence: team.sequence,
    currentStepIndex: team.currentStepIndex,
    states: context.states,
    questionsByRoom: context.questionsByRoom,
    timeAdjustments: team.timeAdjustments,
    question,
    transitionHtml,
    now,
  });
}
