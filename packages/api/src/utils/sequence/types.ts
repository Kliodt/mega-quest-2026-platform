import { type Location } from '@quest/shared';

/** Что валидатор маршрута знает о вопросе: маршрут ссылается на вопросы по аудитории. */
export interface SequenceQuestion {
  location: Location;
  roomNumber: string;
  /** Заранее известные ответы-аудитории: каждый обязан быть аудиторией следующего шага */
  nextRoomAnswers: string[];
  /** Ответ подставляет ядро: после такого вопроса нужен ровно один вопрос */
  hasDynamicAnswer: boolean;
  /** Команды (их `slug`), которым предназначен вариант; пусто — вариант общий */
  teamSlugs: string[];
}

/** Вопросы по ключу аудитории (`toRoomKey`); в аудитории их бывает несколько. */
export type SequenceQuestionLookup = ReadonlyMap<string, SequenceQuestion[]>;

export interface SequenceValidationResult {
  ok: boolean;
  errors: string[];
}
