import { GameType, type GoogleFormsQuestionContentDto } from '@quest/shared';
import { toQuestionFieldDto } from '../../utils/question/toQuestionFieldDto.js';
import { type GameTypeDefinition } from '../types.js';
import { googleFormsExtraFields, type GoogleFormsQuestion } from './schema.js';

/**
 * Вся механика вне платформы: команда заполняет форму регистрации и идёт в чат темы,
 * иконка которой стоит в шапке формы. Описание формы и тема у каждой команды свои.
 */
export const googleFormsGameType: GameTypeDefinition<GoogleFormsQuestion> = {
  gameType: GameType.GOOGLE_FORMS,
  extraFields: googleFormsExtraFields,
  toPublicContent: (question): GoogleFormsQuestionContentDto => ({
    ...toQuestionFieldDto(question),
    topic: question.topic,
  }),
};
