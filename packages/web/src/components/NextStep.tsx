import { useState, type ReactNode } from 'react';
import { useEnterCodeMutation } from '../api/queries.js';
import { Banner, RoomPlate } from '../ui/index.js';
import { getErrorMessage } from '../utils/errorMessage.js';
import { formatRoomNumber } from '../utils/formatRoomNumber.js';
import { CodeScanner } from './CodeScanner.js';
import styles from './NextStep.module.scss';
import { ScanButton } from './ScanButton.js';

interface NextStepProps {
  /** Аудитории следующего шага; пусто, когда команда узнаёт их из ответа сама */
  nextRoomNumbers: string[] | null;
  /** Блок над сканированием: на переходе между корпусами — что делать по дороге */
  intro?: ReactNode;
  /** Чем заменить общую подсказку про дверь, когда аудитория команде неизвестна */
  lead?: string | undefined;
}

const DEFAULT_LEAD = 'Найдите аудиторию и отсканируйте код с её двери.';

/** Что делать прямо сейчас: дойти до аудитории и отсканировать код на её двери. */
export function NextStep({ nextRoomNumbers, intro, lead = DEFAULT_LEAD }: NextStepProps): ReactNode {
  const enterCode = useEnterCodeMutation();
  const [scanning, setScanning] = useState(false);

  const handleCode = (code: string): void => {
    enterCode.mutate({ code }, { onSuccess: () => setScanning(false) });
  };

  let errorMessage: string | null = null;
  if (enterCode.isError) {
    errorMessage = getErrorMessage(enterCode.error);
  }

  // Команде нужна одна дверь: список аудиторий не подсказка, а путаница
  const rooms = nextRoomNumbers ?? [];
  let room: string | undefined;
  if (rooms.length === 1) {
    room = rooms[0];
  }

  return (
    <section className={styles.step}>
      {intro}
      {room !== undefined && (
        <RoomPlate roomNumber={formatRoomNumber(room)} caption="ждём вас здесь" />
      )}
      {room === undefined && <p className={styles.lead}>{lead}</p>}

      <Banner message={errorMessage} />

      <ScanButton loading={enterCode.isPending} onClick={() => setScanning(true)} />

      <CodeScanner
        open={scanning}
        title="Код на двери"
        submitting={enterCode.isPending}
        error={errorMessage}
        onClose={() => setScanning(false)}
        onCode={handleCode}
      />
    </section>
  );
}
