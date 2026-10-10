import { describe, expect, it } from 'vitest';
import { toStickersAnswer } from './toStickersAnswer.js';

describe('toStickersAnswer', () => {
  it('убирает пробелы между стикерами и по краям', () => {
    expect(toStickersAnswer({ text: '  🏆 6️⃣ 👑\n😊 ' })).toEqual({ text: '🏆6️⃣👑😊' });
  });

  it('ответ без пробелов не трогает', () => {
    expect(toStickersAnswer({ text: '🏆6️⃣👑' })).toEqual({ text: '🏆6️⃣👑' });
  });

  it('переживает ответ неожиданной формы', () => {
    expect(toStickersAnswer(null)).toEqual({ text: '' });
    expect(toStickersAnswer({})).toEqual({ text: '' });
  });
});
