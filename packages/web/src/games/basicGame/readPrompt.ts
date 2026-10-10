import { type BasicQuestionContentDto } from '@quest/shared';

/** Формулировка вопроса из `content` любой игры, собранной из basicGame. */
export function readPrompt(content: unknown): string {
  if (typeof content === 'object' && content !== null) {
    const html = (content as Partial<BasicQuestionContentDto>).html;
    if (typeof html === 'string') {
      return html;
    }
  }
  return '';
}
