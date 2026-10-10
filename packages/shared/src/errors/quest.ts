import { type ApiErrorGroup } from './types.js';

export const QuestErrors = {
  wrongCode: {
    code: 'quest__wrong_code',
    message: 'Код не подходит к вашему следующему вопросу',
  },
  questionAlreadyOpen: {
    code: 'quest__question_already_open',
    message: 'Сначала ответьте на открытый вопрос',
  },
  noOpenQuestion: {
    code: 'quest__no_open_question',
    message: 'Сейчас нет открытого вопроса',
  },
  finished: {
    code: 'quest__finished',
    message: 'Квест уже завершён',
  },
  hintOrderViolation: {
    code: 'quest__hint_order_violation',
    message: 'Подсказки берутся по порядку',
  },
  hintsExhausted: {
    code: 'quest__hints_exhausted',
    message: 'Все подсказки уже взяты',
  },
  dynamicAnswerMissing: {
    code: 'quest__dynamic_answer_missing',
    message: 'Ответ на вопрос не настроен, обратитесь к организатору',
  },
  hintMissing: {
    code: 'quest__hint_missing',
    message: 'Подсказка недоступна, обратитесь к организатору',
  },
  unknownExternalCode: {
    code: 'quest__unknown_external_code',
    message: 'Такого внешнего механизма нет ни у одного вопроса',
  },
  unknownCellCode: {
    code: 'quest__unknown_cell_code',
    message: 'Этот код не от клетки поля',
  },
  noWaitingTeam: {
    code: 'quest__no_waiting_team',
    message: 'В этой аудитории сейчас никто не отвечает',
  },
} as const satisfies ApiErrorGroup;
