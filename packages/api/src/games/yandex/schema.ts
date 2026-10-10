import { type SchemaDefinition } from 'mongoose';
import { type Question } from '../../models/questionFields.js';

export interface YandexQuestion extends Question {
  /** Ролик этой команды; файлы лежат статикой под случайными именами */
  videoUrl: string;
}

export const yandexExtraFields: SchemaDefinition = {
  videoUrl: { type: String, required: true },
};
