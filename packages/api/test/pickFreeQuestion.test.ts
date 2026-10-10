import { describe, expect, it } from 'vitest';
import { pickFreeQuestion } from '../src/utils/question/pickFreeQuestion.js';
import { type QuestionUsage } from '../src/utils/question/types.js';

const t = (seconds: number): Date => new Date(1_700_000_000_000 + seconds * 1000);

const A = { id: 'a' };
const B = { id: 'b' };
const C = { id: 'c' };

function free(id: string, usedAt: Date): QuestionUsage {
  return { questionId: id, busy: false, usedAt };
}

function busy(id: string, usedAt: Date): QuestionUsage {
  return { questionId: id, busy: true, usedAt };
}

describe('pickFreeQuestion', () => {
  it('takes the only question of the room', () => {
    expect(pickFreeQuestion([A], [])).toBe(A);
  });

  it('prefers a question nobody has opened yet', () => {
    expect(pickFreeQuestion([A, B], [free('a', t(0))])).toBe(B);
  });

  it('takes the one that has been free for longest', () => {
    const usage = [free('a', t(100)), free('b', t(50)), free('c', t(200))];
    expect(pickFreeQuestion([A, B, C], usage)).toBe(B);
  });

  it('leaves a question that a team is still answering for last', () => {
    const usage = [busy('a', t(0)), free('b', t(500))];
    expect(pickFreeQuestion([A, B], usage)).toBe(B);
  });

  it('falls back to the longest busy question when every one is taken', () => {
    const usage = [busy('a', t(300)), busy('b', t(100))];
    expect(pickFreeQuestion([A, B], usage)).toBe(B);
  });
});
