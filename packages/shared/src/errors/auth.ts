import { type ApiErrorGroup } from './types.js';

export const AuthErrors = {
  unauthorized: {
    code: 'auth__unauthorized',
    message: 'Требуется вход',
  },
  invalidCredentials: {
    code: 'auth__invalid_credentials',
    message: 'Неверное имя команды или пароль',
  },
  sessionReplaced: {
    code: 'auth__session_replaced',
    message: 'Вход выполнен на другом устройстве',
  },
  sessionMissing: {
    code: 'auth__session_missing',
    message: 'Сессия не найдена, войдите снова',
  },
  adminUnauthorized: {
    code: 'auth__admin_unauthorized',
    message: 'Неверный токен администратора',
  },
} as const satisfies ApiErrorGroup;
