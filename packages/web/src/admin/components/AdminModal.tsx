import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './AdminModal.module.scss';

interface AdminModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Окно организатора на нативном `dialog`: Esc, возврат фокуса и подложка — от браузера.
 * Содержимое живёт, только пока окно открыто, поэтому форма открывается чистой.
 */
export function AdminModal({ open, title, onClose, children }: AdminModalProps): ReactNode {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }
    // Закрытие кликом мимо панели: где браузер ещё не умеет, остаются Esc и крестик
    dialog.setAttribute('closedby', 'any');
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onClose={onClose}>
      {open && (
        <div className={styles.panel}>
          <header className={styles.head}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} aria-label="Закрыть" onClick={onClose}>
              ✕
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
