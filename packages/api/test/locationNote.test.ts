import { Location, StepKind, type TeamStep } from '@quest/shared';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { LocationNoteModel } from '../src/models/LocationNote.js';
import { readLocationNote } from '../src/services/quest/readLocationNote.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/testDb.js';

const TRANSITION: TeamStep = { kind: StepKind.LOCATION_TRANSITION };

function question(location: Location): TeamStep {
  return { kind: StepKind.QUESTION, options: [{ location, roomNumber: '101' }] };
}

/** Ломоносовский, потом Кронверкский: второй переход и есть пара `lomo → cronva` */
const SEQUENCE: TeamStep[] = [
  TRANSITION,
  question(Location.LOMO),
  TRANSITION,
  question(Location.CRONVA),
];

const PAIR = 'Текст про дорогу с Ломоносова на Кронверкский';
const COMMON = 'Текст про дорогу на Кронверкский';

describe('текст перехода между корпусами', () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);
  afterEach(clearTestDb);

  it('предпочитает текст пары корпусов общему', async () => {
    await LocationNoteModel.insertMany([
      { from: Location.LOMO, location: Location.CRONVA, html: PAIR },
      { from: null, location: Location.CRONVA, html: COMMON },
    ]);

    await expect(readLocationNote(SEQUENCE, 2)).resolves.toBe(PAIR);
  });

  it('без текста пары берёт общий текст корпуса', async () => {
    await LocationNoteModel.create({ from: null, location: Location.CRONVA, html: COMMON });

    await expect(readLocationNote(SEQUENCE, 2)).resolves.toBe(COMMON);
  });

  /** Иначе текст про дорогу между вторым и третьим корпусом увидели бы в начале квеста */
  it('на переход в другой корпус текст пары не попадает', async () => {
    await LocationNoteModel.create({
      from: Location.CRONVA,
      location: Location.LOMO,
      html: PAIR,
    });

    await expect(readLocationNote(SEQUENCE, 0)).resolves.toBeNull();
  });

  it('вне перехода между корпусами текста нет', async () => {
    await LocationNoteModel.create({ from: null, location: Location.CRONVA, html: COMMON });

    await expect(readLocationNote(SEQUENCE, 1)).resolves.toBeNull();
  });
});
