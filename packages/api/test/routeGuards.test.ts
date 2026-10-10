import { AuthErrors } from '@quest/shared';
import httpStatus from 'http-status';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp, type App } from '../src/app.js';

interface OpenApiOperation {
  tags?: string[];
  security?: Record<string, string[]>[];
}

type OpenApiPaths = Record<string, Record<string, OpenApiOperation>>;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RouteOperation {
  url: string;
  method: HttpMethod;
  operation: OpenApiOperation;
}

const SAMPLE_OBJECT_ID = '0123456789abcdef01234567';

/** Защита и общие поля схем навешаны на плагины роутов, а не на каждый роут: проверяем снаружи. */
describe('route guards and schema defaults', () => {
  let app: App;
  let paths: OpenApiPaths;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    paths = (app.swagger() as { paths: OpenApiPaths }).paths;
  });

  afterAll(async () => {
    await app.close();
  });

  function listOperations(matches: (url: string) => boolean): RouteOperation[] {
    return Object.entries(paths)
      .filter(([url]) => matches(url))
      .flatMap(([url, methods]) =>
        Object.entries(methods).map(([method, operation]) => ({
          url,
          method: method.toUpperCase() as HttpMethod,
          operation,
        })),
      );
  }

  it('rejects every admin route without the admin token before touching the body', async () => {
    const operations = listOperations((url) => url.startsWith('/api/admin'));
    expect(operations.length).toBeGreaterThan(0);

    const responses = await Promise.all(
      operations.map(({ url, method }) =>
        app.inject({
          method,
          url: url.replace(/\{[^}]+\}/g, SAMPLE_OBJECT_ID),
          payload: 'not json',
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );

    responses.forEach((response, index) => {
      const { method, url } = operations[index]!;
      expect(response.statusCode, `${method} ${url}`).toBe(httpStatus.UNAUTHORIZED);
      expect(response.json<{ code: string }>().code).toBe(AuthErrors.adminUnauthorized.code);
    });
  });

  it('rejects every quest route and logout without a team JWT', async () => {
    const operations = listOperations(
      (url) => url.startsWith('/api/quest') || url === '/api/auth/logout',
    );
    expect(operations.length).toBeGreaterThan(0);

    const responses = await Promise.all(
      operations.map(({ url, method }) => app.inject({ method, url })),
    );

    responses.forEach((response, index) => {
      const { method, url } = operations[index]!;
      expect(response.statusCode, `${method} ${url}`).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  it('leaves health and login open', async () => {
    const [health, login] = await Promise.all([
      app.inject({ method: 'GET', url: '/api/health' }),
      app.inject({ method: 'POST', url: '/api/auth/login', payload: {} }),
    ]);
    expect(health.statusCode).toBe(httpStatus.OK);
    expect(login.statusCode).toBe(httpStatus.BAD_REQUEST);
  });

  it('documents tags and security once per plugin', () => {
    for (const { url, operation } of listOperations((url) => url.startsWith('/api/admin'))) {
      expect(operation.tags, url).toEqual(['admin']);
      expect(operation.security, url).toEqual([{ adminToken: [] }]);
    }
    for (const { url, operation } of listOperations((url) => url.startsWith('/api/quest'))) {
      expect(operation.tags, url).toEqual(['quest']);
      expect(operation.security, url).toEqual([{ bearerAuth: [] }]);
    }
    expect(paths['/api/auth/login']?.post?.tags).toEqual(['auth']);
    expect(paths['/api/auth/login']?.post?.security).toBeUndefined();
    expect(paths['/api/auth/logout']?.post?.security).toEqual([{ bearerAuth: [] }]);
    expect(paths['/api/health']?.get?.security).toBeUndefined();
  });
});
