import { type FastifyPluginAsync, type FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { type TeamDocument } from '../models/Team.js';
import { readTeamBySession } from '../services/auth/readTeamBySession.js';
import { type JwtPayload } from '../utils/auth/types.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    team: TeamDocument;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

async function authenticate(request: FastifyRequest): Promise<void> {
  await request.jwtVerify();
  request.team = await readTeamBySession(request.user);
}

const authenticatePlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('team');
  app.decorate('authenticate', authenticate);
};

export default fp(authenticatePlugin, { name: 'authenticate', dependencies: ['@fastify/jwt'] });
