import { type GameType } from '@quest/shared';
import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { gameTypeRegistry } from '../games/registry.js';
import { baseQuestionFields, type Question } from './questionFields.js';

export interface QuestionDocument extends HydratedDocument<Question> {}

const questionSchema = new Schema<Question>(baseQuestionFields, {
  discriminatorKey: 'gameType',
  timestamps: false,
});

// В аудитории бывает несколько вопросов: их выдают командам по очереди
questionSchema.index({ 'rooms.location': 1, 'rooms.roomNumber': 1 });

export const QuestionModel = model<Question>('Question', questionSchema, 'questions');

// Поля сверх базовых объявляет тип игры, коллекция одна на всех
for (const definition of Object.values(gameTypeRegistry)) {
  QuestionModel.discriminator(
    definition.gameType,
    new Schema(definition.extraFields ?? {}, { discriminatorKey: 'gameType' }),
  );
}

/** Модель с полями этого типа: ею пишут вопросы, читать можно базовой. */
export function getQuestionModel(gameType: GameType): Model<Question> {
  const typed = QuestionModel.discriminators?.[gameType] as Model<Question> | undefined;
  if (!typed) {
    throw new Error(`Question model for game type ${gameType} is not registered`);
  }
  return typed;
}
