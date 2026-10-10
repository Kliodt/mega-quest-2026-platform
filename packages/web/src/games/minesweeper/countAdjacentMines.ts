import { type MinesweeperFieldDto } from '@quest/shared';

/** Сколько мин в восьми соседних клетках; клетки за краем поля не считаются. */
export function countAdjacentMines(field: MinesweeperFieldDto, row: number, col: number): number {
  let mines = 0;
  for (let nearRow = row - 1; nearRow <= row + 1; nearRow += 1) {
    for (let nearCol = col - 1; nearCol <= col + 1; nearCol += 1) {
      const isSelf = nearRow === row && nearCol === col;
      if (!isSelf && field[nearRow]?.[nearCol] === true) {
        mines += 1;
      }
    }
  }
  return mines;
}
