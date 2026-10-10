import { Type, type Static } from '@sinclair/typebox';
import {
  GameType,
  Location,
  QuestPhase,
  StepState,
  StepKind,
  TimeAdjustmentType,
} from '../enums.js';
import { TeamSchema } from './auth.js';

export const TimerSchema = Type.Object({
  elapsedSeconds: Type.Integer({ minimum: 0 }),
  /** Сумма всех поправок времени команды; может быть отрицательной */
  timeAdjustmentSeconds: Type.Integer(),
  totalSeconds: Type.Integer({ minimum: 0 }),
  running: Type.Boolean(),
});
export type TimerDto = Static<typeof TimerSchema>;

export const HintSchema = Type.Object({
  index: Type.Integer({ minimum: 0 }),
  penaltySeconds: Type.Integer({ minimum: 0 }),
  taken: Type.Boolean(),
  /** Содержимое приходит только после того, как подсказка взята */
  html: Type.Union([Type.String(), Type.Null()]),
  data: Type.Optional(Type.Unknown()),
});
export type HintDto = Static<typeof HintSchema>;

/** Одна поправка времени: штраф или бонус по любой причине (см. TimeAdjustmentType). */
export const TimeAdjustmentSchema = Type.Object({
  id: Type.String(),
  /** > 0 штраф, < 0 бонус */
  timeAdjustmentSeconds: Type.Integer(),
  type: Type.Enum(TimeAdjustmentType),
  createdAt: Type.String({ format: 'date-time' }),
  /** У автоматических поправок пустой */
  comment: Type.Union([Type.String(), Type.Null()]),
  /** Шаг маршрута, к которому относится поправка; null у поправок на команду в целом */
  stepIndex: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
});
export type TimeAdjustmentDto = Static<typeof TimeAdjustmentSchema>;

export const LocationTransitionCardSchema = Type.Object({
  kind: Type.Literal(StepKind.LOCATION_TRANSITION),
  stepIndex: Type.Integer({ minimum: 0 }),
  location: Type.Enum(Location),
  locationTitle: Type.String(),
  state: Type.Enum(StepState),
});
export type LocationTransitionCardDto = Static<typeof LocationTransitionCardSchema>;

/** Достижение за засчитанный ответ: картинка из `public/achievements/` и её название. */
export const AchievementSchema = Type.Object({
  image: Type.String(),
  title: Type.String(),
});
export type AchievementDto = Static<typeof AchievementSchema>;

export const QuestionCardSchema = Type.Object({
  kind: Type.Literal(StepKind.QUESTION),
  stepIndex: Type.Integer({ minimum: 0 }),
  /** Аудитории решённого вопроса; у нерешённого `null`, чтобы не выдать ответ */
  roomNumbers: Type.Union([Type.Array(Type.String()), Type.Null()]),
  state: Type.Enum(StepState),
  solvedSeconds: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  timeAdjustmentSeconds: Type.Union([Type.Integer(), Type.Null()]),
  /** Сколько подсказок команда взяла на этом задании */
  hintsCount: Type.Integer({ minimum: 0 }),
  /** Достижение за этот ответ; null, пока задание не решено */
  achievement: Type.Union([AchievementSchema, Type.Null()]),
});
export type QuestionCardDto = Static<typeof QuestionCardSchema>;

export const StepCardSchema = Type.Union([LocationTransitionCardSchema, QuestionCardSchema]);
export type StepCardDto = Static<typeof StepCardSchema>;

/**
 * Открытый вопрос глазами команды. Общая часть у всех типов игр,
 * `content` и `state` — форма типа игры, core их не трактует.
 */
export const QuestionViewSchema = Type.Object({
  stepIndex: Type.Integer({ minimum: 0 }),
  roomNumber: Type.String(),
  /** Корпус отсканированной аудитории: команда видит его рядом с номером */
  location: Type.Enum(Location),
  gameType: Type.Enum(GameType),
  content: Type.Unknown(),
  /** Ответы приходят команде только у игр, которые прячут их своей механикой; иначе пусто */
  answers: Type.Array(Type.String()),
  /** Ответ засчитывает внешний механизм: экран ждёт этого долгим запросом состояния */
  waitsForExternalAnswer: Type.Boolean(),
  hints: Type.Array(HintSchema),
  nextHintIndex: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
  attemptsCount: Type.Integer({ minimum: 0 }),
  wrongAttemptsCount: Type.Integer({ minimum: 0 }),
  wrongAttemptPenaltySeconds: Type.Integer({ minimum: 0 }),
  /** Сумма поправок времени по этому шагу */
  stepTimeAdjustmentSeconds: Type.Integer(),
  /** Промежуточное состояние прохождения, сохранённое командой; null, пока не сохраняли */
  state: Type.Unknown(),
});
export type QuestionViewDto = Static<typeof QuestionViewSchema>;

export const ProgressSchema = Type.Object({
  team: TeamSchema,
  phase: Type.Enum(QuestPhase),
  currentStepIndex: Type.Integer({ minimum: 0 }),
  totalQuestions: Type.Integer({ minimum: 0 }),
  solvedCount: Type.Integer({ minimum: 0 }),
  /** Полученные достижения по порядку; будущие команде не уходят */
  achievements: Type.Array(AchievementSchema),
  steps: Type.Array(StepCardSchema),
  /** Аудитории, код которых команда вводит сейчас; null, когда она узнаёт их из ответа сама */
  nextRoomNumbers: Type.Union([Type.Array(Type.String()), Type.Null()]),
  /** Что организаторы говорят на пути в следующий корпус; null вне перехода и без текста */
  transitionHtml: Type.Union([Type.String(), Type.Null()]),
  question: Type.Union([QuestionViewSchema, Type.Null()]),
  timer: TimerSchema,
  timeAdjustments: Type.Array(TimeAdjustmentSchema),
  serverNow: Type.String({ format: 'date-time' }),
});
export type ProgressDto = Static<typeof ProgressSchema>;

export const EnterCodeRequestSchema = Type.Object({
  code: Type.String({ minLength: 1, maxLength: 32 }),
});
export type EnterCodeRequestDto = Static<typeof EnterCodeRequestSchema>;

/** Код аудитории, отсканированный командой. */
export const RoomNumberRequestSchema = Type.Object({
  code: Type.String({ minLength: 1, maxLength: 32 }),
});
export type RoomNumberRequestDto = Static<typeof RoomNumberRequestSchema>;

/** Номер аудитории по её коду: игры, где ответ — номер следующей аудитории. */
export const RoomNumberSchema = Type.Object({
  roomNumber: Type.String(),
});
export type RoomNumberDto = Static<typeof RoomNumberSchema>;

export const TakeHintRequestSchema = Type.Object({
  hintIndex: Type.Integer({ minimum: 0 }),
});
export type TakeHintRequestDto = Static<typeof TakeHintRequestSchema>;

/** Финальный ответ; форму знает тип игры */
export const SubmitAnswerRequestSchema = Type.Object({
  answer: Type.Unknown(),
});
export type SubmitAnswerRequestDto = Static<typeof SubmitAnswerRequestSchema>;

/** Свежий вопрос (или null после верного ответа) — в progress.question */
export const AnswerResultSchema = Type.Object({
  correct: Type.Boolean(),
  penaltySecondsAdded: Type.Integer({ minimum: 0 }),
  progress: ProgressSchema,
});
export type AnswerResultDto = Static<typeof AnswerResultSchema>;

/** Промежуточное состояние прохождения: любой JSON, который команда хочет сохранить */
export const SaveQuestionStateRequestSchema = Type.Object({
  state: Type.Unknown(),
});
export type SaveQuestionStateRequestDto = Static<typeof SaveQuestionStateRequestSchema>;

export const QuestionStateSchema = Type.Object({
  state: Type.Unknown(),
  /** Метка последнего изменения: с ней клиент и ждёт следующего */
  updatedAt: Type.String({ format: 'date-time' }),
});
export type QuestionStateDto = Static<typeof QuestionStateSchema>;

/**
 * Состояние меняет не только команда: у игр, где ответ засчитывает внешний механизм,
 * фронт ждёт изменения долгим запросом, передавая последнюю известную метку.
 */
export const WaitQuestionStateQuerySchema = Type.Object({
  since: Type.Optional(Type.String({ format: 'date-time' })),
});
export type WaitQuestionStateQueryDto = Static<typeof WaitQuestionStateQuerySchema>;
