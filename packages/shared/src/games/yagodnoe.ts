import { Type, type Static } from '@sinclair/typebox';
import { QuestionFieldSchema } from '../dto/questionField.js';

/**
 * `QuestionViewDto.content` Ягодного: вводная, ссылка на анкеты участников и само
 * задание. Анкеты у каждого варианта свои, поэтому ссылка лежит в вопросе.
 */
export const YagodnoeQuestionContentSchema = Type.Composite([
  QuestionFieldSchema,
  Type.Object({
    intro: QuestionFieldSchema,
    tableUrl: Type.String(),
  }),
]);
export type YagodnoeQuestionContentDto = Static<typeof YagodnoeQuestionContentSchema>;
