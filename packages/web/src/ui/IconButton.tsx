import classNames from 'classnames';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './IconButton.module.scss';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Обязательна: у кнопки-иконки нет текста, и без подписи её не прочитает скринридер */
  label: string;
  children: ReactNode;
}

export function IconButton({
  label,
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps): ReactNode {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={classNames(styles.button, className)}
    >
      {children}
    </button>
  );
}
