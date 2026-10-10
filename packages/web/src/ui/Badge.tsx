import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './Badge.module.scss';

export enum BadgeTone {
  NEUTRAL = 'neutral',
  ACTIVE = 'active',
  DONE = 'done',
  LOCKED = 'locked',
  DANGER = 'danger',
}

const TONE_CLASS: Record<BadgeTone, string | undefined> = {
  [BadgeTone.NEUTRAL]: styles.neutral,
  [BadgeTone.ACTIVE]: styles.active,
  [BadgeTone.DONE]: styles.done,
  [BadgeTone.LOCKED]: styles.locked,
  [BadgeTone.DANGER]: styles.danger,
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

/** Короткая подпись состояния: шаг маршрута, статус команды, тип поправки времени. */
export function Badge({ children, tone = BadgeTone.NEUTRAL }: BadgeProps): ReactNode {
  return <span className={classNames(styles.badge, TONE_CLASS[tone])}>{children}</span>;
}
