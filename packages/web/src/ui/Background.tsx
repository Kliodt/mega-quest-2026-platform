import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './Background.module.scss';

/** Линии идут пачкой: один контур со сдвигом, как горизонтали на карте */
const LINE_SHIFTS = [0, 1, 2, 3, 4, 5, 6];

/** Концы кривых лежат за границами вьюбокса, а сами линии растворяются маской к центру */
const TOP_RIGHT_LINE = 'M120-60C210 50 140 150 250 205S345 315 470 470';
const BOTTOM_LEFT_LINE = 'M-60 170C50 105 135 235 255 190S395 105 500 195';

/** Четырёхлучевая звезда: длинные лучи и синяя сердцевина такой же формы */
const SPARKLE_PATH = 'M0-50C3-13 13-3 50 0 13 3 3 13 0 50-3 13-13 3-50 0-13-3-3-13 0-50Z';
const SPARKLE_CORE_SCALE = 0.34;

interface Star {
  /** Положение в процентах экрана: звёзды разлетаются по фону, а не сидят в углах */
  left: number;
  top: number;
  size: number;
}

/** Звёзды жмутся к краям: середину занимают задание и кнопки */
const STARS: Star[] = [
  { left: 94, top: 24, size: 20 },
  { left: 95, top: 52, size: 56 },
  { left: 88, top: 68, size: 24 },
  { left: 6, top: 30, size: 48 },
  { left: 4, top: 64, size: 22 },
  { left: 14, top: 92, size: 32 },
  { left: 82, top: 95, size: 18 },
];

interface CornerProps {
  line: string;
  shift: (index: number) => string;
  className: string | undefined;
}

function Corner({ line, shift, className }: CornerProps): ReactNode {
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden="true">
      {LINE_SHIFTS.map((index) => (
        <path key={index} d={line} transform={shift(index)} />
      ))}
    </svg>
  );
}

interface BackgroundProps {
  /** Экран с длинным текстом: фон уходит на второй план, чтобы не мешать читать */
  quiet?: boolean;
}

/** Фон квеста: волны по углам и звёзды. Рисуется один раз под всем содержимым. */
export function Background({ quiet = false }: BackgroundProps): ReactNode {
  return (
    <div className={classNames(styles.decor, quiet && styles.quiet)} aria-hidden="true">
      <Corner
        className={styles.topRight}
        line={TOP_RIGHT_LINE}
        shift={(index) => `translate(${index * 24} ${-index * 14})`}
      />
      <Corner
        className={styles.bottomLeft}
        line={BOTTOM_LEFT_LINE}
        shift={(index) => `translate(${-index * 6} ${index * 26})`}
      />
      {STARS.map((star) => (
        <svg
          key={`${star.left}-${star.top}`}
          className={styles.star}
          style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size }}
          viewBox="-60 -60 120 120"
          aria-hidden="true"
        >
          <path d={SPARKLE_PATH} className={styles.sparkle} />
          <path
            d={SPARKLE_PATH}
            className={styles.sparkleCore}
            transform={`scale(${SPARKLE_CORE_SCALE})`}
          />
        </svg>
      ))}
    </div>
  );
}
