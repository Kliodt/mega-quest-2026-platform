import { type MinesweeperFieldDto } from '@quest/shared';
import { countAdjacentMines } from './countAdjacentMines.js';

interface Cell {
  row: number;
  col: number;
}

/** Открывает клетку и соседние, если вокруг нет мин; клетка — номер `row * cols + col`. */
export function openMinesweeperCells(
  field: MinesweeperFieldDto,
  openedCells: ReadonlySet<number>,
  row: number,
  col: number,
): Set<number> {
  const cols = field[0]?.length ?? 0;
  const opened = new Set(openedCells);
  const queue: Cell[] = [{ row, col }];

  while (queue.length > 0) {
    const cell = queue.pop();
    if (cell === undefined) {
      break;
    }
    const isMine = field[cell.row]?.[cell.col];
    if (isMine === undefined || isMine) {
      continue;
    }
    const index = cell.row * cols + cell.col;
    if (opened.has(index)) {
      continue;
    }
    opened.add(index);
    if (countAdjacentMines(field, cell.row, cell.col) === 0) {
      queue.push(...getNeighbours(cell));
    }
  }

  return opened;
}

function getNeighbours({ row, col }: Cell): Cell[] {
  const neighbours: Cell[] = [];
  for (let nearRow = row - 1; nearRow <= row + 1; nearRow += 1) {
    for (let nearCol = col - 1; nearCol <= col + 1; nearCol += 1) {
      if (nearRow !== row || nearCol !== col) {
        neighbours.push({ row: nearRow, col: nearCol });
      }
    }
  }
  return neighbours;
}
