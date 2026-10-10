import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { deleteCell } from '../src/services/admin/deleteCell.js';
import { getAdminCells } from '../src/services/admin/getAdminCells.js';
import { saveCell } from '../src/services/admin/saveCell.js';
import {
  CellQuestionNotFoundError,
  CellTakenError,
  UnknownCellCodeError,
} from '../src/utils/errors/index.js';
import {
  clearTestDb,
  ensureIndexes,
  loadQuestion,
  QUESTION_A,
  QUESTION_B,
  startTestDb,
  stopTestDb,
} from './helpers/testDb.js';

const FIRST = { code: 'cell0001', row: 0, col: 0 };
const SECOND = { code: 'cell0002', row: 1, col: 3 };

describe('коды клеток в админке', () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);

  beforeEach(async () => {
    await ensureIndexes();
    await loadQuestion(QUESTION_A, {
      prompt: 'Поле',
      acceptedAnswers: ['1'],
      wrongAttemptPenaltySeconds: 0,
      hintPenalties: [],
      cells: [FIRST, SECOND],
    });
    await loadQuestion(QUESTION_B, {
      prompt: 'Без клеток',
      acceptedAnswers: ['Au'],
      wrongAttemptPenaltySeconds: 0,
      hintPenalties: [],
    });
  });

  afterEach(clearTestDb);

  it('отдаёт клетки с аудиторией их вопроса', async () => {
    const { cells } = await getAdminCells();

    expect(cells).toEqual([
      { ...FIRST, location: QUESTION_A.location, roomNumber: QUESTION_A.roomNumber },
      { ...SECOND, location: QUESTION_A.location, roomNumber: QUESTION_A.roomNumber },
    ]);
  });

  it('заводит новый код клетки', async () => {
    const { cells } = await saveCell({
      code: 'cell0003',
      location: QUESTION_A.location,
      roomNumber: QUESTION_A.roomNumber,
      row: 2,
      col: 5,
    });

    expect(cells).toHaveLength(3);
    expect(cells).toContainEqual({
      code: 'cell0003',
      location: QUESTION_A.location,
      roomNumber: QUESTION_A.roomNumber,
      row: 2,
      col: 5,
    });
  });

  it('переносит код на другую клетку, не оставляя его на старой', async () => {
    const { cells } = await saveCell({
      code: FIRST.code,
      location: QUESTION_A.location,
      roomNumber: QUESTION_A.roomNumber,
      row: 4,
      col: 4,
    });

    expect(cells.filter((cell) => cell.code === FIRST.code)).toEqual([
      {
        code: FIRST.code,
        location: QUESTION_A.location,
        roomNumber: QUESTION_A.roomNumber,
        row: 4,
        col: 4,
      },
    ]);
  });

  /** Иначе на одной клетке оказалось бы два кода и было бы неясно, какой сканировать */
  it('не вешает второй код на занятую клетку', async () => {
    await expect(
      saveCell({
        code: 'cell0009',
        location: QUESTION_A.location,
        roomNumber: QUESTION_A.roomNumber,
        row: SECOND.row,
        col: SECOND.col,
      }),
    ).rejects.toBeInstanceOf(CellTakenError);
  });

  it('не заводит код в аудитории без вопроса', async () => {
    await expect(
      saveCell({
        code: 'cell0009',
        location: QUESTION_A.location,
        roomNumber: '999',
        row: 0,
        col: 1,
      }),
    ).rejects.toBeInstanceOf(CellQuestionNotFoundError);
  });

  it('убирает код с клетки', async () => {
    const { cells } = await deleteCell(FIRST.code);

    expect(cells.map((cell) => cell.code)).toEqual([SECOND.code]);
  });

  it('о незнакомом коде говорит прямо', async () => {
    await expect(deleteCell('cell9999')).rejects.toBeInstanceOf(UnknownCellCodeError);
  });
});
