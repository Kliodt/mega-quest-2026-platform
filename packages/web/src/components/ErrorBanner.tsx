import { type ReactNode } from 'react';
import styles from './ErrorBanner.module.scss';

interface ErrorBannerProps {
  message: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps): ReactNode {
  if (message === null) {
    return null;
  }
  return (
    <div role="alert" className={styles.banner}>
      {message}
    </div>
  );
}
