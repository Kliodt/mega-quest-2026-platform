import { Location, StepKind, type RoomRef, type TeamStep } from '@quest/shared';
import { readRoomNumber } from '../utils/csv/readRoomNumber.js';

/** Команда из таблицы организаторов: имя, пароль и собранный по колонкам маршрут. */
export interface TeamData {
  /** Постоянное имя в данных: на него ссылаются варианты вопросов */
  slug: string;
  name: string;
  password: string;
  sequence: TeamStep[];
}

/** Порядок корпусов лежит в отдельных колонках, названия там свои. */
const LOCATION_BY_TITLE: Record<string, Location> = {
  Грива: Location.GRIVA,
  Чайка: Location.CHAIKA,
  Биржа: Location.BIRJA,
  Ломо: Location.LOMO,
  Кронва: Location.CRONVA,
};

/**
 * Колонки корпуса по порядку: первая — вход, последняя — аудитория выхода, между ними станции.
 * Пустая колонка (`-`) значит, что у команды этого шага нет.
 */
const COLUMNS_BY_LOCATION: Record<Location, string[]> = {
  [Location.GRIVA]: ['Грива 1', 'Грива 2', 'Грива 3', 'Грива 4'],
  [Location.CHAIKA]: ['Чайка 1', 'Чайка 2', 'Чайка 3', 'Чайка 4'],
  [Location.BIRJA]: ['Биржа 1', 'Биржа 2', 'Биржа 3', 'Биржа 4'],
  [Location.LOMO]: ['ломо 1', 'ломо 2', 'ломо 3', 'ломо 4', 'ломо 5', 'ломо 6'],
  [Location.CRONVA]: ['крон 1', 'крон 2', 'крон 3', 'крон 4', 'крон 5', 'крон 6', 'крон 7'],
};

/** Вход в корпус — всегда первая аудитория. */
const ENTRANCE_ROOM = '1';

/** У колонок с описанием станция одна, а номер в тексте — не её. */
const ROOMS_BY_DESCRIPTION: Record<string, string[]> = {
  // Телевизоры стоят у лифта, а 1603–1609 — куда команда уходит с ответом
  'Лифт 6 этаж': ['1600'],
};

export function toTeamData(row: Record<string, string>): TeamData | null {
  const locations = ['порядок 1', 'порядок 2', 'порядок 3']
    .map((column) => LOCATION_BY_TITLE[row[column]?.trim() ?? ''])
    .filter((location): location is Location => location !== undefined);
  if (locations.length === 0) {
    return null;
  }

  return {
    slug: row.slug?.trim() ?? '',
    name: row['название']?.trim() ?? '',
    password: row.pass?.trim() ?? '',
    sequence: toSequence(row, locations),
  };
}

/** Маршрут: приезд в корпус, его станции через переходы, выход — и так по всем корпусам. */
function toSequence(row: Record<string, string>, locations: Location[]): TeamStep[] {
  const sequence: TeamStep[] = [{ kind: StepKind.LOCATION_TRANSITION }];

  for (const location of locations) {
    const stops = COLUMNS_BY_LOCATION[location]
      .map((column) => toRooms(location, column, row[column] ?? ''))
      .filter((rooms) => rooms.length > 0);
    const exit = stops.pop();

    stops.forEach((rooms, index) => {
      if (index > 0) {
        sequence.push({ kind: StepKind.ROOM_TRANSITION });
      }
      sequence.push({ kind: StepKind.QUESTION, options: rooms });
    });
    // Скан аудитории выхода закрывает корпус, а в конце маршрута — весь квест
    sequence.push({ kind: StepKind.LOCATION_TRANSITION, options: exit ?? [] });
  }
  return sequence;
}

/** Аудитории одной колонки: пусто, одна станция или несколько, между которыми выбирает скан. */
function toRooms(location: Location, column: string, cell: string): RoomRef[] {
  const value = cell.trim();
  if (value === '' || value === '-') {
    return [];
  }
  return toRoomNumbers(column, value).map((roomNumber) => ({ location, roomNumber }));
}

function toRoomNumbers(column: string, value: string): string[] {
  if (value.startsWith('Вход')) {
    return [ENTRANCE_ROOM];
  }
  const described = Object.entries(ROOMS_BY_DESCRIPTION).find(([prefix]) =>
    value.startsWith(prefix),
  );
  if (described) {
    return described[1];
  }
  if (value.startsWith('QR')) {
    // «QR 2241 → 1316 / 1404 / 1405»: станция — аудитория с QR, остальное это его ответы
    return [readRoomNumber(value.slice('QR'.length))];
  }
  if (value.includes('→')) {
    return toMappedRooms(column, value);
  }
  // «301 (Б16)»: корпус Биржи в скобках, платформа знает только номер
  return [readRoomNumber(value)];
}

/**
 * Колонка вида «1603→3408; 1604→3412»: слева аудитории, куда команду отправили, справа —
 * куда она уходит дальше.
 *
 * На Ломоносова вопрос стоит справа (в 3408), туда команда и идёт сканировать код.
 * На Кронверкском слева стоят 1316/1404/1405 — там нет ни кодов, ни вопросов: команда
 * приходит туда за ответом на вопрос, который уже открыт, и набирает его руками.
 * Шага такая колонка не даёт: правая половина и так стоит следующей колонкой.
 */
function toMappedRooms(column: string, value: string): string[] {
  if (column.startsWith('крон')) {
    return [];
  }
  return value
    .split(';')
    .map((pair) => pair.split('→')[1] ?? '')
    .map(readRoomNumber)
    .filter((roomNumber) => roomNumber !== '');
}
