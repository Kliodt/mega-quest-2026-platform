import { type PubQuestionCellDto } from '@quest/shared';
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
import styles from './PubMinesweeperPage.module.scss';

/** Что дал код из кадра: клетка поля или причина, почему её нет. */
interface Found {
  /** Что прочитала камера: показываем всегда, даже когда клетки за кодом нет */
  scanned: string;
  cell: PubQuestionCellDto | null;
  error: string | null;
}

/** Открытая страница для организаторов: навёл камеру на метку — увидел, что это за клетка. */
export function PubMinesweeperPage(): ReactNode {
  const [scanned, setScanned] = useState<string | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  // Кадров до шестидесяти в секунду: первый распознанный код останавливает камеру
  const scannedRef = useRef<string | null>(null);

  const handleCode = (value: string | null): void => {
    if (value === null || scannedRef.current !== null) {
      return;
    }
    const code = value.trim();
    scannedRef.current = code;
    setScanned(code);

    void apiRequest<PubQuestionCellDto>(`/pub/minesweeper/${encodeURIComponent(code)}`)
      .then((cell) => setFound({ scanned: code, cell, error: null }))
      .catch((cause: unknown) =>
        setFound({ scanned: code, cell: null, error: getErrorMessage(cause) }),
      );
  };

  const scanAgain = (): void => {
    scannedRef.current = null;
    setScanned(null);
    setFound(null);
  };

  let result: ReactNode = null;
  if (found !== null) {
    result = (
      <Card className={styles.result}>
        {found.cell !== null && (
          <>
            <div className={styles.code}>{found.scanned}</div>
            {/* Нумерация с единицы: организатору считать клетки на стене удобнее так */}
            <RoomPlate
              roomNumber={`${found.cell.col + 1}-${found.cell.row + 1}`}
              caption="столбец-строка"
            />
          </>
        )}
        {found.cell === null && (
          <>
            <Banner tone={BannerTone.WARNING} message={found.error} />
            <div className={styles.code}>{found.scanned}</div>
          </>
        )}

        <Button variant={ButtonVariant.SECONDARY} onClick={scanAgain}>
          Сканировать ещё метку
        </Button>
      </Card>
    );
  }

  return (
    <QuestShell>
      <PageTitle>Проверка клеток сапёра</PageTitle>

      {found === null && (
        <>
          <QrScanner onCode={handleCode} paused={scanned !== null} />
          {scanned !== null && <Spinner label="Ищем клетку…" />}
        </>
      )}

      {result}
    </QuestShell>
  );
}
