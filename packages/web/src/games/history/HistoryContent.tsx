import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { RoomCodeAnswer } from '../roomCodeAnswer/RoomCodeAnswer.js';
import { type GameContentProps } from '../types.js';

/** Номер приходит ответом (`shouldSendAnswer`), а компонент прячет его в адрес страницы. */
export function HistoryContent({
  question,
  onSubmit,
  submitting,
  lastResult,
  onReadRoomNumber,
  onEnterCode,
}: GameContentProps): ReactNode {
  const navigate = useNavigate();
  const roomNumber = question.answers[0] ?? null;

  useEffect(() => {
    if (roomNumber !== null) {
      void navigate(`/question/${roomNumber}`, { replace: true });
    }
  }, [roomNumber, navigate]);

  return (
    <RoomCodeAnswer
      onSubmit={onSubmit}
      submitting={submitting}
      lastResult={lastResult}
      onReadRoomNumber={onReadRoomNumber}
      onEnterCode={onEnterCode}
    >
      <QuestionPrompt content={question.content} />
    </RoomCodeAnswer>
  );
}
