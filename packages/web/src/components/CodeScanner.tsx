import { type PubBindingDto } from '@quest/shared';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../api/client.js';
import { Banner, BannerTone, Button, ButtonVariant, Modal, Spinner } from '../ui/index.js';
import { formatRoomNumber } from '../utils/formatRoomNumber.js';
import { ScanKind, toScan, type Scan } from '../utils/toScan.js';
import styles from './CodeScanner.module.scss';
import { QrScanner } from './QrScanner.js';

const FOREIGN_CODE = 'Это не код квеста и не ссылка платформы. Наведите камеру на код с двери.';

/** Куда ведёт код: «Аудитория 1216, Кронверкский», а у точки сбора номера нет */
function toRoomLabel(room: PubBindingDto): string {
  const number = formatRoomNumber(room.roomNumber);
  if (number === room.roomNumber) {
    return `Аудитория ${number}, ${room.locationTitle}`;
  }
  return `${number}, ${room.locationTitle}`;
}

interface CodeScannerProps {
  open: boolean;
  /** Что именно сканируют: «Код на двери», «Код нужной аудитории» */
  title: string;
  /** Идёт запрос по распознанному коду */
  submitting: boolean;
  /** Чем закончилась прошлая попытка; пусто, пока всё в порядке */
  error: string | null;
  onClose: () => void;
  onCode: (code: string) => void;
}

/**
 * Окно со сканером: код читает только камера, руками его не ввести. Код с двери уходит
 * наверх один раз и подписывается аудиторией, ссылка платформы предлагает перейти,
 * чужой QR отклоняется — отправлять его на сервер незачем.
 */
export function CodeScanner({
  open,
  title,
  submitting,
  error,
  onClose,
  onCode,
}: CodeScannerProps): ReactNode {
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [room, setRoom] = useState<PubBindingDto | null>(null);

  const send = (code: string): void => {
    setRoom(null);
    // Какая это аудитория, знает открытая ручка кодов: команде полезно видеть, куда попала
    void apiRequest<PubBindingDto>(`/pub/bindings/${code}`)
      .then(setRoom)
      .catch(() => setRoom(null));
    onCode(code);
  };

  const handleScan = (value: string | null): void => {
    if (value === null || scan !== null || submitting) {
      return;
    }
    const next = toScan(value, window.location.origin);
    setScan(next);
    if (next.kind === ScanKind.CODE && next.code !== null) {
      send(next.code);
    }
  };

  const scanAgain = (): void => {
    setScan(null);
    setRoom(null);
  };

  const follow = (): void => {
    const path = scan?.path;
    if (path === null || path === undefined) {
      return;
    }
    void navigate(path);
  };

  // Пока запрос идёт, прошлая ошибка уже не про этот код
  let attemptError: string | null = null;
  if (!submitting) {
    attemptError = error;
  }

  let result: ReactNode = null;
  if (scan?.kind === ScanKind.CODE) {
    result = (
      <div className={styles.result}>
        {submitting && <Spinner label="Проверяем код…" />}
        {room !== null && <p className={styles.room}>{toRoomLabel(room)}</p>}
        <Banner message={attemptError} />
      </div>
    );
  }
  if (scan?.kind === ScanKind.LINK) {
    result = (
      <div className={styles.result}>
        <p className={styles.link}>{scan.value}</p>
        <Button fullWidth onClick={follow}>
          Перейти
        </Button>
      </div>
    );
  }
  if (scan?.kind === ScanKind.FOREIGN) {
    result = <Banner tone={BannerTone.WARNING} message={FOREIGN_CODE} />;
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <QrScanner onCode={handleScan} paused={scan !== null || submitting} />

      {result}

      {scan !== null && (
        <Button variant={ButtonVariant.SECONDARY} fullWidth onClick={scanAgain}>
          Сканировать снова
        </Button>
      )}

    </Modal>
  );
}
