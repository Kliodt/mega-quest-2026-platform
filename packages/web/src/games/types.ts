import { type AnswerResultDto, type QuestionViewDto } from '@quest/shared';
import { type ComponentType } from 'react';

export interface LastAnswerResult {
  correct: boolean;
  penaltySecondsAdded: number;
}

/** Что core даёт компоненту типа игры; форму `content`, `answer` и `state` знает тип. */
export interface GameContentProps {
  question: QuestionViewDto;
  /** Финальный ответ; результат возвращается, чтобы игра могла продолжить свой сценарий */
  onSubmit: (answer: unknown) => Promise<AnswerResultDto>;
  submitting: boolean;
  lastResult: LastAnswerResult | null;
  onSaveState: (state: unknown) => void;
  /** Номер аудитории по её коду: играм, где ответ — номер следующей аудитории */
  onReadRoomNumber: (code: string) => Promise<string>;
  /** Открыть следующий вопрос по коду аудитории — то же, что ввод кода вручную */
  onEnterCode: (code: string) => Promise<void>;
}

/** Попытка команды в админке: форму payload знает только тип игры */
export interface AttemptViewProps {
  payload: unknown;
}

/** Вопросы игры для организатора; элементы отдаёт core как unknown */
export interface AdminQuestionsProps {
  questions: unknown[];
}

/** Всё, что фронт знает о типе игры. Регистрируется в games/registry.tsx. */
export interface WebGameTypeDefinition {
  label: string;
  Content: ComponentType<GameContentProps>;
  AttemptView: ComponentType<AttemptViewProps>;
  AdminQuestions: ComponentType<AdminQuestionsProps>;
  /**
   * Задание занимает весь экран: ни шапки платформы, ни таймера, ни рамки вопроса —
   * игра притворяется чужим сайтом и сама открывает доступ к платформе.
   */
  fullscreen?: boolean;
}
