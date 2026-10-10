import { type StepCardDto, type TimeAdjustmentDto } from '@quest/shared';
import { type ReactNode } from 'react';
import { EmptyState, Modal, TimeAdjustmentValue } from '../ui/index.js';
import { describeAdjustment } from '../utils/describeAdjustment.js';
import { formatAdjustment, formatTimeOfDay } from '../utils/format.js';
import { getRoomNumbersByStep } from '../utils/getRoomNumbersByStep.js';
import styles from './TimeAdjustments.module.scss';

interface TimeAdjustmentsProps {
  open: boolean;
  onClose: () => void;
  timeAdjustmentSeconds: number;
  adjustments: TimeAdjustmentDto[];
  steps: StepCardDto[];
}

/** Из чего сложилось время команды: окно открывается нажатием на таймер. */
export function TimeAdjustments({
  open,
  onClose,
  timeAdjustmentSeconds,
  adjustments,
  steps,
}: TimeAdjustmentsProps): ReactNode {
  const roomNumbers = getRoomNumbersByStep(steps);

  return (
    <Modal open={open} title="Штрафы и бонусы" onClose={onClose}>
      {adjustments.length === 0 && <EmptyState message="Ни штрафов, ни бонусов пока нет" />}

      {adjustments.length > 0 && (
        <>
          <ul className={styles.list}>
            {adjustments.map((adjustment) => (
              <li key={adjustment.id} className={styles.item}>
                <span className={styles.reason}>{describeAdjustment(adjustment, roomNumbers)}</span>
                <TimeAdjustmentValue seconds={adjustment.timeAdjustmentSeconds}>
                  {formatAdjustment(adjustment.timeAdjustmentSeconds)}
                </TimeAdjustmentValue>
                <span className={styles.moment}>{formatTimeOfDay(adjustment.createdAt)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.total}>
            Итого{' '}
            <TimeAdjustmentValue seconds={timeAdjustmentSeconds}>
              {formatAdjustment(timeAdjustmentSeconds)}
            </TimeAdjustmentValue>
          </p>
        </>
      )}
    </Modal>
  );
}
