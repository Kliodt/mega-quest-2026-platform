import { useImperativeHandle, useRef, type ReactNode, type RefObject } from 'react';
import styles from './QrOutline.module.scss';
import { toDisplayCorners, type CornerPoint } from './toDisplayCorners.js';

/** Сканер зовёт это на каждом кадре; без кода передаётся `undefined`. */
export interface QrOutlineHandle {
  draw: (corners: CornerPoint[] | undefined) => void;
}

interface QrOutlineProps {
  /** Видео, поверх которого рисуем: из него берутся размеры кадра и рамки */
  videoRef: RefObject<HTMLVideoElement | null>;
  ref?: RefObject<QrOutlineHandle | null>;
}

/** Углы кода в координатах рамки, строкой для атрибута `points`. */
export function toOutlinePoints(
  video: Pick<HTMLVideoElement, 'videoWidth' | 'videoHeight' | 'clientWidth' | 'clientHeight'>,
  corners: CornerPoint[] | undefined,
): string {
  return toDisplayCorners(video, corners)
    .map((corner) => `${Math.round(corner.x)},${Math.round(corner.y)}`)
    .join(' ');
}

/** Контур найденного кода: четыре угла, поэтому четырёхугольник — ложится на код под наклоном. */
export function QrOutline({ videoRef, ref }: QrOutlineProps): ReactNode {
  const polygonRef = useRef<SVGPolygonElement>(null);

  useImperativeHandle(ref, () => ({
    // Атрибут пишется напрямую: кадров до шестидесяти в секунду, перерисовывать дерево незачем
    draw: (corners) => {
      const video = videoRef.current;
      if (!video) {
        return;
      }
      polygonRef.current?.setAttribute('points', toOutlinePoints(video, corners));
    },
  }));

  return (
    <svg className={styles.overlay} aria-hidden="true">
      <polygon ref={polygonRef} points="" className={styles.outline} />
    </svg>
  );
}
