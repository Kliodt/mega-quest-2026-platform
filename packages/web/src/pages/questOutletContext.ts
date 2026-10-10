import { type ProgressDto } from '@quest/shared';
import { useOutletContext } from 'react-router';

/** Прохождение команды загружает layout; страницы квеста берут его отсюда. */
export interface QuestOutletContext {
  progress: ProgressDto;
  /** Когда пришёл ответ сервера: от этой метки тикает таймер */
  receivedAt: number;
}

export function useQuestOutletContext(): QuestOutletContext {
  return useOutletContext<QuestOutletContext>();
}
