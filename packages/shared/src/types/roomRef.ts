import { type Location } from '../enums.js';

/** Аудитория: корпус и номер. Вопрос в аудитории один, поэтому пара его и опознаёт. */
export interface RoomRef {
  location: Location;
  roomNumber: string;
}

/** Ключ аудитории для словарей: пара «корпус + аудитория» одной строкой. */
export function toRoomKey({ location, roomNumber }: RoomRef): string {
  return `${location}/${roomNumber}`;
}
