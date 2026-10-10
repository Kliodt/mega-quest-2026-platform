import { GameType, Location, QuestPhase, StepState, StepKind, TeamStatus } from '@quest/shared';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MOCK_CODE } from '../src/config/env.js';
import { BindingModel } from '../src/models/Binding.js';
import { QuestionModel } from '../src/models/Question.js';
import { QuestionStateModel } from '../src/models/QuestionState.js';
import { type TeamDocument } from '../src/models/Team.js';
import { readRoomNumber } from '../src/services/binding/readRoomNumber.js';
import { getQuestion } from '../src/services/openQuestion/getQuestion.js';
import { submitAnswer } from '../src/services/openQuestion/submitAnswer.js';
import { takeHint } from '../src/services/openQuestion/takeHint.js';
import { enterCode } from '../src/services/quest/enterCode.js';
import { getProgress } from '../src/services/quest/getProgress.js';
import {
  QuestFinishedError,
  QuestionAlreadyOpenError,
  WrongCodeError,
} from '../src/utils/errors/index.js';
import {
  clearTestDb,
  ensureIndexes,
  LT,
  Q,
  readTeam,
  QUESTION_A,
  QUESTION_B,
  RT,
  loadQuestion,
  loadBindings,
  loadTeam,
  roomFilter,
  startTestDb,
  stopTestDb,
  toRoom,
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

describe('quest core', () => {
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
      prompt: 'Символ золота?',
      acceptedAnswers: ['Au'],
      shouldSendAnswer: true,
      wrongAttemptPenaltySeconds: 45,
      hintPenalties: [15, 30, 60],
    });
    team = await loadTeam([LT, Q(QUESTION_A), RT, Q(QUESTION_B)]);
  });

  afterEach(async () => {
    await clearTestDb();
  });

  describe('enterCode', () => {
    it('opens the question and advances the step', async () => {
      const progress = await enterCode(team, QUESTION_A.code, silentLog);

      expect(progress.phase).toBe(QuestPhase.QUESTION);
      expect(progress.currentStepIndex).toBe(1);
      expect(progress.question).toMatchObject({
        stepIndex: 1,
        roomNumber: QUESTION_A.roomNumber,
        gameType: QUESTION_A.gameType,
        content: { html: 'Столица России?' },
      });
    });

    it('never exposes the correct answer', async () => {
      const progress = await enterCode(team, QUESTION_A.code, silentLog);
      expect(JSON.stringify(progress)).not.toContain('Москва');
    });

    /** Аудитории нерешённых шагов команде не видны: ответом бывает номер следующей. */
    it('never exposes the rooms of unsolved steps', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      const progress = await getProgress(await readTeam(team));

      // Метку времени не смотрим: её миллисекунды случайно совпадают с номером аудитории
      const shown = { steps: progress.steps, nextRoomNumbers: progress.nextRoomNumbers };
      expect(JSON.stringify(shown)).not.toContain(QUESTION_B.roomNumber);
    });

    it('trims surrounding whitespace but keeps the code case-sensitive', async () => {
      const progress = await enterCode(team, `  ${QUESTION_A.code}  `, silentLog);
      expect(progress.phase).toBe(QuestPhase.QUESTION);

      const second = await loadTeam([LT, Q(QUESTION_A)], 'Вторая');
      await expectApiError(
        enterCode(second, QUESTION_A.code.toUpperCase(), silentLog),
        WrongCodeError,
      );
    });

    it('rejects a code that does not belong to the next step', async () => {
      await expectApiError(enterCode(team, QUESTION_B.code, silentLog), WrongCodeError);
      await expectApiError(enterCode(team, 'nosuch01', silentLog), WrongCodeError);
      expect((await readTeam(team)).currentStepIndex).toBe(0);
    });

    it('is idempotent for the code of the already open question', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      const opened = await readTeam(team);

      const progress = await enterCode(opened, QUESTION_A.code, silentLog);

      expect(progress.currentStepIndex).toBe(1);
      expect(await QuestionStateModel.countDocuments({ teamId: team._id })).toBe(1);
    });

    it('rejects another room code while a question is open', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      const opened = await readTeam(team);
      await expectApiError(enterCode(opened, QUESTION_B.code, silentLog), QuestionAlreadyOpenError);
    });

    it('creates a single question state under a concurrent double submit', async () => {
      const [first, second] = await Promise.allSettled([
        enterCode(team, QUESTION_A.code, silentLog),
        enterCode(await readTeam(team), QUESTION_A.code, silentLog),
      ]);

      expect([first.status, second.status]).not.toContain('rejected');
      expect(await QuestionStateModel.countDocuments({ teamId: team._id })).toBe(1);
      expect((await readTeam(team)).currentStepIndex).toBe(1);
    });

    /** Шаг может предлагать несколько вопросов; какой открыть, решает отсканированная аудитория. */
    it('opens the question of the scanned room when the step offers several', async () => {
      const choosing = await loadTeam([LT, Q(QUESTION_A, QUESTION_B)], 'Выбор');

      const progress = await enterCode(choosing, QUESTION_B.code, silentLog);

      expect(progress.question?.roomNumber).toBe(QUESTION_B.roomNumber);
      const state = await QuestionStateModel.findOne({ teamId: choosing._id });
      expect(state?.room.roomNumber).toBe(QUESTION_B.roomNumber);
    });

    it('refuses to open anything once the quest is finished', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'Москва' });
      await enterCode(await readTeam(team), QUESTION_B.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'Au' });

      await expectApiError(
        enterCode(await readTeam(team), QUESTION_A.code, silentLog),
        QuestFinishedError,
      );
    });
  });

  /** В состоянии шага лежит снимок вопроса: именно его видит команда до конца шага. */
  describe('question snapshot of an open question', () => {
    it('copies the question with its answers', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);

      const state = await QuestionStateModel.findOne({ teamId: team._id });
      expect(state?.questionSnapshot.html).toBe('Столица России?');
      expect(state?.questionSnapshot.acceptedAnswers.map((answer) => answer.html)).toEqual([
        'Москва',
      ]);
    });

    it('keeps the open question unchanged when the question itself is edited', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await QuestionModel.updateOne(roomFilter(QUESTION_A), { $set: { html: 'Другой текст' } });

      const question = await getQuestion(await readTeam(team));
      expect(question.content).toEqual({ html: 'Столица России?' });
    });

    it('computes the room of the next question when the answer is dynamic', async () => {
      await QuestionModel.deleteMany(roomFilter(QUESTION_A));
      await loadQuestion(QUESTION_A, {
        prompt: 'Куда идти дальше?',
        acceptedAnswers: [],
        hasDynamicAnswer: true,
        wrongAttemptPenaltySeconds: 30,
        hintPenalties: [],
      });

      const progress = await enterCode(team, QUESTION_A.code, silentLog);
      expect(progress.phase).toBe(QuestPhase.QUESTION);

      const state = await QuestionStateModel.findOne({ teamId: team._id });
      expect(state?.questionSnapshot.acceptedAnswers.map((answer) => answer.html)).toEqual([
        QUESTION_B.roomNumber,
      ]);

      const result = await submitAnswer(await readTeam(team), { text: QUESTION_B.roomNumber });
      expect(result.correct).toBe(true);
    });

    it('rejects anything but the next room for a dynamic answer', async () => {
      await QuestionModel.deleteMany(roomFilter(QUESTION_A));
      await loadQuestion(QUESTION_A, {
        prompt: 'Куда идти дальше?',
        acceptedAnswers: [],
        hasDynamicAnswer: true,
        wrongAttemptPenaltySeconds: 30,
        hintPenalties: [],
      });
      await enterCode(team, QUESTION_A.code, silentLog);

      const result = await submitAnswer(await readTeam(team), { text: QUESTION_A.roomNumber });
      expect(result.correct).toBe(false);
      expect(result.penaltySecondsAdded).toBe(30);
    });
  });

  /** Один и тот же вопрос стоит в нескольких аудиториях: ответ всё равно даёт маршрут. */
  describe('a question that stands in several rooms', () => {
    it('opens by the code of the scanned room and remembers it', async () => {
      await QuestionModel.deleteMany(roomFilter(QUESTION_A));
      await QuestionModel.deleteMany(roomFilter(QUESTION_B));
      await loadQuestion(QUESTION_A, {
        prompt: 'Один вопрос на две аудитории',
        acceptedAnswers: ['Москва'],
        wrongAttemptPenaltySeconds: 30,
        hintPenalties: [],
        rooms: [toRoom(QUESTION_A), toRoom(QUESTION_B)],
      });
      const choosing = await loadTeam([LT, Q(QUESTION_A, QUESTION_B)], 'Две аудитории');

      const progress = await enterCode(choosing, QUESTION_B.code, silentLog);

      expect(progress.question?.roomNumber).toBe(QUESTION_B.roomNumber);
      const state = await QuestionStateModel.findOne({ teamId: choosing._id });
      expect(state?.room.roomNumber).toBe(QUESTION_B.roomNumber);
      expect(state?.questionSnapshot.rooms).toHaveLength(2);
    });
  });

  /** В аудитории бывает несколько вопросов: команды расходятся по свободным. */
  describe('several questions in one room', () => {
    const SECOND = { ...QUESTION_A, gameType: GameType.HISTORY };

    beforeEach(async () => {
      await loadQuestion(SECOND, {
        prompt: 'Второй вопрос той же аудитории',
        acceptedAnswers: ['Ответ'],
        wrongAttemptPenaltySeconds: 30,
        hintPenalties: [],
      });
    });

    it('gives the two teams different questions', async () => {
      const second = await loadTeam([LT, Q(QUESTION_A)], 'Вторая');

      const first = await enterCode(team, QUESTION_A.code, silentLog);
      const other = await enterCode(second, QUESTION_A.code, silentLog);

      expect(first.question?.gameType).not.toBe(other.question?.gameType);
    });

    it('gives a freed question to the next team', async () => {
      const second = await loadTeam([LT, Q(QUESTION_A)], 'Вторая');
      const third = await loadTeam([LT, Q(QUESTION_A)], 'Третья');
      await enterCode(team, QUESTION_A.code, silentLog);
      const taken = await enterCode(second, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(second), { text: 'Ответ' });

      const freed = await enterCode(third, QUESTION_A.code, silentLog);

      expect(freed.question?.gameType).toBe(taken.question?.gameType);
    });
  });

  /** Некоторые игры прячут ответ своей механикой, поэтому он уходит вместе с вопросом. */
  describe('shouldSendAnswer', () => {
    it('keeps the answers out of the question by default', async () => {
      const progress = await enterCode(team, QUESTION_A.code, silentLog);
      expect(progress.question?.answers).toEqual([]);
    });

    it('hands the answers to the team when the question asks for it', async () => {
      await QuestionModel.deleteMany(roomFilter(QUESTION_A));
      await loadQuestion(QUESTION_A, {
        prompt: 'Ответ спрятан в самом задании',
        acceptedAnswers: [],
        hasDynamicAnswer: true,
        shouldSendAnswer: true,
        wrongAttemptPenaltySeconds: 0,
        hintPenalties: [],
      });

      const progress = await enterCode(team, QUESTION_A.code, silentLog);

      expect(progress.question?.answers).toEqual([QUESTION_B.roomNumber]);
    });
  });

  /** Корпус закрывает аудитория перехода: её скан отвечает на вопрос и останавливает время. */
  describe('closing a location by the room of the transition', () => {
    const EXIT = { location: Location.LOMO, roomNumber: 'выход' };
    const NEXT_LOCATION = {
      gameType: GameType.ENCYCLOPEDIA,
      roomNumber: '1312',
      location: Location.CRONVA,
      code: 'cron1111',
    };

    beforeEach(async () => {
      await QuestionModel.deleteMany(roomFilter(QUESTION_A));
      await loadQuestion(QUESTION_A, {
        prompt: 'Куда идти дальше?',
        acceptedAnswers: [],
        hasDynamicAnswer: true,
        wrongAttemptPenaltySeconds: 30,
        hintPenalties: [],
      });
      await loadQuestion(NEXT_LOCATION, {
        prompt: 'Символ золота?',
        acceptedAnswers: ['Au'],
        wrongAttemptPenaltySeconds: 45,
        hintPenalties: [],
      });
      await BindingModel.insertMany([
        { ...EXIT, code: 'exit1111' },
        { ...toRoom(NEXT_LOCATION), code: NEXT_LOCATION.code },
      ]);
      team = await loadTeam(
        [
          LT,
          Q(QUESTION_A),
          { kind: StepKind.LOCATION_TRANSITION, options: [EXIT] },
          Q(NEXT_LOCATION),
        ],
        'Меняет корпус',
      );
    });

    /** Маршрут из одного вопроса, за которым сразу финишная аудитория. */
    async function loadFinishingTeam(): Promise<TeamDocument> {
      return loadTeam(
        [LT, Q(QUESTION_A), { kind: StepKind.LOCATION_TRANSITION, options: [EXIT] }],
        'Финиширует',
      );
    }

    it('answers the question by the exit room and stops the clock', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);

      const state = await QuestionStateModel.findOne({ teamId: team._id });
      expect(state?.questionSnapshot.acceptedAnswers.map((answer) => answer.html)).toEqual([
        EXIT.roomNumber,
      ]);

      const result = await submitAnswer(await readTeam(team), { text: EXIT.roomNumber });
      expect(result.correct).toBe(true);
      expect(result.progress.phase).toBe(QuestPhase.LOCATION_TRANSITION);
      expect(result.progress.timer.running).toBe(false);
    });

    it('opens the next location with its own code and starts the clock again', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(team), { text: EXIT.roomNumber });

      const progress = await enterCode(await readTeam(team), NEXT_LOCATION.code, silentLog);

      expect(progress.phase).toBe(QuestPhase.QUESTION);
      expect(progress.question?.roomNumber).toBe(NEXT_LOCATION.roomNumber);
      expect(progress.timer.running).toBe(true);
    });

    /** Впереди одни переходы: сканировать больше нечего, квест закрывает сам ответ. */
    it('finishes the quest with the last answer', async () => {
      const finishing = await loadFinishingTeam();
      await enterCode(finishing, QUESTION_A.code, silentLog);

      const result = await submitAnswer(await readTeam(finishing), { text: EXIT.roomNumber });

      expect(result.correct).toBe(true);
      expect(result.progress.phase).toBe(QuestPhase.FINISHED);
      expect(result.progress.team.status).toBe(TeamStatus.FINISHED);
      expect(result.progress.timer.running).toBe(false);
      expect(result.progress.solvedCount).toBe(1);
    });

    it('takes no code once the quest is finished', async () => {
      const finishing = await loadFinishingTeam();
      await enterCode(finishing, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(finishing), { text: EXIT.roomNumber });

      await expectApiError(
        enterCode(await readTeam(finishing), 'exit1111', silentLog),
        QuestFinishedError,
      );
    });

    it('does not take the exit code for the next question', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(team), { text: EXIT.roomNumber });

      await expectApiError(enterCode(await readTeam(team), 'exit1111', silentLog), WrongCodeError);
    });
  });

  describe('readRoomNumber', () => {
    it('resolves a room code to its number', async () => {
      expect(await readRoomNumber(QUESTION_B.code)).toEqual({ roomNumber: QUESTION_B.roomNumber });
      expect(await readRoomNumber(`  ${QUESTION_A.code}  `)).toEqual({
        roomNumber: QUESTION_A.roomNumber,
      });
    });

    it('rejects an unknown code', async () => {
      await expectApiError(readRoomNumber('nosuch01'), WrongCodeError);
    });

    /** Тестовым кодом проходят квест целиком, поэтому он подходит и там, где ответ — аудитория. */
    it('passes the mock code through, and it counts as a correct answer', async () => {
      const mockCode = MOCK_CODE ?? '';
      expect(await readRoomNumber(mockCode)).toEqual({ roomNumber: mockCode });

      await enterCode(team, QUESTION_A.code, silentLog);
      const result = await submitAnswer(await readTeam(team), { text: mockCode });

      expect(result.correct).toBe(true);
      expect(result.progress.phase).toBe(QuestPhase.ROOM_TRANSITION);
    });
  });

  /** История прячет номер следующей аудитории в адресе страницы, поэтому получает его ответом. */
  describe('history questions', () => {
    it('hands the answer to the team along with the prompt', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'Москва' });
      const progress = await enterCode(await readTeam(team), QUESTION_B.code, silentLog);

      expect(progress.question?.content).toEqual({ html: 'Символ золота?' });
      expect(progress.question?.answers).toEqual(['Au']);
    });
  });

  describe('enterCode with MOCK_CODE', () => {
    const mockCode = MOCK_CODE;
    if (mockCode === null) {
      throw new Error('vitest.config.ts must set MOCK_CODE');
    }

    it('opens the first question of the next step regardless of the real code', async () => {
      const progress = await enterCode(team, mockCode, silentLog);

      expect(progress.phase).toBe(QuestPhase.QUESTION);
      expect(progress.question?.roomNumber).toBe(QUESTION_A.roomNumber);
      expect((await QuestionStateModel.findOne({ teamId: team._id }))?.room.roomNumber).toBe(
        QUESTION_A.roomNumber,
      );
    });

    it('walks the whole route with the mock code only', async () => {
      await enterCode(team, mockCode, silentLog);
      await submitAnswer(await readTeam(team), { text: 'Москва' });
      const progress = await enterCode(await readTeam(team), mockCode, silentLog);

      expect(progress.question?.roomNumber).toBe(QUESTION_B.roomNumber);
    });

    it('is idempotent while a question is open', async () => {
      await enterCode(team, mockCode, silentLog);
      const progress = await enterCode(await readTeam(team), mockCode, silentLog);

      expect(progress.currentStepIndex).toBe(1);
      expect(await QuestionStateModel.countDocuments({ teamId: team._id })).toBe(1);
    });

    it('still accepts the real code and still rejects wrong ones', async () => {
      await expectApiError(enterCode(team, 'nosuch01', silentLog), WrongCodeError);
      const progress = await enterCode(team, QUESTION_A.code, silentLog);
      expect(progress.phase).toBe(QuestPhase.QUESTION);
    });

    it('is inert when the mock code is not configured', async () => {
      await expectApiError(enterCode(team, mockCode, silentLog, new Date(), null), WrongCodeError);
      expect(await QuestionStateModel.countDocuments({ teamId: team._id })).toBe(0);
    });
  });

  describe('getProgress', () => {
    it('reports the route, timer and penalties of a finished quest', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'неверно' });
      await takeHint(await readTeam(team), 0);
      await submitAnswer(await readTeam(team), { text: 'Москва' });
      await enterCode(await readTeam(team), QUESTION_B.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'au' });

      const progress = await getProgress(await readTeam(team));

      expect(progress.phase).toBe(QuestPhase.FINISHED);
      expect(progress.question).toBeNull();
      expect(progress.solvedCount).toBe(2);
      expect(progress.totalQuestions).toBe(2);
      expect(progress.timer.running).toBe(false);
      expect(progress.timer.timeAdjustmentSeconds).toBe(40);
      expect(progress.timeAdjustments).toHaveLength(2);
      expect(progress.steps.every((card) => card.state === StepState.DONE)).toBe(true);
      expect(progress.steps.filter((card) => card.kind === StepKind.QUESTION)).toHaveLength(2);
    });
  });
});
