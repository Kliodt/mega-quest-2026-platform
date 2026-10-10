import { Type, type Static } from '@sinclair/typebox';
import { QuestionFieldSchema } from '../dto/questionField.js';

/** Вопрос викторины: формулировка и варианты, из которых команда выбирает один. */
export const BlitzQuizItemSchema = Type.Composite([
  QuestionFieldSchema,
  Type.Object({
    options: Type.Array(QuestionFieldSchema),
    /** Викторина к ответу не ведёт, счёт команда ведёт у себя */
    correctOption: Type.Integer({ minimum: 0 }),
  }),
]);
export type BlitzQuizItemDto = Static<typeof BlitzQuizItemSchema>;

/** Викторина к ответу не ведёт: аудиторию ядро кладёт в `answers` вопроса. */
export const BlitzQuestionContentSchema = Type.Composite([
  QuestionFieldSchema,
  Type.Object({ quiz: Type.Array(BlitzQuizItemSchema) }),
]);
export type BlitzQuestionContentDto = Static<typeof BlitzQuestionContentSchema>;

/**
 * Что о раунде знает сервер (`PUT /quest/state`) — только число законченных попыток,
 * удачных и нет. От него зависит, насколько бледны тексты вопросов: каждая попытка
 * отнимает у них немного непрозрачности. Сам ход раунда живёт на экране команды.
 */
export const BlitzStateSchema = Type.Object({
  attempts: Type.Integer({ minimum: 0 }),
});
export type BlitzStateDto = Static<typeof BlitzStateSchema>;
