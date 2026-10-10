import { type SchemaDefinition } from 'mongoose';
import { type Question } from '../../models/questionFields.js';

export interface GoogleFormsQuestion extends Question {
  /** Тема чата, куда команде идти: её иконка стоит в шапке формы */
  topic: string;
}

export const googleFormsExtraFields: SchemaDefinition = {
  topic: { type: String, required: true, default: '' },
};
