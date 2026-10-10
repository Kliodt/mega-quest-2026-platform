import classNames from 'classnames';
import { type ReactNode } from 'react';
import { Background } from './Background.js';
import styles from './QuestShell.module.scss';

interface QuestShellProps {
  children: ReactNode;
  /** Прилипающая шапка: остаётся на месте, пока экран прокручивается */
  header?: ReactNode;
  /** Экран с длинным текстом: узор на фоне приглушается */
  quiet?: boolean;
  className?: string | undefined;
}

/**
 * Экран квеста целиком: тёмное поле со свечением, волны и звёзды на фоне, колонка
 * содержимого по центру. Старое светлое оформление остаётся под админкой.
 */
export function QuestShell({
  header,
  children,
  quiet = false,
  className,
}: QuestShellProps): ReactNode {
  return (
    <div className={classNames(styles.shell, className)}>
      <Background quiet={quiet} />
      {header}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
