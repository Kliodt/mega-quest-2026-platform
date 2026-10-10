import { GameType, type YagodnoeQuestionContentDto } from '@quest/shared';
import { toQuestionFieldDto } from '../../utils/question/toQuestionFieldDto.js';
import { type GameTypeDefinition } from '../types.js';
import { yagodnoeExtraFields, type YagodnoeQuestion } from './schema.js';

/** Расселение по анкетам: команда читает таблицу варианта и вводит ответ строкой. */
export const yagodnoeGameType: GameTypeDefinition<YagodnoeQuestion> = {
  gameType: GameType.YAGODNOE,
  extraFields: yagodnoeExtraFields,
  toPublicContent: (question): YagodnoeQuestionContentDto => ({
    ...toQuestionFieldDto(question),
    intro: toQuestionFieldDto(question.intro),
    tableUrl: question.tableUrl,
  }),
};
