import { type ReactNode } from 'react';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { TextAnswer } from '../basicGame/TextAnswer.js';
import { type GameContentProps } from '../types.js';
import { toStickersAnswer } from './toStickersAnswer.js';

/** Стикеры: команда собирает ответ из выданных за квест стикеров и вводит его строкой. */
export function StickersContent({
  question,
  onSubmit,
  submitting,
  lastResult,
  onSaveState,
}: GameContentProps): ReactNode {
  return (
    <TextAnswer
      onSubmit={(answer) => onSubmit(toStickersAnswer(answer))}
      submitting={submitting}
      lastResult={lastResult}
      onSaveState={onSaveState}
      state={question.state}
    >
      <QuestionPrompt content={question.content} />
    </TextAnswer>
  );
}
