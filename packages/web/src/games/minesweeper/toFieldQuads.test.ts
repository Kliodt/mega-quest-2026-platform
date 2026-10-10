import { describe, expect, it } from 'vitest';
import { toFieldQuads } from './toFieldQuads.js';

/** Код 100×100 в левом верхнем углу кадра, углы по часовой стрелке */
const SQUARE = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

function round(points: { x: number; y: number }[]): number[][] {
  return points.map((point) => [Math.round(point.x), Math.round(point.y)]);
}

describe('toFieldQuads', () => {
  it('клетка кода совпадает с ним, когда код размером в клетку', () => {
    const [quad] = toFieldQuads(SQUARE, { code: 'x', row: 0, col: 0 }, { rows: 1, cols: 1 }, 1);

    expect(round(quad?.points ?? [])).toEqual([
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ]);
  });

  it('клетка вдвое больше кода растёт вокруг него', () => {
    const [quad] = toFieldQuads(SQUARE, { code: 'x', row: 0, col: 0 }, { rows: 1, cols: 1 }, 0.5);

    expect(round(quad?.points ?? [])).toEqual([
      [-50, -50],
      [150, -50],
      [150, 150],
      [-50, 150],
    ]);
  });

  it('соседние клетки отступают от кода на свою сторону', () => {
    const quads = toFieldQuads(SQUARE, { code: 'x', row: 0, col: 1 }, { rows: 2, cols: 2 }, 1);
    const left = quads.find((quad) => quad.row === 0 && quad.col === 0);
    const below = quads.find((quad) => quad.row === 1 && quad.col === 1);

    expect(round(left?.points ?? [])[0]).toEqual([-100, 0]);
    expect(round(below?.points ?? [])[0]).toEqual([0, 100]);
  });

  it('код под наклоном наклоняет и поле', () => {
    const tilted = [
      { x: 0, y: 0 },
      { x: 100, y: 20 },
      { x: 80, y: 120 },
      { x: -20, y: 100 },
    ];

    const [quad] = toFieldQuads(tilted, { code: 'x', row: 0, col: 0 }, { rows: 1, cols: 1 }, 1);

    expect(round(quad?.points ?? [])).toEqual(round(tilted));
  });

  it('без четырёх углов поля нет', () => {
    expect(toFieldQuads([], { code: 'x', row: 0, col: 0 }, { rows: 1, cols: 1 }, 1)).toEqual([]);
  });
});
