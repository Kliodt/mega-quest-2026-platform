import { type ReactNode } from 'react';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { RoomCodeAnswer } from '../roomCodeAnswer/RoomCodeAnswer.js';
import { type GameContentProps } from '../types.js';

/** Четыре тома складываются в номер аудитории, куда команда идёт дальше. */
export function EncyclopediaContent({
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
      note="Ответ — номер аудитории, собранный из четырёх томов."
    >
      <QuestionPrompt content={question.content} />
    </RoomCodeAnswer>
  );
}
