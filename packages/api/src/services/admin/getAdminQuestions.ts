import { type AdminQuestionsDto } from '@quest/shared';
import { gameTypeRegistry } from '../../games/registry.js';
import { QuestionModel, type QuestionDocument } from '../../models/Question.js';
import { TeamModel } from '../../models/Team.js';
import { toAdminQuestionDto } from '../../utils/question/toAdminQuestionDto.js';
import { toBasicAdminQuestionDto } from '../../utils/question/toBasicAdminQuestionDto.js';

/** Все вопросы с правильными ответами; форму `content` знает тип игры. */
export async function getAdminQuestions(): Promise<AdminQuestionsDto> {
  const [questions, teams] = await Promise.all([
    QuestionModel.find().sort({ location: 1, roomNumber: 1 }),
    TeamModel.find().select('slug name').lean(),
  ]);
  const teamNamesBySlug = new Map(teams.map((team) => [team.slug, team.name]));
  return {
    questions: questions.map((question) =>
      toAdminQuestionDto(question, toContent(question), teamNamesBySlug),
    ),
  };
}

function toContent(question: QuestionDocument): unknown {
  const { toAdminContent } = gameTypeRegistry[question.gameType];
  if (!toAdminContent) {
    return toBasicAdminQuestionDto(question);
  }
  return toAdminContent(question);
}
