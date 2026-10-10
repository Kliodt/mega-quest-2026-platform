import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './Tabs.module.scss';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Подпись для скринридера: «Разделы команды» */
  label: string;
}

export function Tabs({ items, activeId, onChange, label }: TabsProps): ReactNode {
  return (
    <nav className={styles.tabs} aria-label={label}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={classNames(styles.tab, item.id === activeId && styles.active)}
          aria-current={item.id === activeId}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
