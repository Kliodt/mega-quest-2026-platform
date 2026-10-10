import { describe, expect, it } from 'vitest';
import { normalizeAnswer } from '../src/utils/question/normalizeAnswer.js';

describe('normalizeAnswer', () => {
  it('lowercases', () => {
    expect(normalizeAnswer('ЛоМоНоСоВ')).toBe('ломоносов');
  });

  it('trims and collapses whitespace', () => {
    expect(normalizeAnswer('  два   слова \n тут ')).toBe('два слова тут');
  });

  it('keeps ё and punctuation untouched', () => {
    expect(normalizeAnswer('Ёж, ёж!')).toBe('ёж, ёж!');
  });
});
