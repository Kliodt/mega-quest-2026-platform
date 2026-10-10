import { type MinesweeperCellDto, type MinesweeperFieldDto } from '@quest/shared';
import { useEffect, useImperativeHandle, useRef, type ReactNode, type RefObject } from 'react';
import { type CornerPoint } from '../../components/toDisplayCorners.js';
import styles from './MinesweeperOverlay.module.scss';
import { paintMinesweeperField, type MinesweeperPaintState } from './paintMinesweeperField.js';

/**
 * Сканер зовёт это на каждом кадре: углы кода в координатах кадра и клетка этого кода.
 * Клетка приходит вместе с углами, потому что поле строится вокруг кода, который виден
 * прямо сейчас, — чужой код в кадре поле не сдвигает.
 */
export interface MinesweeperOverlayHandle {
  draw: (corners: CornerPoint[], anchor: MinesweeperCellDto | null) => void;
}

interface MinesweeperOverlayProps {
  field: MinesweeperFieldDto | null;
  openedCells: Set<number>;
  blownCells: Set<number>;
  flaggedCells: Set<number>;
  ref?: RefObject<MinesweeperOverlayHandle | null>;
}

/** Поле, дорисованное к коду прямо в кадре камеры: что открыто, где флаги и где рвануло. */
export function MinesweeperOverlay({
  field,
  openedCells,
  blownCells,
  flaggedCells,
  ref,
}: MinesweeperOverlayProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cornersRef = useRef<CornerPoint[]>([]);
  const anchorRef = useRef<MinesweeperCellDto | null>(null);
  const stateRef = useRef<MinesweeperPaintState>({
    anchor: null,
    field,
    openedCells,
    blownCells,
    flaggedCells,
  });

  // Открытая клетка или новый флаг видны сразу, не дожидаясь следующего кадра камеры
  useEffect(() => {
    stateRef.current = { anchor: anchorRef.current, field, openedCells, blownCells, flaggedCells };
    repaint(canvasRef.current, cornersRef.current, stateRef.current);
  });

  useImperativeHandle(ref, () => ({
    // Кадров до шестидесяти в секунду: рисуем прямо на канве, дерево не трогаем
    draw: (corners, anchor) => {
      cornersRef.current = corners;
      anchorRef.current = anchor;
      stateRef.current = { ...stateRef.current, anchor };
      repaint(canvasRef.current, corners, stateRef.current);
    },
  }));

  return <canvas ref={canvasRef} className={styles.overlay} aria-hidden="true" />;
}

function repaint(
  canvas: HTMLCanvasElement | null,
  corners: CornerPoint[],
  state: MinesweeperPaintState,
): void {
  const context = canvas?.getContext('2d');
  if (!canvas || context === null || context === undefined) {
    return;
  }
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  paintMinesweeperField(context, corners, state, { width, height });
}
