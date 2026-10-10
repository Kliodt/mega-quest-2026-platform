import { TimeAdjustmentType, type TeamStep } from '@quest/shared';
import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

/** Поправка времени: знак секунд задаёт направление, `type` — только причину. */
export interface TimeAdjustment {
  _id: Types.ObjectId;
  timeAdjustmentSeconds: number;
  type: TimeAdjustmentType;
  createdAt: Date;
  /** У автоматических поправок пустой */
  comment: string | null;
  /** Шаг маршрута, к которому относится поправка; null у поправок на команду в целом */
  stepIndex: number | null;
}

export interface Team {
  /**
   * Постоянное имя команды в данных: на него ссылаются варианты вопросов. Имя команды
   * организаторы меняют, `slug` — нет, поэтому связывать данные нужно с ним.
   */
  slug: string;
  /** Имя команды из таблицы организаторов: по нему команда себя и находит при входе */
  name: string;
  passwordHash: string;
  sessionId: string | null;
  sequence: TeamStep[];
  currentStepIndex: number;
  timeAdjustments: TimeAdjustment[];
}

export interface TeamDocument extends HydratedDocument<Team> {}

const timeAdjustmentSchema = new Schema<TimeAdjustment>({
  timeAdjustmentSeconds: { type: Number, required: true },
  type: { type: String, enum: Object.values(TimeAdjustmentType), required: true },
  createdAt: { type: Date, required: true },
  comment: { type: String, default: null },
  stepIndex: { type: Number, default: null, min: 0 },
});

const teamSchema = new Schema<Team>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    sessionId: { type: String, default: null },
    sequence: { type: Schema.Types.Mixed, required: true },
    currentStepIndex: { type: Number, required: true, default: 0, min: 0 },
    timeAdjustments: { type: [timeAdjustmentSchema], required: true, default: [] },
  },
  { timestamps: true, minimize: false },
);

export const TeamModel = model<Team>('Team', teamSchema, 'teams');
