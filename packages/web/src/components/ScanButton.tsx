import { type ReactNode } from 'react';
import styles from './ScanButton.module.scss';

/** Уголки видоискателя: в такую рамку команда ловит код на двери */
const CORNERS = ['M2 22V2h20', 'M78 2h20v20', 'M98 78v20H78', 'M22 98H2V78'];

interface ScanButtonProps {
  onClick: () => void;
  loading?: boolean;
  /** Надпись внутри рамки; по умолчанию — про код на двери */
  label?: string;
}

/** Главное действие квеста: открыть камеру и поймать код. Рамка повторяет видоискатель. */
export function ScanButton({
  onClick,
  loading = false,
  label = 'Сканировать код',
}: ScanButtonProps): ReactNode {
  return (
    <button type="button" className={styles.target} onClick={onClick} disabled={loading}>
      <svg
        className={styles.frame}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {CORNERS.map((corner) => (
          <path key={corner} d={corner} />
        ))}
      </svg>
      <span className={styles.label}>{loading ? 'Открываем…' : label}</span>
    </button>
  );
}
