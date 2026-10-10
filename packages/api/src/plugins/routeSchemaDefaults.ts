import { type FastifyPluginAsync, type FastifySchema } from 'fastify';
import fp from 'fastify-plugin';

export type RouteSchemaDefaults = Pick<FastifySchema, 'tags' | 'security'>;

/**
 * Общие `tags` и `security` для роутов плагина, в котором зарегистрирован.
 * Регистрировать только внутри плагина роутов: на корне пометит вообще все.
 */
const routeSchemaDefaultsPlugin: FastifyPluginAsync<RouteSchemaDefaults> = async (
  app,
  defaults,
) => {
  app.addHook('onRoute', (route) => {
    route.schema = { ...defaults, ...route.schema };
  });
};

export default fp(routeSchemaDefaultsPlugin, { name: 'routeSchemaDefaults' });
