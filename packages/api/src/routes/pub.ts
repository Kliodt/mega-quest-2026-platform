import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { PubBindingSchema, PubCodeParamsSchema, PubQuestionCellSchema } from '@quest/shared';
import httpStatus from 'http-status';
import { getPubBinding } from '../services/binding/getPubBinding.js';
import { getPubQuestionCell } from '../services/question/getPubQuestionCell.js';

/** Открытые роуты без авторизации: ими пользуются организаторы со своих телефонов. */
export const pubRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/pub/bindings/:code',
    {
      schema: {
        tags: ['pub'],
        summary: 'Какая аудитория за кодом на двери',
        params: PubCodeParamsSchema,
        response: { [httpStatus.OK]: PubBindingSchema },
      },
    },
    async (request) => getPubBinding(request.params.code),
  );

  // Коды клеток сапёра: по ним ходит и команда в игре, и организатор с проверкой
  app.get(
    '/pub/minesweeper/:code',
    {
      schema: {
        tags: ['pub'],
        summary: 'Какая клетка поля за этим кодом',
        params: PubCodeParamsSchema,
        response: { [httpStatus.OK]: PubQuestionCellSchema },
      },
    },
    async (request) => getPubQuestionCell(request.params.code),
  );
};
