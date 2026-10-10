import { type PubBindingDto } from '@quest/shared';
import { useRef, useState, type ReactNode } from 'react';
import { apiRequest } from '../api/client.js';
import { QrScanner } from '../components/QrScanner.js';
import {
  Banner,
  BannerTone,
  Button,
  ButtonVariant,
  Card,
  PageTitle,
  QuestShell,
  RoomPlate,
  Spinner,
} from '../ui/index.js';
import { getErrorMessage } from '../utils/errorMessage.js';
import { toCode } from '../utils/toCode.js';
import styles from './PubBindingsPage.module.scss';

const NO_CLIPBOARD = 'Копирование работает только по https';
const NOT_A_CODE = 'Это не код квеста: в нём нет восьми букв и цифр';

/** Что дал код из кадра: аудитория или причина, почему её нет. */
interface Found {
  /** Что прочитала камера: показываем всегда, даже когда аудитории за кодом нет */
  scanned: string;
  binding: PubBindingDto | null;
  error: string | null;
}

/** Открытая страница для организаторов: навёл камеру на дверь — увидел, что это за аудитория. */
export function PubBindingsPage(): ReactNode {
  const [scanned, setScanned] = useState<string | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  // Кадров до шестидесяти в секунду: первый распознанный код останавливает камеру
  const scannedRef = useRef<string | null>(null);

  const handleCode = (value: string | null): void => {
    if (value === null || scannedRef.current !== null) {
      return;
    }
    scannedRef.current = value;
    setScanned(value);

    const code = toCode(value);
    if (code === null) {
      setFound({ scanned: value, binding: null, error: NOT_A_CODE });
      return;
    }
    void apiRequest<PubBindingDto>(`/pub/bindings/${code}`)
      .then((binding) => setFound({ scanned: value, binding, error: null }))
      .catch((cause: unknown) =>
        setFound({ scanned: value, binding: null, error: getErrorMessage(cause) }),
      );
  };

  const scanAgain = (): void => {
    scannedRef.current = null;
    setScanned(null);
    setFound(null);
    setCopied(false);
    setCopyError(null);
  };

  const copy = (text: string): void => {
    if (navigator.clipboard === undefined) {
      setCopyError(NO_CLIPBOARD);
      return;
    }
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setCopyError(null);
      })
      .catch((cause: unknown) => setCopyError(getErrorMessage(cause)));
  };

  let result: ReactNode = null;
  if (found !== null) {
    const binding = found.binding;
    // Аудитория известна — копируем строку для таблицы, иначе сам распознанный текст
    let copyText = found.scanned;
    if (binding !== null) {
      copyText = `${binding.code}, ${binding.roomTitle}, ${binding.location}`;
    }

    result = (
      <Card className={styles.result}>
        {binding !== null && (
          <>
            <div className={styles.code}>{binding.code}</div>
            <RoomPlate roomNumber={binding.roomTitle} caption={binding.location} />
          </>
        )}
        {binding === null && (
          <>
            <Banner tone={BannerTone.WARNING} message={found.error} />
            <div className={styles.decoded}>{found.scanned}</div>
          </>
        )}

        <div className={styles.actions}>
          <Button onClick={() => copy(copyText)}>Копировать</Button>
          <Button variant={ButtonVariant.SECONDARY} onClick={scanAgain}>
            Сканировать ещё код
          </Button>
        </div>

        <Banner message={copyError} />
        {copied && copyError === null && <Banner tone={BannerTone.SUCCESS} message="Скопировано" />}
      </Card>
    );
  }

  return (
    <QuestShell>
      <PageTitle>Проверка кодов</PageTitle>

      {found === null && (
        <>
          <QrScanner onCode={handleCode} paused={scanned !== null} />
          {scanned !== null && <Spinner label="Ищем аудиторию…" />}
        </>
      )}

      {result}
    </QuestShell>
  );
}
