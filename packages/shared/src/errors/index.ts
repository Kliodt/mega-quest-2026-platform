import { AuthErrors } from './auth.js';
import { BindingErrors } from './binding.js';
import { CellErrors } from './cell.js';
import { CommonErrors } from './common.js';
import { QuestErrors } from './quest.js';
import { TeamErrors } from './team.js';
import { type ApiErrorInfo, type CodesOf } from './types.js';

export * from './types.js';
export * from './common.js';
export * from './auth.js';
export * from './binding.js';
export * from './cell.js';
export * from './quest.js';
export * from './team.js';

export type ApiErrorCode =
  | CodesOf<typeof CommonErrors>
  | CodesOf<typeof AuthErrors>
  | CodesOf<typeof BindingErrors>
  | CodesOf<typeof CellErrors>
  | CodesOf<typeof QuestErrors>
  | CodesOf<typeof TeamErrors>;

const ERROR_GROUPS = [CommonErrors, AuthErrors, BindingErrors, CellErrors, QuestErrors, TeamErrors];

/** Все ошибки API одним списком: справочник для клиента и источник форм `data`. */
export const ALL_API_ERRORS: ApiErrorInfo[] = ERROR_GROUPS.flatMap((group) =>
  Object.values<ApiErrorInfo>(group),
);
