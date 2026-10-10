import { type MinesweeperCellDto } from '@quest/shared';
import { type CornerPoint } from '../../components/toDisplayCorners.js';

export interface CellQuad {
  row: number;
  col: number;
  /** Четыре угла клетки в координатах кадра, по часовой стрелке от левого верхнего */
  points: CornerPoint[];
}

interface FieldSize {
  rows: number;
  cols: number;
}

/** Отображение единичного квадрата в четырёхугольник: восемь коэффициентов проективного преобразования */
interface Projection {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
}

const DEGENERATE = 1e-9;

/**
 * Клетки поля вокруг отсканированного кода в координатах кадра. Код наклеен в своей клетке
 * и занимает её долю `qrToCell`, поэтому по четырём его углам видно, где лежат соседние
 * клетки: код и клетки на одной плоскости, а четырёхугольник кода задаёт её проекцию.
 */
export function toFieldQuads(
  corners: CornerPoint[],
  anchor: MinesweeperCellDto,
  size: FieldSize,
  qrToCell: number,
): CellQuad[] {
  const projection = toProjection(corners);
  if (projection === null || qrToCell <= 0) {
    return [];
  }
  // Сторона клетки и отступ до её угла — в долях стороны кода, код стоит в клетке по центру
  const cell = 1 / qrToCell;
  const origin = (1 - cell) / 2;

  const quads: CellQuad[] = [];
  for (let row = 0; row < size.rows; row += 1) {
    for (let col = 0; col < size.cols; col += 1) {
      const left = origin + (col - anchor.col) * cell;
      const top = origin + (row - anchor.row) * cell;
      quads.push({
        row,
        col,
        points: [
          project(projection, left, top),
          project(projection, left + cell, top),
          project(projection, left + cell, top + cell),
          project(projection, left, top + cell),
        ],
      });
    }
  }
  return quads;
}

function project({ a, b, c, d, e, f, g, h }: Projection, u: number, v: number): CornerPoint {
  const w = g * u + h * v + 1;
  return { x: (a * u + b * v + c) / w, y: (d * u + e * v + f) / w };
}

/** Классическое построение проекции единичного квадрата на четырёхугольник по его углам. */
function toProjection(corners: CornerPoint[]): Projection | null {
  const [p0, p1, p2, p3] = corners;
  if (!p0 || !p1 || !p2 || !p3) {
    return null;
  }
  const sx = p0.x - p1.x + p2.x - p3.x;
  const sy = p0.y - p1.y + p2.y - p3.y;

  // Код в кадре почти всегда с перспективой; ровный прямоугольник считается без неё
  if (Math.abs(sx) < DEGENERATE && Math.abs(sy) < DEGENERATE) {
    return {
      a: p1.x - p0.x,
      b: p3.x - p0.x,
      c: p0.x,
      d: p1.y - p0.y,
      e: p3.y - p0.y,
      f: p0.y,
      g: 0,
      h: 0,
    };
  }

  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const den = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(den) < DEGENERATE) {
    return null;
  }
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  return {
    a: p1.x - p0.x + g * p1.x,
    b: p3.x - p0.x + h * p3.x,
    c: p0.x,
    d: p1.y - p0.y + g * p1.y,
    e: p3.y - p0.y + h * p3.y,
    f: p0.y,
    g,
    h,
  };
}
