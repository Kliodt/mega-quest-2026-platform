import { type MinesweeperFieldDto } from '@quest/shared';
import { countAdjacentMines } from './countAdjacentMines.js';

interface CellState {
  opened: boolean;
  blown: boolean;
  flagged: boolean;
}

/** Что написано на клетке: мина, флаг, число соседних мин или ничего. */
export function getCellLabel(
  field: MinesweeperFieldDto | null,
  row: number,
  col: number,
  { opened, blown, flagged }: CellState,
): string {
  if (blown) {
    return '💣';
  }
  if (flagged && !opened) {
    return '🚩';
  }
  if (!opened || field === null) {
    return '';
  }
  const mines = countAdjacentMines(field, row, col);
  if (mines === 0) {
    return '';
  }
  return String(mines);
}
