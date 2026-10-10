import { type ReactNode } from 'react';
import styles from './Spinner.module.scss';

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = 'Загрузка…' }: SpinnerProps): ReactNode {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
