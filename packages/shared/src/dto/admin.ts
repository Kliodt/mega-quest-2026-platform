import { Type, type Static } from '@sinclair/typebox';
import { GameType, StepState, StepKind, TeamStatus, TimeAdjustmentType } from '../enums.js';
import { TimeAdjustmentSchema, TimerSchema } from './quest.js';
import { RoomRefSchema } from './roomRef.js';
import { TeamStepSchema } from './teamStep.js';

export const RatingEntrySchema = Type.Object({
  rank: Type.Integer({ minimum: 1 }),
  teamId: Type.String(),
  teamName: Type.String(),
  status: Type.Enum(TeamStatus),
  solvedCount: Type.Integer({ minimum: 0 }),
  totalQuestions: Type.Integer({ minimum: 0 }),
  elapsedSeconds: Type.Integer({ minimum: 0 }),
  timeAdjustmentSeconds: Type.Integer(),
  totalSeconds: Type.Integer({ minimum: 0 }),
  finishedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
});
export type RatingEntryDto = Static<typeof RatingEntrySchema>;

export const RatingSchema = Type.Object({
  generatedAt: Type.String({ format: 'date-time' }),
  entries: Type.Array(RatingEntrySchema),
});
export type RatingDto = Static<typeof RatingSchema>;

const OBJECT_ID_PATTERN = '^[a-fA-F0-9]{24}$';

export const TeamIdParamsSchema = Type.Object({
  id: Type.String({ pattern: OBJECT_ID_PATTERN }),
});
export type TeamIdParamsDto = Static<typeof TeamIdParamsSchema>;

export const TimeAdjustmentParamsSchema = Type.Object({
  id: Type.String({ pattern: OBJECT_ID_PATTERN }),
  timeAdjustmentId: Type.String({ pattern: OBJECT_ID_PATTERN }),
});
export type TimeAdjustmentParamsDto = Static<typeof TimeAdjustmentParamsSchema>;

/** Список команд в админке: те же цифры, что в рейтинге, плюс позиция на маршруте и он сам. */
export const AdminTeamSummarySchema = Type.Composite([
  RatingEntrySchema,
  Type.Object({
    currentStepIndex: Type.Integer({ minimum: 0 }),
    totalSteps: Type.Integer({ minimum: 0 }),
    sequence: Type.Array(TeamStepSchema),
  }),
]);
export type AdminTeamSummaryDto = Static<typeof AdminTeamSummarySchema>;

export const AdminTeamsSchema = Type.Object({
  generatedAt: Type.String({ format: 'date-time' }),
  teams: Type.Array(AdminTeamSummarySchema),
});
export type AdminTeamsDto = Static<typeof AdminTeamsSchema>;

/** Вопрос в списках админки: где он стоит и какая это механика. */
export const AdminQuestionRefSchema = Type.Composite([
  RoomRefSchema,
  Type.Object({ gameType: Type.Enum(GameType) }),
]);
export type AdminQuestionRefDto = Static<typeof AdminQuestionRefSchema>;

export const AdminAttemptSchema = Type.Object({
  submittedAt: Type.String({ format: 'date-time' }),
  correct: Type.Boolean(),
  /** Форму знает только тип игры; админка рендерит через его компонент */
  payload: Type.Unknown(),
});
export type AdminAttemptDto = Static<typeof AdminAttemptSchema>;

export const AdminHintTakenSchema = Type.Object({
  index: Type.Integer({ minimum: 0 }),
  takenAt: Type.String({ format: 'date-time' }),
});
export type AdminHintTakenDto = Static<typeof AdminHintTakenSchema>;

export const AdminTransitionStepSchema = Type.Object({
  kind: Type.Union([
    Type.Literal(StepKind.LOCATION_TRANSITION),
    Type.Literal(StepKind.ROOM_TRANSITION),
  ]),
  stepIndex: Type.Integer({ minimum: 0 }),
  state: Type.Enum(StepState),
  /** Аудитория, скан которой закрывает предыдущий вопрос; пусто у переходов без неё */
  options: Type.Array(RoomRefSchema),
});
export type AdminTransitionStepDto = Static<typeof AdminTransitionStepSchema>;

export const AdminQuestionStepSchema = Type.Object({
  kind: Type.Literal(StepKind.QUESTION),
  stepIndex: Type.Integer({ minimum: 0 }),
  state: Type.Enum(StepState),
  /** Допустимые вопросы шага по маршруту */
  options: Type.Array(AdminQuestionRefSchema),
  /** Вопрос, который команда реально открыла; null, пока он не открыт */
  question: Type.Union([AdminQuestionRefSchema, Type.Null()]),
  openedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  answeredAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  solvedSeconds: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  /** Сумма поправок времени по этому шагу */
  timeAdjustmentSeconds: Type.Integer(),
  hintsCount: Type.Integer({ minimum: 0 }),
  attemptsCount: Type.Integer({ minimum: 0 }),
  wrongAttemptsCount: Type.Integer({ minimum: 0 }),
  attempts: Type.Array(AdminAttemptSchema),
  hints: Type.Array(AdminHintTakenSchema),
});
export type AdminQuestionStepDto = Static<typeof AdminQuestionStepSchema>;

export const AdminStepSchema = Type.Union([AdminTransitionStepSchema, AdminQuestionStepSchema]);
export type AdminStepDto = Static<typeof AdminStepSchema>;

export const AdminTeamDetailSchema = Type.Object({
  team: Type.Object({
    id: Type.String(),
    name: Type.String(),
    status: Type.Enum(TeamStatus),
    currentStepIndex: Type.Integer({ minimum: 0 }),
    sequence: Type.Array(TeamStepSchema),
  }),
  timer: TimerSchema,
  steps: Type.Array(AdminStepSchema),
  timeAdjustments: Type.Array(TimeAdjustmentSchema),
  serverNow: Type.String({ format: 'date-time' }),
});
export type AdminTeamDetailDto = Static<typeof AdminTeamDetailSchema>;

export const AdminCreateTeamRequestSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  password: Type.String({ minLength: 4, maxLength: 200 }),
  sequence: Type.Array(TeamStepSchema, { minItems: 1 }),
});
export type AdminCreateTeamRequestDto = Static<typeof AdminCreateTeamRequestSchema>;

export const AdminUpdateTeamRequestSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  password: Type.Optional(Type.String({ minLength: 4, maxLength: 200 })),
  sequence: Type.Optional(Type.Array(TeamStepSchema, { minItems: 1 })),
});
export type AdminUpdateTeamRequestDto = Static<typeof AdminUpdateTeamRequestSchema>;

/** Ручная поправка: ноль запрещён, согласованность знака и типа проверяет форма. */
export const AdminAddTimeAdjustmentRequestSchema = Type.Object({
  timeAdjustmentSeconds: Type.Union([Type.Integer({ maximum: -1 }), Type.Integer({ minimum: 1 })]),
  type: Type.Enum(TimeAdjustmentType),
  comment: Type.String({ minLength: 1, maxLength: 500 }),
  stepIndex: Type.Optional(Type.Integer({ minimum: 0 })),
});
export type AdminAddTimeAdjustmentRequestDto = Static<typeof AdminAddTimeAdjustmentRequestSchema>;

/** Шаг-вопрос, к началу которого возвращают команду. */
export const AdminRewindTeamRequestSchema = Type.Object({
  stepIndex: Type.Integer({ minimum: 0 }),
});
export type AdminRewindTeamRequestDto = Static<typeof AdminRewindTeamRequestSchema>;

/** Вопрос для организатора: общая часть от core, `content` с ответами — от типа игры. */
export const AdminQuestionSchema = Type.Object({
  /** Аудитории, в которых стоит этот вопрос */
  rooms: Type.Array(RoomRefSchema),
  gameType: Type.Enum(GameType),
  /** Ответ — номер следующей аудитории команды */
  answerIsNextRoom: Type.Boolean(),
  /** Номер подставляет ядро по маршруту, своих `acceptedAnswers` у вопроса нет */
  hasDynamicAnswer: Type.Boolean(),
  /** Ответ засчитывает внешний механизм: команда на экране его ждёт */
  waitsForExternalAnswer: Type.Boolean(),
  /** Команды, которым достанется именно этот вариант; пусто — вариант общий */
  teamNames: Type.Array(Type.String()),
  content: Type.Unknown(),
});
export type AdminQuestionDto = Static<typeof AdminQuestionSchema>;

export const AdminQuestionsSchema = Type.Object({
  questions: Type.Array(AdminQuestionSchema),
});
export type AdminQuestionsDto = Static<typeof AdminQuestionsSchema>;

/** Код на двери: какая за ним аудитория и стоит ли там вопрос. */
export const AdminBindingSchema = Type.Composite([
  RoomRefSchema,
  Type.Object({
    code: Type.String(),
    /** Аудитория, как её пишут организаторы: с корпусом Биржи и прочими пометками */
    roomTitle: Type.String(),
    /** Вопросов в этой аудитории; ноль значит, что код ведёт в никуда */
    questionsCount: Type.Integer({ minimum: 0 }),
  }),
]);
export type AdminBindingDto = Static<typeof AdminBindingSchema>;

/** Команда, чей маршрут не сходится с вопросами: проверку запускают и при старте, и руками. */
export const AdminRouteProblemSchema = Type.Object({
  teamId: Type.String(),
  teamName: Type.String(),
  errors: Type.Array(Type.String()),
});
export type AdminRouteProblemDto = Static<typeof AdminRouteProblemSchema>;

export const AdminValidationSchema = Type.Object({
  ok: Type.Boolean(),
  checkedTeams: Type.Integer({ minimum: 0 }),
  problems: Type.Array(AdminRouteProblemSchema),
});
export type AdminValidationDto = Static<typeof AdminValidationSchema>;

export const AdminBindingsSchema = Type.Object({
  bindings: Type.Array(AdminBindingSchema),
});
export type AdminBindingsDto = Static<typeof AdminBindingsSchema>;

/** Коды печатаются в QR: восемь латинских букв или цифр, регистр важен. */
const CODE_PATTERN = '^[a-zA-Z0-9]{8}$';

/** Заведение или правка кода: код уникален, аудиторию у него можно поменять. */
export const AdminSaveBindingRequestSchema = Type.Composite([
  RoomRefSchema,
  Type.Object({ code: Type.String({ pattern: CODE_PATTERN }) }),
]);
export type AdminSaveBindingRequestDto = Static<typeof AdminSaveBindingRequestSchema>;

export const BindingCodeParamsSchema = Type.Object({
  code: Type.String({ pattern: CODE_PATTERN }),
});
export type BindingCodeParamsDto = Static<typeof BindingCodeParamsSchema>;

/** Клетка поля со своим кодом: коды клеток расклеены в аудитории вопроса, это не коды дверей. */
const CellFieldsSchema = Type.Object({
  code: Type.String({ pattern: CODE_PATTERN }),
  row: Type.Integer({ minimum: 0 }),
  col: Type.Integer({ minimum: 0 }),
});

export const AdminCellSchema = Type.Composite([RoomRefSchema, CellFieldsSchema]);
export type AdminCellDto = Static<typeof AdminCellSchema>;

export const AdminCellsSchema = Type.Object({
  cells: Type.Array(AdminCellSchema),
});
export type AdminCellsDto = Static<typeof AdminCellsSchema>;

/** Заведение кода клетки или перенос его на другую клетку; аудитория называет вопрос. */
export const AdminSaveCellRequestSchema = AdminCellSchema;
export type AdminSaveCellRequestDto = Static<typeof AdminSaveCellRequestSchema>;

export const CellCodeParamsSchema = Type.Object({
  code: Type.String({ pattern: CODE_PATTERN }),
});
export type CellCodeParamsDto = Static<typeof CellCodeParamsSchema>;
