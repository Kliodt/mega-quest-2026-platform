import { type ReactNode } from 'react';
import styles from './Spinner.module.scss';

interface SpinnerProps {
  /** Подпись рядом: «Загружаем команды…» */
  label?: string;
}

export function Spinner({ label }: SpinnerProps): ReactNode {
  return (
    <div className={styles.wrap} role="status">
      <span className={styles.dot} />
      {label !== undefined && <span className={styles.label}>{label}</span>}
    </div>
  );
}
