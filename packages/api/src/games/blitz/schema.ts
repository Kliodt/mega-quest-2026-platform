import { Schema, type SchemaDefinition } from 'mongoose';
import {
  questionFieldSchema,
  type Question,
  type QuestionField,
} from '../../models/questionFields.js';

/** Вопрос викторины: формулировка и варианты, из которых команда выбирает один. */
export interface BlitzQuizItem extends QuestionField {
  options: QuestionField[];
  correctOption: number;
}

export interface BlitzQuestion extends Question {
  quiz: BlitzQuizItem[];
}

const quizItemSchema = new Schema<BlitzQuizItem>(
  {
    html: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    options: { type: [questionFieldSchema], required: true },
    correctOption: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

export const blitzExtraFields: SchemaDefinition<Omit<BlitzQuestion, keyof Question>> = {
  quiz: { type: [quizItemSchema], required: true },
};
