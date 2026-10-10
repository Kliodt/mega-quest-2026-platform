import { Location, LocationTitles, type RoomRef } from '@quest/shared';
import { BINDING_CODE_PATTERN } from '../../models/Binding.js';
import { readRoomNumber } from '../csv/readRoomNumber.js';

const CODE_COLUMN = 'code';
const LOCATION_COLUMN = 'location';
/** В таблице организаторов колонка называется `room`, в наших данных — `roomNumber` */
const ROOM_COLUMNS = ['room', 'roomNumber'];

/** Корпус в таблице пишут и кодом (`lomo`), и названием («Ломоносова») */
const LOCATION_BY_TITLE = new Map<string, Location>(
  Object.values(Location).flatMap((location) => [
    [location, location] as const,
    [LocationTitles[location].toLowerCase(), location] as const,
  ]),
);

export interface BindingRoom extends RoomRef {
  /** Ячейка таблицы целиком: организаторы пишут аудиторию с пометкой корпуса */
  roomTitle: string;
}

/** Коды на дверях из таблицы организаторов: код → аудитория. */
export function toBindingsByCode(rows: Record<string, string>[]): Map<string, BindingRoom> {
  const columns = Object.keys(rows[0] ?? {});
  const roomColumn = ROOM_COLUMNS.find((column) => columns.includes(column));
  if (roomColumn === undefined) {
    throw new Error(`В таблице нет колонки с аудиторией. Есть такие: ${columns.join(', ')}`);
  }
  for (const column of [CODE_COLUMN, LOCATION_COLUMN]) {
    if (!columns.includes(column)) {
      throw new Error(`В таблице нет колонки «${column}». Есть такие: ${columns.join(', ')}`);
    }
  }

  const bindings = new Map<string, BindingRoom>();
  rows.forEach((row, index) => {
    const code = row[CODE_COLUMN]?.trim() ?? '';
    const roomTitle = (row[roomColumn] ?? '').trim();
    const roomNumber = readRoomNumber(roomTitle);
    const location = LOCATION_BY_TITLE.get((row[LOCATION_COLUMN] ?? '').trim().toLowerCase());
    if (code === '' && roomNumber === '') {
      return;
    }

    const place = `строка ${index + 2}`;
    if (!BINDING_CODE_PATTERN.test(code)) {
      throw new Error(
        `${place}: код ${JSON.stringify(code)} не подходит под ${String(BINDING_CODE_PATTERN)}`,
      );
    }
    if (location === undefined) {
      throw new Error(`${place}: неизвестный корпус ${JSON.stringify(row[LOCATION_COLUMN])}`);
    }
    if (roomNumber === '') {
      throw new Error(`${place}: пустая аудитория`);
    }
    if (bindings.has(code)) {
      throw new Error(`${place}: код ${code} встречается второй раз`);
    }
    bindings.set(code, { location, roomNumber, roomTitle });
  });

  return bindings;
}
