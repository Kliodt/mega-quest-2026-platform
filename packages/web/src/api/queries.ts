import {
  type AnswerResultDto,
  type EnterCodeRequestDto,
  type LoginRequestDto,
  type LoginResponseDto,
  type OkDto,
  type ProgressDto,
  type QuestionStateDto,
  type RoomNumberDto,
  type RoomNumberRequestDto,
  type SubmitAnswerRequestDto,
  type TakeHintRequestDto,
  type TeamNamesDto,
} from '@quest/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext.js';
import { apiRequest, HttpMethod } from './client.js';

export function progressQueryKey(token: string | null) {
  return ['progress', token] as const;
}

/**
 * Своими действиями команда обновляет прохождение сама: ответ, код и подсказка приходят
 * со свежим `progress` и кладутся в кэш. Опрос нужен только ради чужих изменений —
 * поправок от организатора и внешнего механизма, — поэтому он редкий.
 */
const PROGRESS_REFETCH_INTERVAL_MS = 30_000;
/** Столько прохождение считается свежим: переходы между экранами не дёргают сервер */
const PROGRESS_STALE_MS = 10_000;

export function useProgressQuery() {
  const { token } = useAuth();
  return useQuery({
    queryKey: progressQueryKey(token),
    queryFn: () => apiRequest<ProgressDto>('/quest/progress', { token }),
    enabled: token !== null,
    refetchInterval: PROGRESS_REFETCH_INTERVAL_MS,
    staleTime: PROGRESS_STALE_MS,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

/** Названия команд для входа: список открыт, пароль всё равно вводится руками. */
export function useTeamNamesQuery() {
  return useQuery({
    queryKey: ['teamNames'] as const,
    queryFn: () => apiRequest<TeamNamesDto>('/auth/teams'),
    staleTime: Infinity,
    retry: false,
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (body: LoginRequestDto) =>
      apiRequest<LoginResponseDto>('/auth/login', { method: HttpMethod.POST, body }),
  });
}

export function useLogoutMutation() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: () => apiRequest<OkDto>('/auth/logout', { method: HttpMethod.POST, token }),
  });
}

/** Мутации кладут свежий progress из ответа сервера в кэш, не дожидаясь refetch. */
export function useSetProgressCache() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return (progress: ProgressDto) => {
    queryClient.setQueryData(progressQueryKey(token), progress);
  };
}

export function useEnterCodeMutation() {
  const { token } = useAuth();
  const setProgress = useSetProgressCache();
  return useMutation({
    mutationFn: (body: EnterCodeRequestDto) =>
      apiRequest<ProgressDto>('/quest/enter-code', { method: HttpMethod.POST, body, token }),
    onSuccess: setProgress,
  });
}

/** Номер аудитории по её коду: игры, где ответ — номер следующей аудитории. */
export function useRoomNumberMutation() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (body: RoomNumberRequestDto) =>
      apiRequest<RoomNumberDto>('/quest/room-number', { method: HttpMethod.POST, body, token }),
  });
}

export function useSubmitAnswerMutation() {
  const { token } = useAuth();
  const setProgress = useSetProgressCache();
  return useMutation({
    mutationFn: (body: SubmitAnswerRequestDto) =>
      apiRequest<AnswerResultDto>('/quest/answer', { method: HttpMethod.POST, body, token }),
    onSuccess: (result) => setProgress(result.progress),
  });
}

export function useTakeHintMutation() {
  const { token } = useAuth();
  const setProgress = useSetProgressCache();
  return useMutation({
    mutationFn: (body: TakeHintRequestDto) =>
      apiRequest<ProgressDto>('/quest/hint', { method: HttpMethod.POST, body, token }),
    onSuccess: setProgress,
  });
}

/** Черновик прохождения: сервер хранит как есть, кэш progress не трогаем. */
export function useSaveStateMutation() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (state: unknown) =>
      apiRequest<QuestionStateDto>('/quest/state', {
        method: HttpMethod.PUT,
        body: { state },
        token,
      }),
  });
}
