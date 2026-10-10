import { LocationTitles, type PubBindingDto, type RoomRef } from '@quest/shared';

interface BindingRoom extends RoomRef {
  /** Как аудиторию пишут организаторы; пусто у кодов, заведённых руками в админке */
  roomTitle?: string;
}

/** Код и то, что за ним: название корпуса считается здесь, чтобы фронт не знал справочник. */
export function toPubBindingDto(code: string, room: BindingRoom): PubBindingDto {
  return {
    code,
    location: room.location,
    roomNumber: room.roomNumber,
    roomTitle: room.roomTitle === undefined || room.roomTitle === '' ? room.roomNumber : room.roomTitle,
    locationTitle: LocationTitles[room.location],
  };
}
