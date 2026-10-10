import { type RoomRef } from '@quest/shared';
import { Schema, model, type HydratedDocument, type Types } from 'mongoose';
import { roomRefSchema, type Question } from './questionFields.js';

/** Факт попытки; секунды за неверный ответ лежат в `teams.timeAdjustments` */
export interface Attempt {
  submittedAt: Date;
  payload: unknown;
  correct: boolean;
}

/** Факт взятия подсказки; секунды за неё лежат в `teams.timeAdjustments` */
export interface HintTaken {
  index: number;
  takenAt: Date;
}

interface QuestionState {
  teamId: Types.ObjectId;
  stepIndex: number;
  /** Аудитория, код которой команда отсканировала: вопрос стоит в нескольких */
  room: RoomRef;
  /** Выданный вопрос: по нему видно, кем и когда он был занят */
  questionId: Types.ObjectId;
  /** Вопрос, каким его увидела команда: правки вопроса открытую игру не меняют */
  questionSnapshot: Question;
  openedAt: Date;
  answeredAt: Date | null;
  attempts: Attempt[];
  hintsTaken: HintTaken[];
  /** Промежуточное состояние прохождения, сохранённое командой; форму знает тип игры */
  state: unknown;
  /** Проставляет Mongoose (`timestamps`); по ней фронт ждёт изменения состояния */
  updatedAt: Date;
}

export interface QuestionStateDocument extends HydratedDocument<QuestionState> {}

const attemptSchema = new Schema<Attempt>(
  {
    submittedAt: { type: Date, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    correct: { type: Boolean, required: true },
  },
  { _id: false },
);

const hintTakenSchema = new Schema<HintTaken>(
  {
    index: { type: Number, required: true, min: 0 },
    takenAt: { type: Date, required: true },
  },
  { _id: false },
);

const questionStateSchema = new Schema<QuestionState>(
  {
    teamId: { type: Schema.Types.ObjectId, required: true, ref: 'Team' },
    stepIndex: { type: Number, required: true, min: 0 },
    room: { type: roomRefSchema, required: true },
    questionId: { type: Schema.Types.ObjectId, required: true, index: true },
    questionSnapshot: { type: Schema.Types.Mixed, required: true },
    openedAt: { type: Date, required: true },
    answeredAt: { type: Date, default: null },
    attempts: { type: [attemptSchema], required: true, default: [] },
    hintsTaken: { type: [hintTakenSchema], required: true, default: [] },
    state: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, minimize: false },
);

questionStateSchema.index({ teamId: 1, stepIndex: 1 }, { unique: true });

export const QuestionStateModel = model<QuestionState>(
  'QuestionState',
  questionStateSchema,
  'questionStates',
);
