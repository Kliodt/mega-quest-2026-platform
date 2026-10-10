import { type ReactNode } from 'react';
import { QuestionHtml } from '../../components/QuestionHtml.js';
import styles from './QuestionPrompt.module.scss';
import { readPrompt } from './readPrompt.js';

interface QuestionPromptProps {
  /** `content` вопроса: формулировку достаёт сам компонент */
  content: unknown;
}

/** Формулировка задания: одинаковая вёрстка у всех типов игр, длинный текст читается с телефона. */
export function QuestionPrompt({ content }: QuestionPromptProps): ReactNode {
  const html = readPrompt(content);
  if (html === '') {
    return null;
  }
  return <QuestionHtml html={html} className={styles.prompt} />;
}
