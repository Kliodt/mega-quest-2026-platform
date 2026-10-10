import classNames from 'classnames';
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './TextField.module.scss';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Подпись над полем; если её нет, подписью работает placeholder и aria-label */
  label?: string;
  /** Текст ошибки под полем: поле подсвечивается красным */
  error?: string | null;
  hint?: string;
  /** Моноширинный ввод: коды на дверях, номера аудиторий, секунды */
  mono?: boolean;
  /** Кнопка внутри поля справа — показать пароль, очистить ввод */
  trailing?: ReactNode;
}

export function TextField({
  label,
  error = null,
  hint,
  mono = false,
  trailing,
  className,
  id,
  ...rest
}: TextFieldProps): ReactNode {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedById = `${inputId}-description`;
  const description = error ?? hint;

  return (
    <div className={classNames(styles.field, className)}>
      {label !== undefined && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.box}>
        <input
          {...rest}
          id={inputId}
          className={classNames(
            styles.input,
            mono && styles.mono,
            trailing !== undefined && styles.withTrailing,
            error !== null && styles.invalid,
          )}
          aria-invalid={error !== null}
          aria-describedby={description === undefined ? undefined : describedById}
        />
        {trailing !== undefined && <span className={styles.trailing}>{trailing}</span>}
      </div>
      {error !== null && (
        <span id={describedById} role="alert" className={styles.error}>
          {error}
        </span>
      )}
      {error === null && hint !== undefined && (
        <span id={describedById} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
}
