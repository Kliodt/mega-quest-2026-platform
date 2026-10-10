import { type BlitzStateDto } from '@quest/shared';

/** Минута на весь раунд: на восемь вопросов её заведомо мало */
export const BLITZ_ROUND_SECONDS = 60;

/** Каждая законченная попытка, удачная или нет, отнимает у текстов вопроса столько непрозрачности */
const FADE_PER_ATTEMPT = 0.1;
/** Совсем вопросы не исчезают: на этом тексты и останавливаются */
const MIN_TEXT_OPACITY = 0.05;

export enum BlitzPhase {
  /** Раунд ещё не начинали */
  INTRO = 'intro',
  RUNNING = 'running',
  /** Две минуты вышли раньше, чем закончились вопросы */
  TIMEOUT = 'timeout',
  RESULT = 'result',
}

/** Ход раунда живёт только на экране команды: сервер помнит лишь число попыток. */
export interface BlitzRound {
  startedAt: number;
  /** Выбранные варианты по порядку вопросов; длина — сколько вопросов пройдено */
  chosen: number[];
}

/** Сколько попыток команда уже закончила; чужую форму состояния считаем за «ни одной». */
export function readAttempts(state: unknown): number {
  if (typeof state !== 'object' || state === null) {
    return 0;
  }
  const attempts = (state as Partial<BlitzStateDto>).attempts;
  if (typeof attempts !== 'number' || attempts < 0) {
    return 0;
  }
  return Math.floor(attempts);
}

export function getSecondsLeft(startedAt: number, now: number): number {
  const passed = Math.floor((now - startedAt) / 1000);
  return Math.max(0, BLITZ_ROUND_SECONDS - passed);
}

export function getBlitzPhase(
  round: BlitzRound | null,
  quizLength: number,
  secondsLeft: number,
): BlitzPhase {
  if (round === null) {
    return BlitzPhase.INTRO;
  }
  if (round.chosen.length >= quizLength) {
    return BlitzPhase.RESULT;
  }
  if (secondsLeft <= 0) {
    return BlitzPhase.TIMEOUT;
  }
  return BlitzPhase.RUNNING;
}

/** Тексты вопросов выцветают с каждой попыткой: 100%, 90%, 80% и так до 10%. */
export function getTextOpacity(attempts: number): number {
  return Math.max(MIN_TEXT_OPACITY, 1 - attempts * FADE_PER_ATTEMPT);
}

/** Сколько вопросов угадано: счёт команда видит только в конце раунда. */
export function countCorrect(chosen: number[], correctOptions: number[]): number {
  return chosen.filter((option, index) => option === correctOptions[index]).length;
}

/** Числа из зерна: порядок вариантов должен быть одинаковым при каждом показе вопроса */
function toRandom(seed: number): () => number {
  let state = seed + 0x6d2b79f5;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Порядок вариантов для вопроса: возвращает исходные номера в том порядке, в каком их
 * показать. Зерно — число попыток и номер вопроса, поэтому внутри раунда порядок не
 * скачет, а следующая попытка перемешивает заново. Выбор команда отдаёт исходным номером,
 * так что верный вариант не путается.
 */
export function getOptionOrder(count: number, attempts: number, questionIndex: number): number[] {
  const pool = Array.from({ length: count }, (_, index) => index);
  const random = toRandom(attempts * 1000 + questionIndex);
  const order: number[] = [];
  while (pool.length > 0) {
    const [picked] = pool.splice(Math.floor(random() * pool.length), 1);
    if (picked !== undefined) {
      order.push(picked);
    }
  }
  return order;
}
