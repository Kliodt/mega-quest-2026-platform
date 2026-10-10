import { type TimeAdjustmentDto } from '@quest/shared';
import classNames from 'classnames';
import { type ReactNode } from 'react';
import { describeAdjustment } from '../utils/describeAdjustment.js';
import { formatPenalty, formatTimeOfDay } from '../utils/format.js';
import styles from './TimeAdjustmentHistory.module.scss';

interface TimeAdjustmentHistoryProps {
  adjustments: TimeAdjustmentDto[];
  totalSeconds: number;
  /** Номер аудитории по индексу шага, чтобы подписать поправки, привязанные к шагу */
  roomNumbers: ReadonlyMap<number, string>;
  /** Если задан, у каждой строки появляется кнопка отмены (админка) */
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export function TimeAdjustmentHistory({
  adjustments,
  totalSeconds,
  roomNumbers,
  onDelete,
  deleting = false,
}: TimeAdjustmentHistoryProps): ReactNode {
  if (adjustments.length === 0) {
    return <p className="muted">Поправок времени пока нет.</p>;
  }
  return (
    <div>
      <ul className={styles.list}>
        {adjustments.map((adjustment) => (
          <li key={adjustment.id} className={styles.item}>
            <span className={classNames('mono', styles.time)}>
              {formatTimeOfDay(adjustment.createdAt)}
            </span>
            <span className={styles.text}>{describeAdjustment(adjustment, roomNumbers)}</span>
            <span
              className={classNames(
                'mono',
                adjustment.timeAdjustmentSeconds < 0 && styles.bonus,
                adjustment.timeAdjustmentSeconds >= 0 && styles.penalty,
              )}
            >
              {formatPenalty(adjustment.timeAdjustmentSeconds)}
            </span>
            {onDelete && (
              <button
                type="button"
                className="btn btn--secondary btn--small"
                disabled={deleting}
                onClick={() => onDelete(adjustment.id)}
              >
                Отменить
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className={styles.total}>
        Итого: <span className="mono">{formatPenalty(totalSeconds)}</span>
      </p>
    </div>
  );
}
