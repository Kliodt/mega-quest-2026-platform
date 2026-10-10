import { describe, expect, it } from 'vitest';
import { toWrongAnswerMessage } from './format.js';

describe('toWrongAnswerMessage', () => {
  /** У большинства заданий неверная попытка ничего не стоит */
  it('без штрафа говорит только о неверном ответе', () => {
    expect(toWrongAnswerMessage('Неверный ответ', 0)).toBe('Неверный ответ');
  });

  it('со штрафом приписывает, сколько прибавилось ко времени', () => {
    expect(toWrongAnswerMessage('Мина', 600)).toBe('Мина, +10 мин к времени');
    expect(toWrongAnswerMessage('Неверный ответ', 30)).toBe('Неверный ответ, +30 с к времени');
  });
});
