import { type ReactNode } from 'react';

interface QuestionHtmlProps {
  html: string;
  className?: string | undefined;
  /** `span` — когда содержимое стоит внутри кнопки или строки текста */
  as?: 'div' | 'span';
}

/** Разметку пишут организаторы в `data/`, источник доверенный — рисуем как есть. */
export function QuestionHtml({ html, className, as = 'div' }: QuestionHtmlProps): ReactNode {
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
