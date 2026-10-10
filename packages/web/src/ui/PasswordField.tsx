import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { IconButton } from './IconButton.js';
import { TextField } from './TextField.js';

/** Глаз: открытый, пока пароль скрыт, и перечёркнутый, когда он на виду */
function EyeIcon({ crossed }: { crossed: boolean }): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      {crossed && <path d="M4 20 20 4" stroke="currentColor" strokeWidth="1.6" />}
    </svg>
  );
}

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  error?: string | null;
  hint?: string;
}

/** Пароль вводят с телефона вслепую, поэтому его всегда можно показать. */
export function PasswordField(props: PasswordFieldProps): ReactNode {
  const [shown, setShown] = useState(false);

  return (
    <TextField
      {...props}
      type={shown ? 'text' : 'password'}
      autoComplete="current-password"
      trailing={
        <IconButton
          label={shown ? 'Скрыть пароль' : 'Показать пароль'}
          aria-pressed={shown}
          disabled={props.disabled}
          onClick={() => setShown(!shown)}
        >
          <EyeIcon crossed={shown} />
        </IconButton>
      }
    />
  );
}
