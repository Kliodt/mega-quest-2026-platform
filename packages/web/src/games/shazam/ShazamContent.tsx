import { type ReactNode } from 'react';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { RoomCodeAnswer } from '../roomCodeAnswer/RoomCodeAnswer.js';
import { type GameContentProps } from '../types.js';

/** Шазам: в аудитории играет трек, а ответ — аудитория, куда он ведёт. */
export function ShazamContent({
  question,
  onSubmit,
  submitting,
  lastResult,
  onReadRoomNumber,
  onEnterCode,
}: GameContentProps): ReactNode {
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
