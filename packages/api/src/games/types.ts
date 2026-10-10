import { type GameType, type QuestionFieldDto } from '@quest/shared';
import { type SchemaDefinition } from 'mongoose';
import { type Question } from '../models/questionFields.js';

/** Вопрос в поведении, которое нужно core; форму `content` и `answer` знает тип игры. */
export interface GameQuestion {
  hints: GameQuestionHint[];
  wrongAttemptPenaltySeconds: number;
  toPublicContent(): unknown;
  checkAnswer(answer: unknown): boolean;
}

export interface GameQuestionHint extends QuestionFieldDto {
  penaltySeconds: number;
}

/**
 * Контракт типа игры. Всё, кроме `gameType`, — переопределения умолчаний core
 * (текстовое задание, ответ строкой). Читает и пишет вопросы core.
 */
export interface GameTypeDefinition<Q extends Question = Question> {
  gameType: GameType;
  /** Поля вопроса сверх базовых */
  extraFields?: SchemaDefinition;
  toPublicContent?(this: void, question: Q): unknown;
  checkAnswer?(this: void, question: Q, answer: unknown): boolean;
  toAdminContent?(this: void, question: Q): unknown;
  /** Проверка или преобразование состояния из `PUT /quest/state` */
  onStateUpdate?(this: void, question: GameQuestion, previous: unknown, next: unknown): unknown;
}
