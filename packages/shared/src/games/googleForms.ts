import { Type, type Static } from '@sinclair/typebox';
import { QuestionFieldSchema } from '../dto/questionField.js';

/**
 * `QuestionViewDto.content` гугл-форм: описание формы и тема чата, в который команде идти.
 * Иконку темы фронт ставит в шапку формы — по ней команда и понимает, куда именно идти.
 */
export const GoogleFormsQuestionContentSchema = Type.Composite([
  QuestionFieldSchema,
  Type.Object({ topic: Type.String() }),
]);
export type GoogleFormsQuestionContentDto = Static<typeof GoogleFormsQuestionContentSchema>;
