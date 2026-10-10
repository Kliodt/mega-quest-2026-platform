import { Type, type Static } from '@sinclair/typebox';
import { StepKind } from '../enums.js';
import { RoomRefSchema } from './roomRef.js';

/** TypeBox-версия `TeamStep` для запросов и ответов админки. */
export const TeamStepSchema = Type.Union([
  Type.Object({
    kind: Type.Literal(StepKind.LOCATION_TRANSITION),
    /** Аудитория, скан которой закрывает предыдущий вопрос; у первого шага маршрута её нет */
    options: Type.Optional(Type.Array(RoomRefSchema, { minItems: 1 })),
  }),
  Type.Object({ kind: Type.Literal(StepKind.ROOM_TRANSITION) }),
  Type.Object({
    kind: Type.Literal(StepKind.QUESTION),
    options: Type.Array(RoomRefSchema, { minItems: 1 }),
  }),
]);
export type TeamStepDto = Static<typeof TeamStepSchema>;
