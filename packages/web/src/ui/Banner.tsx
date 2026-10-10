import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './Banner.module.scss';

export enum BannerTone {
  ERROR = 'error',
  WARNING = 'warning',
  SUCCESS = 'success',
  INFO = 'info',
}

const TONE_CLASS: Record<BannerTone, string | undefined> = {
  [BannerTone.ERROR]: styles.error,
  [BannerTone.WARNING]: styles.warning,
  [BannerTone.SUCCESS]: styles.success,
  [BannerTone.INFO]: styles.info,
};

/** Ошибку и предупреждение скринридер обязан прочитать сразу, остальное — в свой черёд */
const URGENT_TONES = [BannerTone.ERROR, BannerTone.WARNING];

interface BannerProps {
  /** Пусто — плашки нет: так её удобно рисовать по результату запроса */
  message: ReactNode;
  tone?: BannerTone;
}

export function Banner({ message, tone = BannerTone.ERROR }: BannerProps): ReactNode {
  if (message === null || message === undefined || message === '') {
    return null;
  }
  const role = URGENT_TONES.includes(tone) ? 'alert' : 'status';
  return (
    <div role={role} className={classNames(styles.banner, TONE_CLASS[tone])}>
      {message}
    </div>
  );
}
