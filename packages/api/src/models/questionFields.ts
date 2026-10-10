import { GameType, Location, type RoomRef } from '@quest/shared';
import { Schema, type SchemaDefinition } from 'mongoose';

/**
 * Кусок содержимого в базе: `html` — текст (обычный текст тоже разметка),
 * `data` — произвольный JSON механики. Наружу уходит своим DTO, не этим типом.
 */
export interface QuestionField {
  html: string;
  data?: unknown;
}

interface QuestionHint extends QuestionField {
  penaltySeconds: number;
}

/**
 * Код внутри задания и клетка поля, к которой он привязан: их сканируют по ходу игры,
 * к кодам на дверях (`bindings`) отношения они не имеют. Так устроен сапёр.
 */
export interface QuestionCell {
  code: string;
  row: number;
  col: number;
}

/**
 * Вопрос: и само задание, и места, где оно стоит. Отдельной сущности игры нет,
 * вопросы всех типов лежат в одной коллекции; поля сверх базовых добавляет тип игры.
 * Один и тот же вопрос стоит в нескольких аудиториях, а ответ берётся из маршрута
 * команды, поэтому он описан один раз и перечисляет свои аудитории.
 */
export interface Question extends QuestionField {
  gameType: GameType;
  /** Аудитории, в которых стоит этот вопрос; в аудитории вопрос один */
  rooms: RoomRef[];
  /** Заранее известные ответы; у вопроса с динамическим ответом пусто */
  acceptedAnswers: QuestionField[];
  /** Ответ — номер следующей аудитории команды */
  answerIsNextRoom: boolean;
  /** Номер следующей аудитории подставляется в момент открытия вопроса. Ветвление запрещено. */
  hasDynamicAnswer: boolean;
  /** Ответ уходит команде вместе с вопросом: механика игры прячет его сама */
  shouldSendAnswer: boolean;
  /** Ответ засчитывает внешний механизм: экран команды ждёт этого, поля ввода у вопроса нет */
  waitsForExternalAnswer: boolean;
  /** Номер механизма, которым он себя называет: у sound buttons это номер дрампада */
  externalAnswerCode: number | null;
  /** Команды (их `slug`), которым предназначен вариант; пусто — вариант общий */
  teamSlugs: string[];
  /** Коды клеток внутри задания; наружу не уходят — код сверяет сервер */
  cells: QuestionCell[];
  wrongAttemptPenaltySeconds: number;
  hints: QuestionHint[];
}

export const questionFieldSchema = new Schema<QuestionField>(
  {
    html: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const hintSchema = new Schema<QuestionHint>(
  {
    html: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    penaltySeconds: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const cellSchema = new Schema<QuestionCell>(
  {
    code: { type: String, required: true },
    row: { type: Number, required: true, min: 0 },
    col: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

export const roomRefSchema = new Schema<RoomRef>(
  {
    location: { type: String, required: true, enum: Object.values(Location) },
    roomNumber: { type: String, required: true },
  },
  { _id: false },
);

export const baseQuestionFields: SchemaDefinition<Question> = {
  gameType: { type: String, required: true, enum: Object.values(GameType) },
  rooms: { type: [roomRefSchema], required: true },
  // Бывают задания без текста: у гугл-форм вся механика вне платформы
  html: { type: String, default: '' },
  data: { type: Schema.Types.Mixed },
  // Пустые ответы допустимы только у динамического вопроса; это проверяет загрузчик
  acceptedAnswers: { type: [questionFieldSchema], required: true },
  answerIsNextRoom: { type: Boolean, required: true, default: false },
  hasDynamicAnswer: { type: Boolean, required: true, default: false },
  shouldSendAnswer: { type: Boolean, required: true, default: false },
  waitsForExternalAnswer: { type: Boolean, required: true, default: false },
  externalAnswerCode: { type: Number, default: null, min: 0 },
  teamSlugs: { type: [String], required: true, default: [] },
  cells: { type: [cellSchema], required: true, default: [] },
  wrongAttemptPenaltySeconds: { type: Number, required: true, min: 0 },
  hints: { type: [hintSchema], required: true },
};
