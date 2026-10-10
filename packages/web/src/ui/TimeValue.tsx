import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './TimeValue.module.scss';

export enum TimeValueSize {
  /** Итог квеста: время занимает экран */
  HERO = 'hero',
  LARGE = 'large',
  NORMAL = 'normal',
}

const SIZE_CLASS: Record<TimeValueSize, string | undefined> = {
  [TimeValueSize.HERO]: styles.hero,
  [TimeValueSize.LARGE]: styles.large,
  [TimeValueSize.NORMAL]: styles.normal,
};

interface TimeValueProps {
  /** Уже отформатированное значение: 00:12:34 или +120 с */
  children: ReactNode;
  size?: TimeValueSize;
  /** Время остановлено: цифры приглушаются */
  paused?: boolean;
  className?: string | undefined;
}

/** Цифры времени: всегда моноширинные, чтобы не прыгали на каждом тике. */
export function TimeValue({
  children,
  size = TimeValueSize.NORMAL,
  paused = false,
  className,
}: TimeValueProps): ReactNode {
  return (
    <span
      className={classNames(styles.value, SIZE_CLASS[size], paused && styles.paused, className)}
    >
      {children}
    </span>
  );
}
