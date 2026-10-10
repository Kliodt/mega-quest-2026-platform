import { describe, expect, it } from 'vitest';
import {
  BlitzPhase,
  BLITZ_ROUND_SECONDS,
  countCorrect,
  getBlitzPhase,
  getOptionOrder,
  getSecondsLeft,
  getTextOpacity,
  readAttempts,
} from './blitzRound.js';

const START = 1_700_000_000_000;

describe('состояние на сервере', () => {
  it('читает число законченных попыток', () => {
    expect(readAttempts({ attempts: 3 })).toBe(3);
  });

  it('чужую форму и мусор считает за «попыток не было»', () => {
    expect(readAttempts(null)).toBe(0);
    expect(readAttempts({ draft: 'что-то от другой игры' })).toBe(0);
    expect(readAttempts({ attempts: -2 })).toBe(0);
  });
});

describe('время раунда', () => {
  it('отсчитывает раунд от начала попытки', () => {
    expect(getSecondsLeft(START, START)).toBe(BLITZ_ROUND_SECONDS);
    expect(getSecondsLeft(START, START + 30_000)).toBe(BLITZ_ROUND_SECONDS - 30);
  });

  it('не уходит в минус', () => {
    expect(getSecondsLeft(START, START + 500_000)).toBe(0);
  });
});

describe('фаза раунда', () => {
  const round = { startedAt: START, chosen: [0, 1] };

  it('без раунда предлагает начать', () => {
    expect(getBlitzPhase(null, 8, BLITZ_ROUND_SECONDS)).toBe(BlitzPhase.INTRO);
  });

  it('идёт, пока есть время и остались вопросы', () => {
    expect(getBlitzPhase(round, 8, 40)).toBe(BlitzPhase.RUNNING);
  });

  it('не засчитывает раунд, если время вышло раньше вопросов', () => {
    expect(getBlitzPhase(round, 8, 0)).toBe(BlitzPhase.TIMEOUT);
  });

  it('показывает результат, когда отвечено на все вопросы', () => {
    const finished = { ...round, chosen: [0, 1, 2, 3, 0, 1, 2, 3] };
    expect(getBlitzPhase(finished, 8, 0)).toBe(BlitzPhase.RESULT);
  });
});

describe('выцветание вопросов', () => {
  it('на первой попытке тексты видны полностью', () => {
    expect(getTextOpacity(0)).toBe(1);
  });

  it('каждая законченная попытка отнимает 10%', () => {
    expect(getTextOpacity(1)).toBeCloseTo(0.9);
    expect(getTextOpacity(4)).toBeCloseTo(0.6);
  });

  it('на девятой попытке доходит до десяти процентов', () => {
    expect(getTextOpacity(9)).toBeCloseTo(0.1);
  });

  it('дальше пяти процентов не выцветает', () => {
    expect(getTextOpacity(10)).toBeCloseTo(0.05);
    expect(getTextOpacity(40)).toBeCloseTo(0.05);
  });
});

describe('порядок вариантов', () => {
  it('перемешивает, не теряя и не дублируя варианты', () => {
    const order = getOptionOrder(4, 0, 0);
    expect([...order].sort()).toEqual([0, 1, 2, 3]);
  });

  it('внутри раунда не меняется: число попыток то же', () => {
    expect(getOptionOrder(4, 3, 5)).toEqual(getOptionOrder(4, 3, 5));
  });

  it('после новой попытки идёт иначе', () => {
    const attempts = [0, 1, 2, 3].map((count) => getOptionOrder(4, count, 0).join(''));
    expect(new Set(attempts).size).toBeGreaterThan(1);
  });

  it('вопросы одного раунда перемешаны по-разному', () => {
    const questions = [0, 1, 2, 3].map((index) => getOptionOrder(4, 1, index).join(''));
    expect(new Set(questions).size).toBeGreaterThan(1);
  });
});

describe('счёт', () => {
  it('считает только совпавшие ответы', () => {
    expect(countCorrect([0, 1, 2], [0, 2, 2])).toBe(2);
  });

  it('незаконченный раунд считает по данным ответам', () => {
    expect(countCorrect([0], [0, 1, 2])).toBe(1);
  });
});
