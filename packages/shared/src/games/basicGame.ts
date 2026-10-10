import { Type, type Static } from '@sinclair/typebox';
import { QuestionFieldSchema } from '../dto/questionField.js';

/** Формы basicGame: core передаёт их как `unknown`, читают тип игры и его web-компонент. */

/** `QuestionViewDto.content` у игр из basicGame — формулировка вопроса */
export const BasicQuestionContentSchema = QuestionFieldSchema;
export type BasicQuestionContentDto = Static<typeof BasicQuestionContentSchema>;

/** `answer` в `POST /quest/answer` */
export const BasicAnswerSchema = Type.Object({
  text: Type.String({ maxLength: 500 }),
});
export type BasicAnswerDto = Static<typeof BasicAnswerSchema>;

/** `state` в `PUT /quest/state`: черновик ответа, чтобы не потерять набранное */
export const BasicDraftStateSchema = Type.Object({
  draft: Type.String({ maxLength: 500 }),
});
export type BasicDraftStateDto = Static<typeof BasicDraftStateSchema>;

/** Вопрос глазами организатора: с правильными ответами и содержимым подсказок */
export const BasicAdminQuestionSchema = Type.Composite([
  QuestionFieldSchema,
  Type.Object({
    /** У вопроса с вычисляемым ответом пусто: ответ появляется при открытии */
    acceptedAnswers: Type.Array(QuestionFieldSchema),
    wrongAttemptPenaltySeconds: Type.Integer({ minimum: 0 }),
    /** Ответ — номер следующей аудитории команды */
    answerIsNextRoom: Type.Boolean(),
    /** Номер подставляет ядро по маршруту команды, а не организатор заранее */
    hasDynamicAnswer: Type.Boolean(),
    hints: Type.Array(
      Type.Composite([
        QuestionFieldSchema,
        Type.Object({ penaltySeconds: Type.Integer({ minimum: 0 }) }),
      ]),
    ),
  }),
]);
export type BasicAdminQuestionDto = Static<typeof BasicAdminQuestionSchema>;
