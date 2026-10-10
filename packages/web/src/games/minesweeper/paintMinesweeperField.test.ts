import { describe, expect, it } from 'vitest';
import { MINESWEEPER_SIZE } from './minesweeperSize.js';
import { paintMinesweeperField, type MinesweeperPaintState } from './paintMinesweeperField.js';

interface PaintedCell {
  fill: string;
  stroke: string;
  lineWidth: number;
}

interface PaintedLabel {
  text: string;
  x: number;
  y: number;
}

/** Канвы в тестах нет: записываем вызовы и смотрим, что нарисовано */
function toRecordingContext(): {
  context: CanvasRenderingContext2D;
  cells: PaintedCell[];
  labels: PaintedLabel[];
} {
  const cells: PaintedCell[] = [];
  const labels: PaintedLabel[] = [];
  let pending: PaintedCell | null = null;
  const context = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    beginPath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    closePath: () => undefined,
    fill(): void {
      pending = { fill: String(this.fillStyle), stroke: '', lineWidth: 0 };
    },
    stroke(): void {
      if (pending !== null) {
        cells.push({ ...pending, stroke: String(this.strokeStyle), lineWidth: this.lineWidth });
        pending = null;
      }
    },
    fillText(text: string, x: number, y: number): void {
      labels.push({ text, x, y });
    },
  };
  return { context: context as unknown as CanvasRenderingContext2D, cells, labels };
}

/** Код 100×100 в середине кадра 640×480 */
const CORNERS = [
  { x: 270, y: 190 },
  { x: 370, y: 190 },
  { x: 370, y: 290 },
  { x: 270, y: 290 },
];
const BOX = { width: 640, height: 480 };

function toState(overrides: Partial<MinesweeperPaintState> = {}): MinesweeperPaintState {
  return {
    anchor: { code: 'x', row: 2, col: 4 },
    field: null,
    openedCells: new Set(),
    blownCells: new Set(),
    flaggedCells: new Set(),
    ...overrides,
  };
}

describe('paintMinesweeperField', () => {
  it('без кода в кадре ничего не рисует', () => {
    const { context, cells } = toRecordingContext();

    paintMinesweeperField(context, [], toState(), BOX);

    expect(cells).toHaveLength(0);
  });

  it('рисует клетки вокруг кода и выделяет его клетку', () => {
    const { context, cells } = toRecordingContext();

    paintMinesweeperField(context, CORNERS, toState(), BOX);

    expect(cells.length).toBeGreaterThan(1);
    expect(cells.filter((cell) => cell.stroke === '#5aa0ff')).toHaveLength(1);
    expect(cells.every((cell) => cell.fill === 'rgba(255, 255, 255, 0.12)')).toBe(true);
  });

  it('открытая клетка тёмная и с числом соседних мин', () => {
    const { context, cells, labels } = toRecordingContext();
    const { cols } = MINESWEEPER_SIZE;
    const opened = 2 * cols + 4;
    const field = Array.from({ length: MINESWEEPER_SIZE.rows }, () =>
      Array.from({ length: cols }, () => false),
    );
    field[1]![4] = true;

    paintMinesweeperField(
      context,
      CORNERS,
      toState({ field, openedCells: new Set([opened]) }),
      BOX,
    );

    expect(cells.some((cell) => cell.fill === 'rgba(2, 5, 13, 0.55)')).toBe(true);
    expect(labels).toHaveLength(1);
    expect(labels[0]?.text).toBe('1');
    // Число стоит в середине клетки кода, а она в середине кадра
    expect(labels[0]?.x).toBeCloseTo(320);
    expect(labels[0]?.y).toBeCloseTo(240);
  });

  it('подорванная клетка красная с миной, помеченная — с флагом', () => {
    const { context, cells, labels } = toRecordingContext();
    const { cols } = MINESWEEPER_SIZE;

    paintMinesweeperField(
      context,
      CORNERS,
      toState({ blownCells: new Set([2 * cols + 4]), flaggedCells: new Set([2 * cols + 5]) }),
      BOX,
    );

    expect(cells.some((cell) => cell.fill === 'rgba(255, 107, 107, 0.35)')).toBe(true);
    expect(labels.map((label) => label.text).sort()).toEqual(['💣', '🚩']);
  });

  it('клетки за краем кадра пропускаются', () => {
    const { context, cells } = toRecordingContext();
    const all = MINESWEEPER_SIZE.rows * MINESWEEPER_SIZE.cols;

    paintMinesweeperField(context, CORNERS, toState(), BOX);

    expect(cells.length).toBeLessThan(all);
  });
});
