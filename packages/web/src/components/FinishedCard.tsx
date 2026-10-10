import { type TimerDto } from '@quest/shared';
import { type ReactNode } from 'react';
import { PageTitle, TimeAdjustmentValue, TimeValue, TimeValueSize } from '../ui/index.js';
import { formatAdjustment, formatDuration } from '../utils/format.js';
import styles from './FinishedCard.module.scss';

interface FinishedCardProps {
  timer: TimerDto;
}

/** Финиш: последний ответ закрывает квест, и команде остаётся её итоговое время. */
export function FinishedCard({ timer }: FinishedCardProps): ReactNode {
  return (
    <section className={styles.finish}>
      <PageTitle>Спасибо за участие!</PageTitle>
      <p className={styles.lead}>Квест пройден, ваше время записано.</p>

      <div className={styles.total}>
        <TimeValue size={TimeValueSize.HERO}>{formatDuration(timer.totalSeconds)}</TimeValue>
        <span className={styles.caption}>итоговое время</span>
      </div>

      <dl className={styles.breakdown}>
        <div className={styles.row}>
          <dt>Время прохождения</dt>
          <dd>
            <TimeValue>{formatDuration(timer.elapsedSeconds)}</TimeValue>
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Штрафы и бонусы</dt>
          <dd>
            <TimeAdjustmentValue seconds={timer.timeAdjustmentSeconds}>
              {formatAdjustment(timer.timeAdjustmentSeconds)}
            </TimeAdjustmentValue>
          </dd>
        </div>
      </dl>
    </section>
  );
}
