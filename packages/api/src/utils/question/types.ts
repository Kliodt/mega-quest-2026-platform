import { type GameQuestion, type GameTypeDefinition } from '../../games/types.js';
import { type QuestionStateDocument } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';

/** Насколько вопрос занят: когда его в последний раз выдавали и отвечают ли на него сейчас. */
export interface QuestionUsage {
  questionId: string;
  /** Команда открыла его и ещё не ответила */
  busy: boolean;
  /** Ответ на последнюю выдачу, а у занятого — её открытие */
  usedAt: Date;
}

/** Открытый вопрос команды: состояние со снимком вопроса и поведение от типа игры. */
export interface OpenQuestionContext {
  team: TeamDocument;
  state: QuestionStateDocument;
  question: GameQuestion;
  definition: GameTypeDefinition;
}
