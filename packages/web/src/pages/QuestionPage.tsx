import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { QuestionCard } from '../components/QuestionCard.js';
import { useQuestOutletContext } from './questOutletContext.js';

/** Открытое задание занимает всю страницу: у игр бывает длинный текст и своя механика. */
export function QuestionPage(): ReactNode {
  const { progress } = useQuestOutletContext();

  if (progress.question === null) {
    return <Navigate to="/" replace />;
  }
  return <QuestionCard question={progress.question} />;
}
