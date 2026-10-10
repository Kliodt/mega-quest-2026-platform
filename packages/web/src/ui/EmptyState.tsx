import { type ReactNode } from 'react';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  /** «Команд пока нет», «Поправок времени пока нет» */
  message: string;
  action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps): ReactNode {
  return (
    <div className={styles.empty}>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  );
}
