import {
  type GameType,
  type QuestionViewDto,
  type RoomRef,
  type TeamDto,
  type TeamStep,
} from '@quest/shared';
import { type Attempt, type HintTaken } from '../../models/QuestionState.js';
import { type TimeAdjustment } from '../../models/Team.js';

export interface ProgressStateInput {
  stepIndex: number;
  /** Аудитория, в которой команда открыла вопрос */
  room: RoomRef;
  questionSnapshot: ProgressQuestionInput;
  openedAt: Date;
  answeredAt: Date | null;
  attempts: Attempt[];
  hintsTaken: HintTaken[];
}

/** Подмножество документа вопроса; сам QuestionDocument ему структурно соответствует */
export interface ProgressQuestionInput {
  gameType: GameType;
  /** Ответ на вопрос — номер следующей аудитории команды */
  answerIsNextRoom?: boolean;
  /** Принимаемые ответы снимка: у вопроса-аудитории это и есть следующая аудитория */
  acceptedAnswers?: { html: string }[];
}

export type StatesByIndex = ReadonlyMap<number, ProgressStateInput>;

export interface ProgressInput {
  team: TeamDto;
  sequence: TeamStep[];
  currentStepIndex: number;
  states: ProgressStateInput[];
  /** Вопросы маршрута по ключу аудитории (`toRoomKey`); в аудитории их бывает несколько */
  questionsByRoom: ReadonlyMap<string, ProgressQuestionInput[]>;
  timeAdjustments: TimeAdjustment[];
  /** Открытый вопрос глазами команды; null вне фазы QUESTION */
  question: QuestionViewDto | null;
  /** Текст организаторов про переход в следующий корпус; null вне перехода и без текста */
  transitionHtml: string | null;
  now: Date;
}
