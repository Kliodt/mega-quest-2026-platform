import { type ReactNode } from 'react';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { RoomCodeAnswer } from '../roomCodeAnswer/RoomCodeAnswer.js';
import { type GameContentProps } from '../types.js';

/** Телевизоры: экран у лифтов называет аудиторию, за ней — номер следующей. */
export function TelevisionsContent({
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
