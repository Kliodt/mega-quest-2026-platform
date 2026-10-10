import classNames from 'classnames';
import { type ReactNode, type TableHTMLAttributes } from 'react';
import styles from './Table.module.scss';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  /** Таблица шире экрана (маршруты команд) прокручивается вбок вместе с обёрткой */
  scrollable?: boolean;
}

/** Оформление таблиц админки: разметку строк пишет сама страница. */
export function Table({ children, scrollable = false, className, ...rest }: TableProps): ReactNode {
  const table = (
    <table {...rest} className={classNames(styles.table, className)}>
      {children}
    </table>
  );
  if (!scrollable) {
    return table;
  }
  return <div className={styles.scroll}>{table}</div>;
}
