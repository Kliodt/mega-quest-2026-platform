import { Type, type Static } from '@sinclair/typebox';

/** Кусок содержимого: `html` — текст (он же разметка), `data` — JSON механики. */
export const QuestionFieldSchema = Type.Object({
  html: Type.String(),
  data: Type.Optional(Type.Unknown()),
});
export type QuestionFieldDto = Static<typeof QuestionFieldSchema>;
