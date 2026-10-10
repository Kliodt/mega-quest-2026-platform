import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { type TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyInstance } from 'fastify';
import httpStatus from 'http-status';
import { ADMIN_TOKEN, JWT_EXPIRES_IN, JWT_SECRET, LOG_LEVEL, WEB_DIST } from './config/env.js';
import adminAuthPlugin from './plugins/adminAuth.js';
import authenticatePlugin from './plugins/authenticate.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { drumRoutes } from './routes/drum.js';
import { healthRoutes } from './routes/health.js';
import { pubRoutes } from './routes/pub.js';
import { questRoutes } from './routes/quest.js';
import {
  ApiError,
  InternalError,
  NotFoundError,
  RequestRejectedError,
  UnauthorizedError,
  ValidationError,
} from './utils/errors/index.js';

export type App = FastifyInstance;

export async function buildApp(): Promise<App> {
  const app = Fastify({
    logger: {
      level: LOG_LEVEL,
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(cors, { origin: true });

  await app.register(jwt, {
    secret: JWT_SECRET,
    sign: { expiresIn: JWT_EXPIRES_IN },
  });
  await app.register(authenticatePlugin);
  await app.register(adminAuthPlugin, { adminToken: ADMIN_TOKEN });

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Quest Platform API',
        version: '0.1.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          adminToken: { type: 'apiKey', in: 'header', name: 'X-Admin-Token' },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.setErrorHandler((error, request, reply) => {
    const apiError = toApiError(error);
    if (apiError.status >= httpStatus.INTERNAL_SERVER_ERROR) {
      request.log.error({ err: error, ...apiError.logData }, 'Server error');
    } else {
      request.log.info({ code: apiError.code, ...apiError.logData }, 'Request failed');
    }
    void reply.status(apiError.status).send(apiError.toApiErrorDto());
  });

  app.setNotFoundHandler((request, reply) => {
    // Фронтенд одностраничный: свои адреса он разбирает сам, поэтому отдаём ему index.html
    if (WEB_DIST !== null && !isApiRequest(request.url)) {
      void reply.sendFile('index.html');
      return;
    }
    const error = new NotFoundError();
    void reply.status(error.status).send(error.toApiErrorDto());
  });

  // Адрес дрампада зашит в железо в аудитории, поэтому он живёт в корне, без `/api`
  await app.register(drumRoutes);

  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(pubRoutes);
      await api.register(authRoutes);
      await api.register(questRoutes);
      await api.register(adminRoutes);
    },
    { prefix: '/api' },
  );

  // На сервере собранный фронтенд раздаёт этот же процесс; в разработке — дев-сервер Vite
  if (WEB_DIST !== null) {
    await app.register(fastifyStatic, { root: WEB_DIST });
    app.addHook('onSend', async (request, reply) => {
      if (isApiRequest(request.url)) {
        return;
      }
      // Имена файлов сборки содержат хеш, поэтому их можно кэшировать надолго
      const cacheControl = request.url.startsWith('/assets/')
        ? IMMUTABLE_CACHE_CONTROL
        : PAGE_CACHE_CONTROL;
      reply.header('Cache-Control', cacheControl);
      // Ролики лежат под случайными именами, чтобы их не угадали; сохраняются — под понятным
      if (request.url.startsWith(YANDEX_FILES_PREFIX)) {
        reply.header('Content-Disposition', YANDEX_DISPOSITION);
      }
    });
  }

  return app;
}

const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PAGE_CACHE_CONTROL = 'no-cache';

/**
 * Ролики Яндекса раздаются под случайными именами, но сохранять их команда должна под
 * понятным: `inline` оставляет проигрывание в странице, а имя браузер берёт при «сохранить».
 * Кириллица кодируется по RFC 5987, рядом ascii-запасной вариант для старых браузеров.
 */
const YANDEX_FILES_PREFIX = '/yandex_files/';
const YANDEX_FILE_NAME = 'Яндекс_Виженер.mp4';
const YANDEX_DISPOSITION = `inline; filename="Yandex_Vigener.mp4"; filename*=UTF-8''${encodeURIComponent(
  YANDEX_FILE_NAME,
)}`;

/** Запросы платформы: всё остальное — страницы фронтенда и его файлы. */
function isApiRequest(url: string): boolean {
  return url.startsWith('/api/') || url.startsWith('/docs') || url.startsWith('/pub/confirm_drum');
}

interface FastifyLikeError {
  statusCode?: number;
  validation?: unknown;
  code?: string;
  message?: string;
}

const JWT_ERROR_PREFIX = 'FST_JWT_';

/** Любая ошибка приводится к ApiError; статус чужой ошибки сохраняется. */
function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const fastifyError = error as FastifyLikeError;

  if (fastifyError.validation !== undefined) {
    return new ValidationError(fastifyError.message);
  }

  if (typeof fastifyError.code === 'string' && fastifyError.code.startsWith(JWT_ERROR_PREFIX)) {
    return new UnauthorizedError();
  }

  if (
    fastifyError.statusCode !== undefined &&
    fastifyError.statusCode < httpStatus.INTERNAL_SERVER_ERROR
  ) {
    return new RequestRejectedError(fastifyError.statusCode, {
      frameworkCode: fastifyError.code,
      frameworkMessage: fastifyError.message,
    });
  }

  return new InternalError();
}
