import { type FastifyPluginAsync, type FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AdminUnauthorizedError } from '../utils/errors/index.js';

export const ADMIN_TOKEN_HEADER = 'x-admin-token';

export interface AdminAuthOptions {
  adminToken: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    adminAuth: (request: FastifyRequest) => Promise<void>;
  }
}

const adminAuthPlugin: FastifyPluginAsync<AdminAuthOptions> = async (app, options) => {
  app.decorate('adminAuth', async (request: FastifyRequest) => {
    const provided = request.headers[ADMIN_TOKEN_HEADER];
    if (typeof provided !== 'string' || provided !== options.adminToken) {
      throw new AdminUnauthorizedError();
    }
  });
};

export default fp(adminAuthPlugin, { name: 'adminAuth' });
