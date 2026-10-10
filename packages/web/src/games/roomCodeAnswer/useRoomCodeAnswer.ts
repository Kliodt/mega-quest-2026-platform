import { useState } from 'react';
import { useNavigate } from 'react-router';
import { getErrorMessage } from '../../utils/errorMessage.js';
import { toWrongAnswerMessage } from '../../utils/format.js';
import { type GameContentProps, type LastAnswerResult } from '../types.js';

interface RoomCodeAnswerOptions {
  onSubmit: GameContentProps['onSubmit'];
  submitting: boolean;
  lastResult: LastAnswerResult | null;
  onReadRoomNumber: GameContentProps['onReadRoomNumber'];
  onEnterCode: GameContentProps['onEnterCode'];
}

export interface RoomCodeAnswerState {
  /** Открыт ли сканер */
  scanning: boolean;
  setScanning: (scanning: boolean) => void;
  /** Отсканированный код: по нему уходит ответ и открывается следующий вопрос */
  handleCode: (code: string) => void;
  /** Ответ уже отправляется: второй раз сканировать нечего */
  disabled: boolean;
  error: string | null;
  /** Ответ не подошёл: команда пришла не к той двери */
  wrongMessage: string | null;
}

/**
 * Ответ сканированием: по коду двери узнаём номер, отправляем его ответом и тем же
 * кодом открываем следующий вопрос. Логика отдельно от вёрстки: у гугл-форм сканер
 * живёт в своём окне, а не под заданием.
 */
export function useRoomCodeAnswer({
  onSubmit,
  submitting,
  lastResult,
  onReadRoomNumber,
  onEnterCode,
}: RoomCodeAnswerOptions): RoomCodeAnswerState {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const disabled = submitting || busy;

  async function answerWithRoomCode(code: string): Promise<void> {
    const roomNumber = await onReadRoomNumber(code);
    const result = await onSubmit({ text: roomNumber });
    setScanning(false);
    if (!result.correct) {
      return;
    }
    // Игра могла спрятать ответ в адресе страницы, следующий вопрос выставит свой
    await navigate('/question', { replace: true });
    // Команда стоит у той самой двери, которую платформа и называет следующей
    if (result.progress.nextRoomNumbers !== null) {
      await onEnterCode(code);
    }
  }

  const handleCode = (code: string): void => {
    if (disabled) {
      return;
    }
    setError(null);
    setBusy(true);
    void answerWithRoomCode(code)
      .catch((cause: unknown) => setError(getErrorMessage(cause)))
      .finally(() => setBusy(false));
  };

  let wrongMessage: string | null = null;
  if (lastResult !== null && !lastResult.correct) {
    wrongMessage = toWrongAnswerMessage('Это не та аудитория', lastResult.penaltySecondsAdded);
  }

  return { scanning, setScanning, handleCode, disabled, error, wrongMessage };
}
