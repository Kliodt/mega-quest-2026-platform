import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { QuestionStateModel } from '../src/models/QuestionState.js';
import { type TeamDocument } from '../src/models/Team.js';
import { getQuestionState } from '../src/services/openQuestion/getQuestionState.js';
import { setQuestionState } from '../src/services/openQuestion/setQuestionState.js';
import { waitForQuestionState } from '../src/services/openQuestion/waitForQuestionState.js';
import { enterCode } from '../src/services/quest/enterCode.js';
import { readTeam } from '../src/services/quest/readTeam.js';
import {
  clearTestDb,
  loadBindings,
  loadQuestion,
  loadTeam,
  LT,
  Q,
  QUESTION_A,
  startTestDb,
  stopTestDb,
} from './helpers/testDb.js';

const silentLog = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
} as unknown as Parameters<typeof enterCode>[2];

describe('состояние открытого вопроса', () => {
  let team: TeamDocument;

  beforeAll(startTestDb);
  afterAll(stopTestDb);

  beforeEach(async () => {
    await loadBindings();
    await loadQuestion(QUESTION_A, {
      prompt: 'Столица России?',
      acceptedAnswers: ['Москва'],
      wrongAttemptPenaltySeconds: 30,
      hintPenalties: [],
    });
    team = await loadTeam([LT, Q(QUESTION_A)]);
    await enterCode(team, QUESTION_A.code, silentLog);
    team = await readTeam(team);
  });

  afterEach(clearTestDb);

  it('отдаёт метку последнего изменения вместе с состоянием', async () => {
    const before = await getQuestionState(team);
    const saved = await setQuestionState(team, { opened: [1, 2] });

    expect(saved.state).toEqual({ opened: [1, 2] });
    expect(new Date(saved.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(before.updatedAt).getTime(),
    );
  });

  /** Ради этого долгий запрос и нужен: ответ засчитывает внешний механизм */
  // Запрос ждёт изменения, перечитывая состояние раз в секунду: пяти секунд по умолчанию мало
  it(
    'долгий запрос возвращается, когда состояние меняет кто-то другой',
    { timeout: 15_000 },
    async () => {
      const { updatedAt } = await getQuestionState(team);

      const waiting = waitForQuestionState(team, updatedAt);
      await new Promise((resolve) => setTimeout(resolve, 50));
      const written = await QuestionStateModel.updateOne(
        { teamId: team._id },
        { $set: { state: { done: true } } },
      );
      expect(written.modifiedCount).toBe(1);

      const next = await waiting;
      expect(next.state).toEqual({ done: true });
      expect(next.updatedAt).not.toBe(updatedAt);
    },
  );

  it('без метки отдаёт состояние сразу', async () => {
    const state = await getQuestionState(team);

    expect(state.state).toBeNull();
  });
});
