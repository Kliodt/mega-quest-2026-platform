import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './TimeAdjustmentValue.module.scss';

interface TimeAdjustmentValueProps {
  /** Секунды со знаком задают цвет: больше нуля — штраф, меньше — бонус */
  seconds: number;
  /** Уже отформатированное значение: «+20 мин», «−30 с» */
  children: ReactNode;
  className?: string | undefined;
}

/** Поправка времени: штраф красным, бонус зелёным, ноль обычным. */
export function TimeAdjustmentValue({
  seconds,
  children,
  className,
}: TimeAdjustmentValueProps): ReactNode {
  return (
    <span
      className={classNames(
        styles.value,
        seconds > 0 && styles.penalty,
        seconds < 0 && styles.bonus,
        className,
      )}
    >
      {children}
    </span>
  );
}
