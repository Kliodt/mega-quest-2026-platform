import { describe, expect, it } from 'vitest';
import { readMinesweeperCells } from './readMinesweeperCells.js';

const CONTENT = {
  html: 'Откройте все клетки без мин.',
  cells: [
    { code: 'A59Y8UXZ', row: 0, col: 0 },
    { code: 'AKXFG3XZ', row: 5, col: 9 },
  ],
};

describe('readMinesweeperCells', () => {
  it('находит клетку по коду независимо от регистра и пробелов', () => {
    const cells = readMinesweeperCells(CONTENT);
    expect(cells.get('a59y8uxz')).toEqual({ code: 'A59Y8UXZ', row: 0, col: 0 });
    expect(cells.size).toBe(2);
  });

  it('пустое содержимое даёт пустой словарь', () => {
    expect(readMinesweeperCells(null).size).toBe(0);
    expect(readMinesweeperCells({ html: 'без клеток' }).size).toBe(0);
  });
});
