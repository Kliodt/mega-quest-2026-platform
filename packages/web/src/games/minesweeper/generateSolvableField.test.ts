import { describe, expect, it } from 'vitest';
import { generateSolvableField, isSolvableWithoutGuessing } from './generateSolvableField.js';
import { MINESWEEPER_SIZE } from './minesweeperSize.js';

const { rows, cols, mines } = MINESWEEPER_SIZE;
const FIRST_CLICK = { row: 4, col: 2 };

function countMines(field: boolean[][]): number {
  return field.reduce((count, row) => count + row.filter((isMine) => isMine).length, 0);
}

/** Поле из строк: `*` — мина, `.` — пусто. */
function toField(...lines: string[]): boolean[][] {
  return lines.map((line) => [...line].map((cell) => cell === '*'));
}

describe('isSolvableWithoutGuessing', () => {
  it('поле, где всё выводится из цифр', () => {
    const field = toField('....', '....', '..*.', '....');

    expect(isSolvableWithoutGuessing(field, { row: 0, col: 0 })).toBe(true);
  });

  /** Мина в углу за единственной цифрой: какая из двух клеток заминирована, не вывести */
  it('поле, где без угадывания не обойтись', () => {
    const field = toField('..*', '...', '*..');

    expect(isSolvableWithoutGuessing(field, { row: 1, col: 1 })).toBe(false);
  });
});

describe('generateSolvableField', () => {
  it('раскладывает поле нужного размера с нужным числом мин', () => {
    const field = generateSolvableField(rows, cols, mines, FIRST_CLICK);

    expect(field.length).toBe(rows);
    expect(field[0]?.length).toBe(cols);
    expect(countMines(field)).toBe(mines);
  });

  it('оставляет клетку первого клика и соседей без мин', () => {
    const field = generateSolvableField(rows, cols, mines, FIRST_CLICK);

    for (let row = FIRST_CLICK.row - 1; row <= FIRST_CLICK.row + 1; row += 1) {
      for (let col = FIRST_CLICK.col - 1; col <= FIRST_CLICK.col + 1; col += 1) {
        expect(field[row]?.[col]).not.toBe(true);
      }
    }
  });

  /** Ради этого всё и затевалось: команда должна проходить поле рассуждением */
  it('выдаёт поля, решаемые без угадывания', () => {
    const fields = Array.from({ length: 5 }, () =>
      generateSolvableField(rows, cols, mines, FIRST_CLICK),
    );

    const solvable = fields.filter((field) => isSolvableWithoutGuessing(field, FIRST_CLICK));
    expect(solvable.length).toBe(fields.length);
  });
});
