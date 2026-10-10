import { readEnv, readPortEnv, readRequiredEnv } from './utils.js';

/** Переменные окружения, прочитанные один раз при старте; обязательные бросают. */
export const MONGO_URI = readRequiredEnv('MONGO_URI');
export const JWT_SECRET = readRequiredEnv('JWT_SECRET');
export const JWT_EXPIRES_IN = readEnv('JWT_EXPIRES_IN', '24h');
export const ADMIN_TOKEN = readRequiredEnv('ADMIN_TOKEN');
export const API_PORT = readPortEnv('API_PORT', 3000);
export const API_HOST = readEnv('API_HOST', '0.0.0.0');
export const LOG_LEVEL = readEnv('LOG_LEVEL', 'info');
/** Тестовый код, который подходит к любой игре, пока нет QR-кодов. `null` — выключено. */
export const MOCK_CODE = readEnv('MOCK_CODE', null);
/** Собранный фронтенд: на сервере его раздаёт сам API. В разработке этим занят Vite. */
export const WEB_DIST = readEnv('WEB_DIST', null);
