import {
  type AdminAddTimeAdjustmentRequestDto,
  type AdminBindingsDto,
  type AdminCellsDto,
  type AdminCreateTeamRequestDto,
  type AdminQuestionsDto,
  type AdminSaveBindingRequestDto,
  type AdminSaveCellRequestDto,
  type AdminRewindTeamRequestDto,
  type AdminTeamDetailDto,
  type AdminTeamsDto,
  type AdminUpdateTeamRequestDto,
  type AdminValidationDto,
  type OkDto,
} from '@quest/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, HttpMethod } from '../api/client.js';
import { useAdminAuth } from './AdminAuthContext.js';

const TEAMS_REFETCH_INTERVAL_MS = 15_000;

export function adminTeamsQueryKey(adminToken: string | null) {
  return ['admin', 'teams', adminToken] as const;
}

export function adminTeamQueryKey(adminToken: string | null, teamId: string) {
  return ['admin', 'team', adminToken, teamId] as const;
}

export function adminQuestionsQueryKey(adminToken: string | null) {
  return ['admin', 'questions', adminToken] as const;
}

export function adminBindingsQueryKey(adminToken: string | null) {
  return ['admin', 'bindings', adminToken] as const;
}

export function adminCellsQueryKey(adminToken: string | null) {
  return ['admin', 'cells', adminToken] as const;
}

/** Проверка токена перед сохранением: любой админский запрос под ним. */
export function checkAdminToken(adminToken: string): Promise<AdminTeamsDto> {
  return apiRequest<AdminTeamsDto>('/admin/teams', { adminToken });
}

export function useAdminTeamsQuery() {
  const { adminToken } = useAdminAuth();
  return useQuery({
    queryKey: adminTeamsQueryKey(adminToken),
    queryFn: () => apiRequest<AdminTeamsDto>('/admin/teams', { adminToken }),
    enabled: adminToken !== null,
    refetchInterval: TEAMS_REFETCH_INTERVAL_MS,
  });
}

export function useAdminTeamQuery(teamId: string) {
  const { adminToken } = useAdminAuth();
  return useQuery({
    queryKey: adminTeamQueryKey(adminToken, teamId),
    queryFn: () => apiRequest<AdminTeamDetailDto>(`/admin/teams/${teamId}`, { adminToken }),
    enabled: adminToken !== null,
    refetchInterval: TEAMS_REFETCH_INTERVAL_MS,
  });
}

/** Все вопросы квеста: и список для страницы вопросов, и справочник для редактора маршрута. */
export function useAdminQuestionsQuery() {
  const { adminToken } = useAdminAuth();
  return useQuery({
    queryKey: adminQuestionsQueryKey(adminToken),
    queryFn: () => apiRequest<AdminQuestionsDto>('/admin/questions', { adminToken }),
    enabled: adminToken !== null,
  });
}

/** После мутации команды перечитывается список; карточку команды мутация возвращает сама. */
function useInvalidateTeams() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'teams'] });
}

function useSetTeamDetailCache(teamId: string) {
  const queryClient = useQueryClient();
  const { adminToken } = useAdminAuth();
  return (detail: AdminTeamDetailDto) => {
    queryClient.setQueryData(adminTeamQueryKey(adminToken, teamId), detail);
  };
}

export function useCreateTeamMutation() {
  const { adminToken } = useAdminAuth();
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: (body: AdminCreateTeamRequestDto) =>
      apiRequest<AdminTeamDetailDto>('/admin/teams', {
        method: HttpMethod.POST,
        body,
        adminToken,
      }),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateTeamMutation(teamId: string) {
  const { adminToken } = useAdminAuth();
  const setDetail = useSetTeamDetailCache(teamId);
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: (body: AdminUpdateTeamRequestDto) =>
      apiRequest<AdminTeamDetailDto>(`/admin/teams/${teamId}`, {
        method: HttpMethod.PATCH,
        body,
        adminToken,
      }),
    onSuccess: (detail) => {
      setDetail(detail);
      void invalidate();
    },
  });
}

export function useDeleteTeamMutation() {
  const { adminToken } = useAdminAuth();
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: (teamId: string) =>
      apiRequest<OkDto>(`/admin/teams/${teamId}`, { method: HttpMethod.DELETE, adminToken }),
    onSuccess: () => void invalidate(),
  });
}

export function useResetTeamMutation(teamId: string) {
  const { adminToken } = useAdminAuth();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin'] });
  return useMutation({
    mutationFn: () =>
      apiRequest<OkDto>(`/admin/teams/${teamId}/reset`, { method: HttpMethod.POST, adminToken }),
    onSuccess: () => void invalidate(),
  });
}

export function useRewindTeamMutation(teamId: string) {
  const { adminToken } = useAdminAuth();
  const setDetail = useSetTeamDetailCache(teamId);
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: (stepIndex: number) =>
      apiRequest<AdminTeamDetailDto>(`/admin/teams/${teamId}/rewind`, {
        method: HttpMethod.POST,
        body: { stepIndex } satisfies AdminRewindTeamRequestDto,
        adminToken,
      }),
    onSuccess: (detail) => {
      setDetail(detail);
      void invalidate();
    },
  });
}

/** Ответ за команду: вопрос сломался, и организатор закрывает его сам. */
export function useAnswerForTeamMutation(teamId: string) {
  const { adminToken } = useAdminAuth();
  const setDetail = useSetTeamDetailCache(teamId);
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: () =>
      apiRequest<AdminTeamDetailDto>(`/admin/teams/${teamId}/answer`, {
        method: HttpMethod.POST,
        adminToken,
      }),
    onSuccess: (detail) => {
      setDetail(detail);
      void invalidate();
    },
  });
}

/** Скан кода за команду: QR не читается, а идти дальше надо. */
export function useScanForTeamMutation(teamId: string) {
  const { adminToken } = useAdminAuth();
  const setDetail = useSetTeamDetailCache(teamId);
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: () =>
      apiRequest<AdminTeamDetailDto>(`/admin/teams/${teamId}/scan`, {
        method: HttpMethod.POST,
        adminToken,
      }),
    onSuccess: (detail) => {
      setDetail(detail);
      void invalidate();
    },
  });
}

export function useAddTimeAdjustmentMutation(teamId: string) {
  const { adminToken } = useAdminAuth();
  const setDetail = useSetTeamDetailCache(teamId);
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: (body: AdminAddTimeAdjustmentRequestDto) =>
      apiRequest<AdminTeamDetailDto>(`/admin/teams/${teamId}/time-adjustments`, {
        method: HttpMethod.POST,
        body,
        adminToken,
      }),
    onSuccess: (detail) => {
      setDetail(detail);
      void invalidate();
    },
  });
}

/** Проверка маршрутов по требованию: вопросы и маршруты правятся по ходу подготовки. */
export function useValidationMutation() {
  const { adminToken } = useAdminAuth();
  return useMutation({
    mutationFn: () => apiRequest<AdminValidationDto>('/admin/validation', { adminToken }),
  });
}

export function useAdminBindingsQuery() {
  const { adminToken } = useAdminAuth();
  return useQuery({
    queryKey: adminBindingsQueryKey(adminToken),
    queryFn: () => apiRequest<AdminBindingsDto>('/admin/bindings', { adminToken }),
    enabled: adminToken !== null,
  });
}

/** Мутации кодов возвращают весь список: он короткий и всегда нужен целиком. */
function useSetBindingsCache() {
  const queryClient = useQueryClient();
  const { adminToken } = useAdminAuth();
  return (bindings: AdminBindingsDto) => {
    queryClient.setQueryData(adminBindingsQueryKey(adminToken), bindings);
  };
}

export function useSaveBindingMutation() {
  const { adminToken } = useAdminAuth();
  const setBindings = useSetBindingsCache();
  return useMutation({
    mutationFn: (body: AdminSaveBindingRequestDto) =>
      apiRequest<AdminBindingsDto>('/admin/bindings', {
        method: HttpMethod.POST,
        body,
        adminToken,
      }),
    onSuccess: setBindings,
  });
}

export function useDeleteBindingMutation() {
  const { adminToken } = useAdminAuth();
  const setBindings = useSetBindingsCache();
  return useMutation({
    mutationFn: (code: string) =>
      apiRequest<AdminBindingsDto>(`/admin/bindings/${code}`, {
        method: HttpMethod.DELETE,
        adminToken,
      }),
    onSuccess: setBindings,
  });
}

export function useAdminCellsQuery() {
  const { adminToken } = useAdminAuth();
  return useQuery({
    queryKey: adminCellsQueryKey(adminToken),
    queryFn: () => apiRequest<AdminCellsDto>('/admin/cells', { adminToken }),
    enabled: adminToken !== null,
  });
}

/** Как и у кодов на дверях, мутации возвращают весь список клеток целиком. */
function useSetCellsCache() {
  const queryClient = useQueryClient();
  const { adminToken } = useAdminAuth();
  return (cells: AdminCellsDto) => {
    queryClient.setQueryData(adminCellsQueryKey(adminToken), cells);
  };
}

export function useSaveCellMutation() {
  const { adminToken } = useAdminAuth();
  const setCells = useSetCellsCache();
  return useMutation({
    mutationFn: (body: AdminSaveCellRequestDto) =>
      apiRequest<AdminCellsDto>('/admin/cells', {
        method: HttpMethod.POST,
        body,
        adminToken,
      }),
    onSuccess: setCells,
  });
}

export function useDeleteCellMutation() {
  const { adminToken } = useAdminAuth();
  const setCells = useSetCellsCache();
  return useMutation({
    mutationFn: (code: string) =>
      apiRequest<AdminCellsDto>(`/admin/cells/${code}`, {
        method: HttpMethod.DELETE,
        adminToken,
      }),
    onSuccess: setCells,
  });
}

export function useDeleteTimeAdjustmentMutation(teamId: string) {
  const { adminToken } = useAdminAuth();
  const setDetail = useSetTeamDetailCache(teamId);
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: (timeAdjustmentId: string) =>
      apiRequest<AdminTeamDetailDto>(
        `/admin/teams/${teamId}/time-adjustments/${timeAdjustmentId}`,
        {
          method: HttpMethod.DELETE,
          adminToken,
        },
      ),
    onSuccess: (detail) => {
      setDetail(detail);
      void invalidate();
    },
  });
}
