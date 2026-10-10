import { type SchemaDefinition } from 'mongoose';
import {
  questionFieldSchema,
  type Question,
  type QuestionField,
} from '../../models/questionFields.js';

export interface YagodnoeQuestion extends Question {
  /** Вводная: кто команда в этой истории и что у неё случилось */
  intro: QuestionField;
  /** Таблица с анкетами участников; у каждого варианта вопроса она своя */
  tableUrl: string;
}

export const yagodnoeExtraFields: SchemaDefinition = {
  intro: { type: questionFieldSchema, required: true },
  tableUrl: { type: String, required: true },
};
