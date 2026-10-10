import { GameType, type YandexQuestionContentDto } from '@quest/shared';
import { toQuestionFieldDto } from '../../utils/question/toQuestionFieldDto.js';
import { type GameTypeDefinition } from '../types.js';
import { yandexExtraFields, type YandexQuestion } from './schema.js';

/** У каждой команды свой ролик с геометкой; ответ — расшифрованное слово, строкой. */
export const yandexGameType: GameTypeDefinition<YandexQuestion> = {
  gameType: GameType.YANDEX,
  extraFields: yandexExtraFields,
  toPublicContent: (question): YandexQuestionContentDto => ({
    ...toQuestionFieldDto(question),
    videoUrl: question.videoUrl,
  }),
};
