import { QuestErrors, type ApiErrorCode, type QuestionStateDto } from '@quest/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { apiRequest } from './client.js';
import { ApiError } from './errors.js';
import { progressQueryKey } from './queries.js';

/** Сервер держит запрос до четверти минуты; после ошибки не долбим его чаще этого */
const RETRY_DELAY_MS = 3000;

/** Ждать больше нечего: вопрос закрылся, пока мы висели на запросе */
const ANSWERED_CODES: ApiErrorCode[] = [QuestErrors.noOpenQuestion.code, QuestErrors.finished.code];

/**
 * Долгий запрос состояния: висит на сервере, пока состояние открытого вопроса не изменится,
 * и сразу спрашивает снова. Нужен играм, где ответ засчитывает внешний механизм, — команде
 * ничего не надо нажимать, экран обновляется сам.
 */
export function useQuestionStateWatch(enabled: boolean): void {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || token === null) {
      return undefined;
    }
    let stopped = false;

    const watch = async (since: string | null): Promise<void> => {
      if (stopped) {
        return;
      }
      const query = since === null ? '' : `?since=${encodeURIComponent(since)}`;
      const next = await apiRequest<QuestionStateDto>(`/quest/state${query}`, { token });
      if (stopped) {
        return;
      }
      if (since !== null && next.updatedAt !== since) {
        // Состояние поменял не фронт, значит и прохождение могло сдвинуться
        await queryClient.invalidateQueries({ queryKey: progressQueryKey(token) });
      }
      return watch(next.updatedAt);
    };

    const retry = (since: string | null): void => {
      watch(since).catch((cause: unknown) => {
        if (stopped) {
          return;
        }
        // Вопрос закрылся: ответ засчитали извне, и прохождение уже сдвинулось
        if (cause instanceof ApiError && ANSWERED_CODES.includes(cause.code)) {
          void queryClient.invalidateQueries({ queryKey: progressQueryKey(token) });
          return;
        }
        window.setTimeout(() => retry(since), RETRY_DELAY_MS);
      });
    };
    retry(null);

    return () => {
      stopped = true;
    };
  }, [enabled, token, queryClient]);
}
