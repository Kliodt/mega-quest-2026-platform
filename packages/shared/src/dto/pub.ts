import { Type, type Static } from '@sinclair/typebox';
import { RoomRefSchema } from './roomRef.js';

export const PubCodeParamsSchema = Type.Object({
  code: Type.String({ pattern: '^[a-zA-Z0-9]{8}$' }),
});
export type PubCodeParamsDto = Static<typeof PubCodeParamsSchema>;

/** Номер внешнего механизма: у sound buttons это номер дрампада в аудитории. */
export const PubExternalCodeParamsSchema = Type.Object({
  code: Type.Integer({ minimum: 0 }),
});
export type PubExternalCodeParamsDto = Static<typeof PubExternalCodeParamsSchema>;

/** Кому засчитан ответ, пришедший от внешнего механизма. */
export const PubExternalAnswerSchema = Type.Object({
  teamName: Type.String(),
  roomNumber: Type.String(),
});
export type PubExternalAnswerDto = Static<typeof PubExternalAnswerSchema>;

/** Клетка поля за кодом: нумерация с нуля, как в данных вопроса. */
export const PubQuestionCellSchema = Type.Object({
  row: Type.Integer({ minimum: 0 }),
  col: Type.Integer({ minimum: 0 }),
});
export type PubQuestionCellDto = Static<typeof PubQuestionCellSchema>;

/** Что за дверь открывает код: аудитория, корпус и его название для экрана. */
export const PubBindingSchema = Type.Composite([
  RoomRefSchema,
  Type.Object({
    code: Type.String(),
    locationTitle: Type.String(),
    /** Аудитория, как её пишут организаторы: с корпусом Биржи и прочими пометками */
    roomTitle: Type.String(),
  }),
]);
export type PubBindingDto = Static<typeof PubBindingSchema>;
