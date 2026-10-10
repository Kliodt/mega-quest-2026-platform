import { GameType, type BlitzQuestionContentDto } from '@quest/shared';
import { toQuestionFieldDto } from '../../utils/question/toQuestionFieldDto.js';
import { type GameTypeDefinition } from '../types.js';
import { blitzExtraFields, type BlitzQuestion } from './schema.js';

/** Викторина к ответу не ведёт; аудиторию ядро отдаёт по `shouldSendAnswer`. */
export const blitzGameType: GameTypeDefinition<BlitzQuestion> = {
  gameType: GameType.BLITZ,
  extraFields: blitzExtraFields,
  toPublicContent: (question): BlitzQuestionContentDto => ({
    ...toQuestionFieldDto(question),
    quiz: question.quiz.map((item) => ({
      ...toQuestionFieldDto(item),
      options: item.options.map(toQuestionFieldDto),
      correctOption: item.correctOption,
    })),
  }),
};
