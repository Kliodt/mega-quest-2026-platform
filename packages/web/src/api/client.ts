import { CommonErrors, type ApiErrorDto } from '@quest/shared';
import { ApiError, NO_HTTP_STATUS } from './errors.js';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** JWT команды */
  token?: string | null;
  /** Токен организатора, уходит в X-Admin-Token */
  adminToken?: string | null;
}

const API_BASE = '/api';
const ADMIN_TOKEN_HEADER = 'x-admin-token';

function isApiErrorDto(value: unknown): value is ApiErrorDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.code === 'string' && typeof record.message === 'string';
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function parseError(response: Response): Promise<ApiError> {
  const payload = await readBody(response);
  if (isApiErrorDto(payload)) {
    return new ApiError(response.status, payload, payload.data);
  }
  // Тело не похоже на ошибку API: статус знаем, текст берём общий
  return new ApiError(response.status, CommonErrors.internal);
}

/** Транспорт: отправляет запрос и бросает ApiError. Реакция на ошибки — выше по стеку. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }
  if (options.adminToken) {
    headers[ADMIN_TOKEN_HEADER] = options.adminToken;
  }

  const init: RequestInit = { method: options.method ?? HttpMethod.GET, headers };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError(NO_HTTP_STATUS, CommonErrors.network);
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}
