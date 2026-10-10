import classNames from 'classnames';
import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import styles from './SelectField.module.scss';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  /** Первая строка списка, пока ничего не выбрано */
  placeholder?: string;
  options: SelectOption[];
  error?: string | null;
}

export function SelectField({
  label,
  placeholder,
  options,
  error = null,
  className,
  id,
  ...rest
}: SelectFieldProps): ReactNode {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className={classNames(styles.field, className)}>
      {label !== undefined && (
        <label className={styles.label} htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        {...rest}
        id={selectId}
        className={classNames(styles.select, error !== null && styles.invalid)}
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : errorId}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error !== null && (
        <span id={errorId} role="alert" className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
