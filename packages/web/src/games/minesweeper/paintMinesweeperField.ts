import { type MinesweeperCellDto, type MinesweeperFieldDto } from '@quest/shared';
import { type CornerPoint } from '../../components/toDisplayCorners.js';
import { getCellLabel } from './getCellLabel.js';
import { MINESWEEPER_SIZE, QR_TO_CELL_RATIO } from './minesweeperSize.js';
import { toFieldQuads, type CellQuad } from './toFieldQuads.js';

export interface MinesweeperPaintState {
  /** Клетка кода, который сейчас в кадре: вокруг неё и строится поле */
  anchor: MinesweeperCellDto | null;
  field: MinesweeperFieldDto | null;
  openedCells: Set<number>;
  blownCells: Set<number>;
  flaggedCells: Set<number>;
}

interface PaintBox {
  width: number;
  height: number;
}

const CLOSED_FILL = 'rgba(255, 255, 255, 0.12)';
const OPENED_FILL = 'rgba(2, 5, 13, 0.55)';
const BLOWN_FILL = 'rgba(255, 107, 107, 0.35)';
const GRID_STROKE = 'rgba(255, 255, 255, 0.45)';
const ANCHOR_STROKE = '#5aa0ff';
const LABEL_COLOR = '#dbe6ff';
const LABEL_SCALE = 0.55;

/**
 * Поле поверх кадра: код наклеен в своей клетке, поэтому по его четырёхугольнику видно,
 * где лежат остальные клетки — и открытые с цифрами, и подорванные, и с флагами.
 */
export function paintMinesweeperField(
  context: CanvasRenderingContext2D,
  corners: CornerPoint[],
  state: MinesweeperPaintState,
  box: PaintBox,
): void {
  const { anchor } = state;
  if (anchor === null || corners.length === 0) {
    return;
  }
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  toFieldQuads(corners, anchor, MINESWEEPER_SIZE, QR_TO_CELL_RATIO)
    .filter((quad) => isVisible(quad.points, box))
    .forEach((quad) => paintCell(context, quad, state));
}

function paintCell(
  context: CanvasRenderingContext2D,
  quad: CellQuad,
  state: MinesweeperPaintState,
): void {
  const [first, second] = quad.points;
  if (!first || !second) {
    return;
  }
  const index = quad.row * MINESWEEPER_SIZE.cols + quad.col;
  const opened = state.openedCells.has(index);
  const blown = state.blownCells.has(index);
  const flagged = state.flaggedCells.has(index);

  context.beginPath();
  context.moveTo(first.x, first.y);
  quad.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();

  context.fillStyle = toFill(opened, blown);
  context.fill();

  const isAnchor = quad.row === state.anchor?.row && quad.col === state.anchor.col;
  context.lineWidth = isAnchor ? 3 : 1;
  context.strokeStyle = isAnchor ? ANCHOR_STROKE : GRID_STROKE;
  context.stroke();

  const label = getCellLabel(state.field, quad.row, quad.col, { opened, blown, flagged });
  if (label === '') {
    return;
  }
  const side = Math.hypot(second.x - first.x, second.y - first.y);
  const center = toCenter(quad.points);
  context.fillStyle = LABEL_COLOR;
  context.font = `700 ${Math.round(side * LABEL_SCALE)}px sans-serif`;
  context.fillText(label, center.x, center.y);
}

function toFill(opened: boolean, blown: boolean): string {
  if (blown) {
    return BLOWN_FILL;
  }
  if (opened) {
    return OPENED_FILL;
  }
  return CLOSED_FILL;
}

/** Поле шире кадра: клетки за краем не рисуем */
function isVisible(points: CornerPoint[], box: PaintBox): boolean {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return (
    Math.max(...xs) > 0 &&
    Math.min(...xs) < box.width &&
    Math.max(...ys) > 0 &&
    Math.min(...ys) < box.height
  );
}

function toCenter(points: CornerPoint[]): CornerPoint {
  const sum = points.reduce((total, point) => ({ x: total.x + point.x, y: total.y + point.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / points.length, y: sum.y / points.length };
}
