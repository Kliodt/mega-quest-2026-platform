import { toRoomKey, type AdminBindingDto, type RoomRef } from '@quest/shared';

interface BindingInput extends RoomRef {
  code: string;
  /** Как аудиторию пишут организаторы; пусто у кодов, заведённых руками в админке */
  roomTitle?: string;
}

/** Коды на дверях для организатора: рядом с каждым видно, сколько вопросов в его аудитории. */
export function toAdminBindingDtos(
  bindings: BindingInput[],
  questionRooms: RoomRef[],
): AdminBindingDto[] {
  const counts = new Map<string, number>();
  for (const room of questionRooms) {
    counts.set(toRoomKey(room), (counts.get(toRoomKey(room)) ?? 0) + 1);
  }
  return bindings.map(({ code, location, roomNumber, roomTitle }) => ({
    code,
    location,
    roomNumber,
    roomTitle: roomTitle === undefined || roomTitle === '' ? roomNumber : roomTitle,
    questionsCount: counts.get(toRoomKey({ location, roomNumber })) ?? 0,
  }));
}
