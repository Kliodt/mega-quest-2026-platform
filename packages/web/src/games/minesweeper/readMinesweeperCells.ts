import { type MinesweeperCellDto, type MinesweeperQuestionContentDto } from '@quest/shared';

/**
 * Коды клеток из содержимого вопроса по самому коду: команда сканирует QR в аудитории,
 * и по нему выбирается клетка поля. Регистр кода не важен, как и у кодов на дверях.
 */
export function readMinesweeperCells(content: unknown): Map<string, MinesweeperCellDto> {
  const cells = new Map<string, MinesweeperCellDto>();
  if (typeof content !== 'object' || content === null) {
    return cells;
  }
  const list = (content as Partial<MinesweeperQuestionContentDto>).cells;
  if (!Array.isArray(list)) {
    return cells;
  }
  for (const cell of list) {
    if (typeof cell?.code === 'string' && cell.code !== '') {
      cells.set(cell.code.trim().toLowerCase(), cell);
    }
  }
  return cells;
}
