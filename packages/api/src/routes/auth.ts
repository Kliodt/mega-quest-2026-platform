import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  OkSchema,
  TeamNamesSchema,
  type LoginResponseDto,
  type OkDto,
  type TeamNamesDto,
} from '@quest/shared';
import httpStatus from 'http-status';
import routeSchemaDefaults from '../plugins/routeSchemaDefaults.js';
import { logoutTeam } from '../services/auth/logoutTeam.js';
import { openSession } from '../services/auth/openSession.js';
import { readTeamNames } from '../services/auth/readTeamNames.js';

export const authRoutes: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(routeSchemaDefaults, { tags: ['auth'] });

  app.get(
    '/auth/teams',
    {
      schema: {
        summary: 'Названия команд для выпадающего списка на входе',
        response: { [httpStatus.OK]: TeamNamesSchema },
      },
    },
    async (): Promise<TeamNamesDto> => ({ names: await readTeamNames() }),
  );

  app.post(
    '/auth/login',
    {
      schema: {
        summary: 'Вход команды. Новый вход выбивает предыдущие устройства.',
        body: LoginRequestSchema,
        response: { [httpStatus.OK]: LoginResponseSchema },
      },
    },
    async (request): Promise<LoginResponseDto> =>
      openSession(request.body, (payload) => app.jwt.sign(payload)),
  );

  app.post(
    '/auth/logout',
    {
      onRequest: app.authenticate,
      schema: {
        summary: 'Выход команды: сбрасывает активную сессию',
        security: [{ bearerAuth: [] }],
        response: { [httpStatus.OK]: OkSchema },
      },
    },
    async (request): Promise<OkDto> => {
      await logoutTeam(request.team);
      return { ok: true };
    },
  );
};
