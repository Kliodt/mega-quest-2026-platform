import { Type, type Static } from '@sinclair/typebox';
import { QuestionFieldSchema } from '../dto/questionField.js';

/**
 * `QuestionViewDto.content` Яндекса: заголовок ролика и сам ролик. Ролик у каждой
 * команды свой, поэтому ссылка лежит в её варианте вопроса.
 */
export const YandexQuestionContentSchema = Type.Composite([
  QuestionFieldSchema,
  Type.Object({ videoUrl: Type.String() }),
]);
export type YandexQuestionContentDto = Static<typeof YandexQuestionContentSchema>;
