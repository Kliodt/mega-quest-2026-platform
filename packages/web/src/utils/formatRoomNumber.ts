/**
 * Места, у которых вместо номера на двери своё имя: точка сбора и лифтовый холл.
 * К такому имени «ауд.» не приписывают — это не аудитория.
 */
const ROOM_TITLES: Record<string, string> = {
  '1': 'Начало',
  '1600': '6 этаж',
};

/** Номер аудитории глазами команды. */
export function formatRoomNumber(roomNumber: string): string {
  return ROOM_TITLES[roomNumber] ?? roomNumber;
}

/** У места со своим именем номера нет, поэтому и слова «ауд.» рядом быть не должно. */
export function isNamedPlace(roomNumber: string): boolean {
  return roomNumber in ROOM_TITLES;
}

/** Несколько аудиторий одного шага: «1216 / 1218» */
export function formatRoomNumbers(roomNumbers: string[]): string {
  return roomNumbers.map(formatRoomNumber).join(' / ');
}
