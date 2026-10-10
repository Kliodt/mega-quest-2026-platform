import { type ReactNode } from 'react';
import { CodeScanner } from '../../components/CodeScanner.js';
import { ScanButton } from '../../components/ScanButton.js';
import { Banner } from '../../ui/index.js';
import { type GameContentProps, type LastAnswerResult } from '../types.js';
import styles from './RoomCodeAnswer.module.scss';
import { useRoomCodeAnswer } from './useRoomCodeAnswer.js';

interface RoomCodeAnswerProps {
  onSubmit: GameContentProps['onSubmit'];
  submitting: boolean;
  lastResult: LastAnswerResult | null;
  onReadRoomNumber: GameContentProps['onReadRoomNumber'];
  onEnterCode: GameContentProps['onEnterCode'];
  /** Текст задания рисует конкретная игра; у гугл-форм его нет */
  children?: ReactNode;
  /** Чем эта игра отличается: «код спрятан в видео», «ответ собран из четырёх томов» */
  note?: string;
}

/** Задание и под ним ответ сканированием: общая вёрстка для игр с ответом-аудиторией. */
export function RoomCodeAnswer({
  onSubmit,
  submitting,
  lastResult,
  onReadRoomNumber,
  onEnterCode,
  children,
  note,
}: RoomCodeAnswerProps): ReactNode {
  const { scanning, setScanning, handleCode, disabled, error, wrongMessage } = useRoomCodeAnswer({
    onSubmit,
    submitting,
    lastResult,
    onReadRoomNumber,
    onEnterCode,
  });

  return (
    <div className={styles.answer}>
      {children}

      {note !== undefined && <p className={styles.lead}>{note}</p>}
      <p className={styles.rule}>
        Ответ — это номер следующей аудитории.
        <br />
        Отсканируйте код на её двери
      </p>
      <Banner message={error} />
      <Banner message={wrongMessage} />

      <ScanButton loading={disabled} onClick={() => setScanning(true)} label="Сканировать код" />

      <CodeScanner
        open={scanning}
        title="Код нужной аудитории"
        submitting={disabled}
        error={error ?? wrongMessage}
        onClose={() => setScanning(false)}
        onCode={handleCode}
      />
    </div>
  );
}
