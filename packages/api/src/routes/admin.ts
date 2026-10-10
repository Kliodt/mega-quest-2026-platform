import { type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  AdminAddTimeAdjustmentRequestSchema,
  AdminBindingsSchema,
  AdminCellsSchema,
  AdminCreateTeamRequestSchema,
  AdminQuestionsSchema,
  AdminRewindTeamRequestSchema,
  AdminSaveBindingRequestSchema,
  AdminSaveCellRequestSchema,
  AdminTeamDetailSchema,
  AdminTeamsSchema,
  AdminUpdateTeamRequestSchema,
  AdminValidationSchema,
  BindingCodeParamsSchema,
  CellCodeParamsSchema,
  OkSchema,
  RatingSchema,
  TeamIdParamsSchema,
  TimeAdjustmentParamsSchema,
  type OkDto,
} from '@quest/shared';
import httpStatus from 'http-status';
import routeSchemaDefaults from '../plugins/routeSchemaDefaults.js';
import { addTimeAdjustment } from '../services/admin/addTimeAdjustment.js';
import { answerForTeam } from '../services/admin/answerForTeam.js';
import { createTeam } from '../services/admin/createTeam.js';
import { deleteBinding } from '../services/admin/deleteBinding.js';
import { deleteCell } from '../services/admin/deleteCell.js';
import { deleteTeam } from '../services/admin/deleteTeam.js';
import { deleteTimeAdjustment } from '../services/admin/deleteTimeAdjustment.js';
import { getAdminBindings } from '../services/admin/getAdminBindings.js';
import { getAdminCells } from '../services/admin/getAdminCells.js';
import { getAdminQuestions } from '../services/admin/getAdminQuestions.js';
import { getAdminTeamDetail } from '../services/admin/getAdminTeamDetail.js';
import { getAdminTeams } from '../services/admin/getAdminTeams.js';
import { resetTeam } from '../services/admin/resetTeam.js';
import { rewindTeam } from '../services/admin/rewindTeam.js';
import { saveBinding } from '../services/admin/saveBinding.js';
import { saveCell } from '../services/admin/saveCell.js';
import { scanForTeam } from '../services/admin/scanForTeam.js';
import { updateTeam } from '../services/admin/updateTeam.js';
import { getRating } from '../services/rating/getRating.js';
import { validateAllTeamSequences } from '../services/startupValidation/validateAllTeamSequences.js';

export const adminRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.addHook('onRequest', app.adminAuth);
  await app.register(routeSchemaDefaults, { tags: ['admin'], security: [{ adminToken: [] }] });

  app.get(
    '/admin/rating',
    {
      schema: {
        summary: 'Рейтинг команд',
        response: { [httpStatus.OK]: RatingSchema },
      },
    },
    async () => getRating(),
  );

  app.get(
    '/admin/questions',
    {
      schema: {
        summary: 'Все вопросы с правильными ответами; форму содержимого задаёт тип игры',
        response: { [httpStatus.OK]: AdminQuestionsSchema },
      },
    },
    async () => getAdminQuestions(),
  );

  app.get(
    '/admin/teams',
    {
      schema: {
        summary: 'Список команд со статусом, временем и штрафами',
        response: { [httpStatus.OK]: AdminTeamsSchema },
      },
    },
    async () => getAdminTeams(),
  );

  app.post(
    '/admin/teams',
    {
      schema: {
        summary: 'Создать команду с паролем и маршрутом',
        body: AdminCreateTeamRequestSchema,
        response: { [httpStatus.CREATED]: AdminTeamDetailSchema },
      },
    },
    async (request, reply) => {
      const detail = await createTeam(request.body);
      return reply.status(httpStatus.CREATED).send(detail);
    },
  );

  app.get(
    '/admin/teams/:id',
    {
      schema: {
        summary: 'Карта команды: шаги маршрута, попытки, подсказки, штрафы и корректировки',
        params: TeamIdParamsSchema,
        response: { [httpStatus.OK]: AdminTeamDetailSchema },
      },
    },
    async (request) => getAdminTeamDetail(request.params.id),
  );

  app.patch(
    '/admin/teams/:id',
    {
      schema: {
        summary: 'Изменить имя, пароль или маршрут команды',
        params: TeamIdParamsSchema,
        body: AdminUpdateTeamRequestSchema,
        response: { [httpStatus.OK]: AdminTeamDetailSchema },
      },
    },
    async (request) => updateTeam(request.params.id, request.body),
  );

  app.delete(
    '/admin/teams/:id',
    {
      schema: {
        summary: 'Удалить команду вместе с её ответами и корректировками',
        params: TeamIdParamsSchema,
        response: { [httpStatus.OK]: OkSchema },
      },
    },
    async (request): Promise<OkDto> => {
      await deleteTeam(request.params.id);
      return { ok: true };
    },
  );

  app.post(
    '/admin/teams/:id/reset',
    {
      schema: {
        summary: 'Сбросить состояние команды: удалить ответы, вернуть на старт, разлогинить',
        params: TeamIdParamsSchema,
        response: { [httpStatus.OK]: OkSchema },
      },
    },
    async (request): Promise<OkDto> => {
      await resetTeam(request.params.id);
      return { ok: true };
    },
  );

  app.post(
    '/admin/teams/:id/rewind',
    {
      schema: {
        summary: 'Вернуть команду к началу шага-вопроса: стереть его и всё, что было после',
        params: TeamIdParamsSchema,
        body: AdminRewindTeamRequestSchema,
        response: { [httpStatus.OK]: AdminTeamDetailSchema },
      },
    },
    async (request) => rewindTeam(request.params.id, request.body.stepIndex),
  );

  app.post(
    '/admin/teams/:id/answer',
    {
      schema: {
        summary: 'Засчитать открытый вопрос за команду: ответ верный, команда идёт дальше',
        params: TeamIdParamsSchema,
        response: { [httpStatus.OK]: AdminTeamDetailSchema },
      },
    },
    async (request) => answerForTeam(request.params.id),
  );

  app.post(
    '/admin/teams/:id/scan',
    {
      schema: {
        summary: 'Засчитать скан кода за команду: открыть следующий шаг или закрыть квест',
        params: TeamIdParamsSchema,
        response: { [httpStatus.OK]: AdminTeamDetailSchema },
      },
    },
    async (request) => scanForTeam(request.params.id, request.log),
  );

  app.post(
    '/admin/teams/:id/time-adjustments',
    {
      schema: {
        summary: 'Добавить поправку времени: секунды > 0 штраф, < 0 бонус; тип — причина',
        params: TeamIdParamsSchema,
        body: AdminAddTimeAdjustmentRequestSchema,
        response: { [httpStatus.OK]: AdminTeamDetailSchema },
      },
    },
    async (request) => addTimeAdjustment(request.params.id, request.body),
  );

  app.delete(
    '/admin/teams/:id/time-adjustments/:timeAdjustmentId',
    {
      schema: {
        summary: 'Отменить поправку времени, в том числе автоматическую',
        params: TimeAdjustmentParamsSchema,
        response: { [httpStatus.OK]: AdminTeamDetailSchema },
      },
    },
    async (request) => deleteTimeAdjustment(request.params.id, request.params.timeAdjustmentId),
  );

  app.get(
    '/admin/validation',
    {
      schema: {
        summary: 'Сходятся ли маршруты команд с вопросами в базе',
        response: { [httpStatus.OK]: AdminValidationSchema },
      },
    },
    async () => validateAllTeamSequences(),
  );

  app.get(
    '/admin/bindings',
    {
      schema: {
        summary: 'Коды на дверях: какая за каждым аудитория',
        response: { [httpStatus.OK]: AdminBindingsSchema },
      },
    },
    async () => getAdminBindings(),
  );

  app.post(
    '/admin/bindings',
    {
      schema: {
        summary: 'Завести код или перенести его в другую аудиторию',
        body: AdminSaveBindingRequestSchema,
        response: { [httpStatus.OK]: AdminBindingsSchema },
      },
    },
    async (request) => saveBinding(request.body),
  );

  app.delete(
    '/admin/bindings/:code',
    {
      schema: {
        summary: 'Убрать код с двери',
        params: BindingCodeParamsSchema,
        response: { [httpStatus.OK]: AdminBindingsSchema },
      },
    },
    async (request) => deleteBinding(request.params.code),
  );

  app.get(
    '/admin/cells',
    {
      schema: {
        summary: 'Коды клеток поля: какая клетка какого вопроса за каждым',
        response: { [httpStatus.OK]: AdminCellsSchema },
      },
    },
    async () => getAdminCells(),
  );

  app.post(
    '/admin/cells',
    {
      schema: {
        summary: 'Завести код клетки или перенести его на другую клетку',
        body: AdminSaveCellRequestSchema,
        response: { [httpStatus.OK]: AdminCellsSchema },
      },
    },
    async (request) => saveCell(request.body),
  );

  app.delete(
    '/admin/cells/:code',
    {
      schema: {
        summary: 'Убрать код с клетки поля',
        params: CellCodeParamsSchema,
        response: { [httpStatus.OK]: AdminCellsSchema },
      },
    },
    async (request) => deleteCell(request.params.code),
  );
};
