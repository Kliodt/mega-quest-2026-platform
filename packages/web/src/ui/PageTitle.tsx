import classNames from 'classnames';
import { type ReactNode } from 'react';
import styles from './PageTitle.module.scss';

interface PageTitleProps {
  children: ReactNode;
  /** Подзаголовок под именем: статус команды, шаг маршрута */
  subtitle?: ReactNode;
  className?: string | undefined;
}

/** Главный заголовок экрана: Druk белым с синим сдвигом, как на афише квеста. */
export function PageTitle({ children, subtitle, className }: PageTitleProps): ReactNode {
  return (
    <div className={classNames(styles.wrap, className)}>
      <h1 className={styles.title}>{children}</h1>
      {subtitle !== undefined && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}
