import { type ApiErrorGroup } from './types.js';

export const CellErrors = {
  taken: {
    code: 'cell__taken',
    message: 'У этой клетки уже есть код',
  },
  questionNotFound: {
    code: 'cell__question_not_found',
    message: 'В этой аудитории нет вопроса',
  },
} as const satisfies ApiErrorGroup;
