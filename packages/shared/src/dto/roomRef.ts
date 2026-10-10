import { Type, type Static } from '@sinclair/typebox';
import { Location } from '../enums.js';

/** Аудитория: корпус и номер. Вопрос в аудитории один, поэтому пара его и опознаёт. */
export const RoomRefSchema = Type.Object({
  location: Type.Enum(Location),
  roomNumber: Type.String({ minLength: 1 }),
});
export type RoomRefDto = Static<typeof RoomRefSchema>;
