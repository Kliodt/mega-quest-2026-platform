import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  AnswerResultSchema,
  EnterCodeRequestSchema,
  ProgressSchema,
  QuestionStateSchema,
  QuestionViewSchema,
  RoomNumberRequestSchema,
  RoomNumberSchema,
  SaveQuestionStateRequestSchema,
  SubmitAnswerRequestSchema,
  TakeHintRequestSchema,
  WaitQuestionStateQuerySchema,
} from '@quest/shared';
import httpStatus from 'http-status';
import routeSchemaDefaults from '../plugins/routeSchemaDefaults.js';
import { readRoomNumber } from '../services/binding/readRoomNumber.js';
import { getQuestion } from '../services/openQuestion/getQuestion.js';
import { getQuestionState } from '../services/openQuestion/getQuestionState.js';
import { setQuestionState } from '../services/openQuestion/setQuestionState.js';
import { submitAnswer } from '../services/openQuestion/submitAnswer.js';
import { takeHint } from '../services/openQuestion/takeHint.js';
import { enterCode } from '../services/quest/enterCode.js';
import { getProgress } from '../services/quest/getProgress.js';

/** Все действия команды одинаковы для любого типа игры; форму content/answer/state знает тип. */
export const questRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('onRequest', app.authenticate);
  await app.register(routeSchemaDefaults, { tags: ['quest'], security: [{ bearerAuth: [] }] });

  app.get(
    '/quest/progress',
    {
      schema: {
        summary: 'Текущее состояние команды: фаза, маршрут, открытый вопрос, таймер, штрафы',
        response: { [httpStatus.OK]: ProgressSchema },
      },
    },
    async (request) => getProgress(request.team),
  );

  app.post(
    '/quest/enter-code',
    {
      schema: {
        summary: 'Ввод кода аудитории: открывает вопрос следующего шага',
        body: EnterCodeRequestSchema,
        response: { [httpStatus.OK]: ProgressSchema },
      },
    },
    async (request) => enterCode(request.team, request.body.code, request.log),
  );

  app.post(
    '/quest/room-number',
    {
      schema: {
        summary: 'Номер аудитории по её коду: для игр, где ответ — номер следующей аудитории',
        body: RoomNumberRequestSchema,
        response: { [httpStatus.OK]: RoomNumberSchema },
      },
    },
    async (request) => readRoomNumber(request.body.code),
  );

  app.get(
    '/quest/question',
    {
      schema: {
        summary:
          'Открытый вопрос: содержимое от типа игры, подсказки, попытки, сохранённое состояние',
        response: { [httpStatus.OK]: QuestionViewSchema },
      },
    },
    async (request) => getQuestion(request.team),
  );

  app.post(
    '/quest/hint',
    {
      schema: {
        summary:
          'Взять следующую подсказку (строго по порядку); свежий вопрос — в progress.question',
        body: TakeHintRequestSchema,
        response: { [httpStatus.OK]: ProgressSchema },
      },
    },
    async (request) => takeHint(request.team, request.body.hintIndex),
  );

  app.get(
    '/quest/state',
    {
      schema: {
        summary: 'Состояние открытого вопроса; с `since` ждёт, пока оно изменится',
        querystring: WaitQuestionStateQuerySchema,
        response: { [httpStatus.OK]: QuestionStateSchema },
      },
    },
    async (request) => getQuestionState(request.team, request.query.since),
  );

  app.put(
    '/quest/state',
    {
      schema: {
        summary: 'Сохранить промежуточное состояние прохождения (любой JSON)',
        body: SaveQuestionStateRequestSchema,
        response: { [httpStatus.OK]: QuestionStateSchema },
      },
    },
    async (request) => setQuestionState(request.team, request.body.state),
  );

  app.post(
    '/quest/answer',
    {
      schema: {
        summary: 'Финальный ответ: штраф за ошибку или закрытие вопроса',
        body: SubmitAnswerRequestSchema,
        response: { [httpStatus.OK]: AnswerResultSchema },
      },
    },
    async (request) => submitAnswer(request.team, request.body.answer),
  );
};
