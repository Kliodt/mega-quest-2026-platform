import { QuestPhase } from '@quest/shared';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { QuestionStateModel } from '../src/models/QuestionState.js';
import { type TeamDocument } from '../src/models/Team.js';
import { getQuestion } from '../src/services/openQuestion/getQuestion.js';
import { getQuestionState } from '../src/services/openQuestion/getQuestionState.js';
import { setQuestionState } from '../src/services/openQuestion/setQuestionState.js';
import { submitAnswer } from '../src/services/openQuestion/submitAnswer.js';
import { takeHint } from '../src/services/openQuestion/takeHint.js';
import { enterCode } from '../src/services/quest/enterCode.js';
import { getProgress } from '../src/services/quest/getProgress.js';
import {
  HintOrderViolationError,
  HintsExhaustedError,
  NoOpenQuestionError,
} from '../src/utils/errors/index.js';
import {
  clearTestDb,
  ensureIndexes,
  loadBindings,
  loadQuestion,
  QUESTION_A,
  QUESTION_B,
  loadTeam,
  LT,
  Q,
  readTeam,
  RT,
  startTestDb,
  stopTestDb,
} from './helpers/testDb.js';

const silentLog = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
} as unknown as Parameters<typeof enterCode>[2];

async function expectApiError(
  action: Promise<unknown>,
  errorClass: new (...args: never[]) => Error,
): Promise<void> {
  await expect(action).rejects.toBeInstanceOf(errorClass);
}

describe('open question flow with a basicGame type', () => {
  let team: TeamDocument;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await ensureIndexes();
    await loadBindings();
    await loadQuestion(QUESTION_A, {
      prompt: 'Столица России?',
      acceptedAnswers: ['Москва'],
      wrongAttemptPenaltySeconds: 30,
      hintPenalties: [10, 20, 40],
    });
    await loadQuestion(QUESTION_B, {
      prompt: 'Химический символ золота?',
      acceptedAnswers: ['Au'],
      wrongAttemptPenaltySeconds: 15,
      hintPenalties: [5, 5, 5],
    });
    team = await loadTeam([LT, Q(QUESTION_A), RT, Q(QUESTION_B)]);
    await enterCode(team, QUESTION_A.code, silentLog);
    team = await readTeam(team);
  });

  afterEach(async () => {
    await clearTestDb();
  });

  describe('getQuestion', () => {
    it('returns the game content with hidden hints and zero attempts', async () => {
      const question = await getQuestion(team);

      expect(question.gameType).toBe(QUESTION_A.gameType);
      expect(question.roomNumber).toBe(QUESTION_A.roomNumber);
      expect(question.content).toEqual({ html: 'Столица России?' });
      expect(question.hints.map((hint) => hint.html)).toEqual([null, null, null]);
      expect(question.nextHintIndex).toBe(0);
      expect(question.attemptsCount).toBe(0);
      expect(question.wrongAttemptPenaltySeconds).toBe(30);
      expect(question.state).toBeNull();
    });

    it('never exposes the accepted answers', async () => {
      const question = await getQuestion(team);
      expect(JSON.stringify(question)).not.toContain('Москва');
    });

    it('is the same object that progress carries', async () => {
      const progress = await getProgress(team);
      expect(progress.question).toEqual(await getQuestion(team));
    });
  });

  describe('submitAnswer', () => {
    it('records a wrong attempt with its penalty and keeps the step open', async () => {
      const result = await submitAnswer(team, { text: 'Питер' });

      expect(result.correct).toBe(false);
      expect(result.penaltySecondsAdded).toBe(30);
      expect(result.progress.question?.wrongAttemptsCount).toBe(1);
      expect(result.progress.question?.stepTimeAdjustmentSeconds).toBe(30);
      expect(result.progress.phase).toBe(QuestPhase.QUESTION);
      expect(result.progress.timer.timeAdjustmentSeconds).toBe(30);
      expect((await readTeam(team)).currentStepIndex).toBe(1);
    });

    it('treats an answer of the wrong shape as a wrong answer, not an error', async () => {
      const result = await submitAnswer(team, { something: 42 });
      expect(result.correct).toBe(false);
      expect(result.penaltySecondsAdded).toBe(30);
    });

    it('accepts an answer ignoring case and extra whitespace', async () => {
      const result = await submitAnswer(team, { text: '  МОСКВА  ' });

      expect(result.correct).toBe(true);
      expect(result.penaltySecondsAdded).toBe(0);
      expect(result.progress.question).toBeNull();
      expect(result.progress.phase).toBe(QuestPhase.ROOM_TRANSITION);
      expect(result.progress.solvedCount).toBe(1);
      expect((await readTeam(team)).currentStepIndex).toBe(2);
    });

    it('advances the step only once under a concurrent double correct answer', async () => {
      const [first, second] = await Promise.allSettled([
        submitAnswer(team, { text: 'Москва' }),
        submitAnswer(await readTeam(team), { text: 'Москва' }),
      ]);

      expect([first.status, second.status]).not.toContain('rejected');
      expect((await readTeam(team)).currentStepIndex).toBe(2);

      const state = await QuestionStateModel.findOne({ teamId: team._id, stepIndex: 1 });
      expect(state?.attempts.filter((attempt) => attempt.correct)).toHaveLength(1);
    });

    // Кто из двоих закрыл вопрос — недетерминировано, поэтому шаг закрыт в обоих ответах
    it('reports the closed step to both of the concurrent answers', async () => {
      const results = await Promise.all([
        submitAnswer(team, { text: 'Москва' }),
        submitAnswer(await readTeam(team), { text: 'Москва' }),
      ]);

      results.forEach((result) => {
        expect(result.correct).toBe(true);
        expect(result.progress.question).toBeNull();
        expect(result.progress.phase).toBe(QuestPhase.ROOM_TRANSITION);
        expect(result.progress.solvedCount).toBe(1);
      });
    });

    it('rejects an answer while the team is on a transition step', async () => {
      await submitAnswer(team, { text: 'Москва' });
      await expectApiError(
        submitAnswer(await readTeam(team), { text: 'Москва' }),
        NoOpenQuestionError,
      );
    });
  });

  describe('takeHint', () => {
    it('reveals hints strictly in order and charges each penalty', async () => {
      const first = await takeHint(team, 0);
      expect(first.question?.hints[0]?.taken).toBe(true);
      expect(first.question?.hints[0]?.html).not.toBeNull();
      expect(first.question?.hints[1]?.html).toBeNull();
      expect(first.question?.nextHintIndex).toBe(1);
      expect(first.timer.timeAdjustmentSeconds).toBe(10);

      const second = await takeHint(team, 1);
      expect(second.timer.timeAdjustmentSeconds).toBe(30);
      expect(second.question?.nextHintIndex).toBe(2);
    });

    it('rejects taking a hint out of order', async () => {
      await expectApiError(takeHint(team, 2), HintOrderViolationError);
      expect((await getProgress(team)).timer.timeAdjustmentSeconds).toBe(0);
    });

    it('is idempotent when the same hint is taken twice', async () => {
      await takeHint(team, 0);
      const again = await takeHint(await readTeam(team), 0);

      expect(again.timer.timeAdjustmentSeconds).toBe(10);
      const state = await QuestionStateModel.findOne({ teamId: team._id, stepIndex: 1 });
      expect(state?.hintsTaken).toHaveLength(1);
    });

    it('charges a hint only once under a concurrent double take', async () => {
      const results = await Promise.all([takeHint(team, 0), takeHint(await readTeam(team), 0)]);

      const state = await QuestionStateModel.findOne({ teamId: team._id, stepIndex: 1 });
      expect(state?.hintsTaken).toHaveLength(1);
      expect((await getProgress(await readTeam(team))).timer.timeAdjustmentSeconds).toBe(10);
      // Штраф записан один раз, но виден обоим ответам
      results.forEach((result) => expect(result.timer.timeAdjustmentSeconds).toBe(10));
    });

    it('rejects a fourth hint', async () => {
      await takeHint(team, 0);
      await takeHint(team, 1);
      await takeHint(team, 2);
      await expectApiError(takeHint(team, 3), HintsExhaustedError);
    });

    it('rejects a hint while the team is on a transition step', async () => {
      await submitAnswer(team, { text: 'Москва' });
      await expectApiError(takeHint(await readTeam(team), 0), NoOpenQuestionError);
    });
  });

  describe('question state', () => {
    it('stores any JSON as is and returns it with the question', async () => {
      expect((await getQuestionState(team)).state).toBeNull();

      const saved = await setQuestionState(team, { draft: 'Мос', tries: [1, 2] });

      expect(saved.state).toEqual({ draft: 'Мос', tries: [1, 2] });
      expect((await getQuestionState(team)).state).toEqual({ draft: 'Мос', tries: [1, 2] });
      expect((await getQuestion(team)).state).toEqual({ draft: 'Мос', tries: [1, 2] });
    });

    it('replaces the previous state entirely', async () => {
      await setQuestionState(team, { draft: 'Мос' });
      await setQuestionState(team, { draft: 'Москв' });
      expect((await getQuestionState(team)).state).toEqual({ draft: 'Москв' });
    });

    it('belongs to the open question only', async () => {
      await setQuestionState(team, { draft: 'Мос' });
      await submitAnswer(team, { text: 'Москва' });

      await expectApiError(getQuestionState(await readTeam(team)), NoOpenQuestionError);
      await expectApiError(setQuestionState(await readTeam(team), {}), NoOpenQuestionError);

      await enterCode(await readTeam(team), QUESTION_B.code, silentLog);
      expect((await getQuestionState(await readTeam(team))).state).toBeNull();
    });
  });
});
