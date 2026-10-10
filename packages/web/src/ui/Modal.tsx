import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './IconButton.js';
import styles from './Modal.module.scss';

interface ModalProps {
  open: boolean;
  /** Заголовок окна; им же окно подписано для скринридера */
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Окно поверх экрана на нативном `dialog`: Esc, ловушка фокуса и подложка достаются от
 * браузера. Содержимое живёт только пока окно открыто — закрытие останавливает камеру.
 */
export function Modal({ open, title, onClose, children }: ModalProps): ReactNode {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }
    // Закрытие кликом мимо панели: там, где браузер этого ещё не умеет, остаются Esc и крестик
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
    // Страница под окном не должна уезжать под пальцем
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
            <IconButton label="Закрыть" onClick={onClose}>
              ✕
            </IconButton>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
