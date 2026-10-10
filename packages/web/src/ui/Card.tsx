import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './Card.module.scss';

interface CardProps {
  /** Заголовок секции внутри карточки */
  title?: string;
  /** Кнопки справа от заголовка */
  actions?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
}

export function Card({ title, actions, children, className }: CardProps): ReactNode {
  return (
    <section className={classNames(styles.card, className)}>
      {(title !== undefined || actions !== undefined) && (
        <header className={styles.header}>
          {title !== undefined && <h2 className={styles.title}>{title}</h2>}
          {actions !== undefined && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
