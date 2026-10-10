import { type MinesweeperFieldDto, type MinesweeperStateDto } from '@quest/shared';

/** Поле из состояния прохождения: его разложил фронт при первом открытии вопроса. */
export function readMinesweeperField(state: unknown): MinesweeperFieldDto | null {
  if (typeof state !== 'object' || state === null) {
    return null;
  }
  const field = (state as Partial<MinesweeperStateDto>).field;
  if (!Array.isArray(field) || field.length === 0) {
    return null;
  }
  const rows = field.filter(isCellRow);
  return rows.length === field.length ? rows : null;
}

function isCellRow(row: unknown): row is boolean[] {
  return Array.isArray(row) && row.every((cell) => typeof cell === 'boolean');
}
