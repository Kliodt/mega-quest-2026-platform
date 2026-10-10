import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import httpStatus from 'http-status';
import { isDbConnected } from '../db/connect.js';

const HealthSchema = Type.Object({
  ok: Type.Boolean(),
  mongo: Type.Boolean(),
});

export const healthRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['system'],
        summary: 'Проверка живости API и соединения с Mongo',
        response: { [httpStatus.OK]: HealthSchema },
      },
    },
    async () => {
      const mongo = isDbConnected();
      return { ok: mongo, mongo };
    },
  );
};
