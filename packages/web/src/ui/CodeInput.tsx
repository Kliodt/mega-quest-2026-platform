import classNames from 'classnames';
import { type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './CodeInput.module.scss';

/** Код на двери — восемь символов, регистр важен */
const CODE_LENGTH = 8;

interface CodeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
}

/** Крупный моноширинный ввод кода: его набирают на телефоне, стоя у двери. */
export function CodeInput({ label = 'Код', className, ...rest }: CodeInputProps): ReactNode {
  return (
    <input
      {...rest}
      type="text"
      inputMode="text"
      aria-label={label}
      maxLength={CODE_LENGTH}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      className={classNames(styles.input, className)}
    />
  );
}
