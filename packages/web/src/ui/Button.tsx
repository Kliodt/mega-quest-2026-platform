import classNames from 'classnames';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.scss';

export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
  GHOST = 'ghost',
}

export enum ButtonSize {
  MEDIUM = 'medium',
  SMALL = 'small',
}

const VARIANT_CLASS: Record<ButtonVariant, string | undefined> = {
  [ButtonVariant.PRIMARY]: styles.primary,
  [ButtonVariant.SECONDARY]: styles.secondary,
  [ButtonVariant.DANGER]: styles.danger,
  [ButtonVariant.GHOST]: styles.ghost,
};

const SIZE_CLASS: Record<ButtonSize, string | undefined> = {
  [ButtonSize.MEDIUM]: styles.medium,
  [ButtonSize.SMALL]: styles.small,
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Надпись на время запроса; пока она задана, кнопка заблокирована */
  loadingLabel?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = ButtonVariant.PRIMARY,
  size = ButtonSize.MEDIUM,
  loading = false,
  loadingLabel,
  fullWidth = false,
  className,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps): ReactNode {
  let label: ReactNode = children;
  if (loading && loadingLabel !== undefined) {
    label = loadingLabel;
  }

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading}
      className={classNames(
        styles.button,
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth && styles.fullWidth,
        className,
      )}
    >
      {label}
    </button>
  );
}
