import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { PubExternalAnswerSchema, PubExternalCodeParamsSchema } from '@quest/shared';
import httpStatus from 'http-status';
import { confirmExternalAnswer } from '../services/quest/confirmExternalAnswer.js';

/**
 * Дрампад в аудитории засчитывает ответ сам. Роут лежит в корне, без префикса `/api`:
 * адрес зашит в железо, и авторизации у него нет — команду платформа находит сама.
 */
export const drumRoutes: FastifyPluginAsyncTypebox = async (app) => {
  // Железо шлёт заголовок JSON с пустым телом, а тело этому роуту и не нужно
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
    const text = body.toString().trim();
    if (text === '') {
      done(null, {});
      return;
    }
    try {
      const parsed: unknown = JSON.parse(text);
      done(null, parsed);
    } catch (cause) {
      done(cause as Error, undefined);
    }
  });

  app.post(
    '/pub/confirm_drum/:code',
    {
      schema: {
        tags: ['pub'],
        summary: 'Дрампад засчитывает ответ команде, открывшей вопрос в его аудитории',
        params: PubExternalCodeParamsSchema,
        response: { [httpStatus.OK]: PubExternalAnswerSchema },
      },
    },
    async (request) => confirmExternalAnswer(request.params.code),
  );
};
