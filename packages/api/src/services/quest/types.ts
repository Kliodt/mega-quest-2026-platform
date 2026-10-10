import { type TimeAdjustmentType } from '@quest/shared';
import { type QuestionDocument } from '../../models/Question.js';
import { type QuestionStateDocument } from '../../models/QuestionState.js';
import { type TeamDocument } from '../../models/Team.js';
import { type OpenQuestionContext } from '../../utils/question/types.js';

/** Всё, что нужно прочитать из базы, чтобы описать прохождение команды. Читается один раз. */
export interface QuestContext {
  team: TeamDocument;
  states: QuestionStateDocument[];
  /** Вопросы маршрута по ключу аудитории (`toRoomKey`); в аудитории их бывает несколько */
  questionsByRoom: Map<string, QuestionDocument[]>;
  /** Открытый вопрос; null вне фазы QUESTION */
  open: OpenQuestionContext | null;
}

/** Новая поправка времени; `createdAt` и `_id` назначает запись. */
export interface TimeAdjustmentInput {
  timeAdjustmentSeconds: number;
  type: TimeAdjustmentType;
  comment: string | null;
  stepIndex: number | null;
}
