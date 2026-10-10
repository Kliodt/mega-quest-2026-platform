import { type ReactNode } from 'react';
import { QuestionPrompt } from '../basicGame/QuestionPrompt.js';
import { type GameContentProps } from '../types.js';

/**
 * Кнопки стоят в аудитории, а не на экране: ответ засчитывает внешний механизм,
 * меняя состояние прохождения. Ждёт этого core по флагу вопроса.
 */
export function SoundButtonsContent({ question }: GameContentProps): ReactNode {
  return <QuestionPrompt content={question.content} />;
}
