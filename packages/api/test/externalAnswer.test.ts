import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MOCK_CODE } from '../src/config/env.js';
import { QuestionStateModel } from '../src/models/QuestionState.js';
import { type TeamDocument } from '../src/models/Team.js';
import { confirmExternalAnswer } from '../src/services/quest/confirmExternalAnswer.js';
import { enterCode } from '../src/services/quest/enterCode.js';
import { NoWaitingTeamError, UnknownExternalCodeError } from '../src/utils/errors/index.js';
import {
  clearTestDb,
  ensureIndexes,
  LT,
  Q,
  QUESTION_A,
  QUESTION_B,
  RT,
  loadBindings,
  loadQuestion,
  loadTeam,
  readTeam,
  startTestDb,
  stopTestDb,
} from './helpers/testDb.js';

const DRUM_CODE = 3;

const silentLog = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
} as unknown as Parameters<typeof enterCode>[2];

/** Внешний механизм: дрампад в аудитории сам говорит, что мелодия повторена. */
describe('confirmExternalAnswer', () => {
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
      prompt: 'Повторите мелодию кнопками',
      acceptedAnswers: ['done'],
      wrongAttemptPenaltySeconds: 0,
      hintPenalties: [],
      waitsForExternalAnswer: true,
      externalAnswerCode: DRUM_CODE,
    });
    await loadQuestion(QUESTION_B, {
      prompt: 'Символ золота?',
      acceptedAnswers: ['Au'],
      wrongAttemptPenaltySeconds: 45,
      hintPenalties: [],
    });
    team = await loadTeam([LT, Q(QUESTION_A), RT, Q(QUESTION_B)]);
  });

  afterEach(async () => {
    await clearTestDb();
  });

  async function openQuestion(): Promise<void> {
    await enterCode(team, MOCK_CODE ?? QUESTION_A.code, silentLog);
    team = await readTeam(team);
  }

  it('засчитывает ответ команде, открывшей вопрос этого механизма', async () => {
    await openQuestion();

    const confirmed = await confirmExternalAnswer(DRUM_CODE);

    expect(confirmed).toEqual({ teamName: team.name, roomNumber: QUESTION_A.roomNumber });
    const state = await QuestionStateModel.findOne({ teamId: team._id, stepIndex: 1 });
    expect(state?.answeredAt).not.toBeNull();
    expect(state?.attempts).toHaveLength(1);
    expect(state?.attempts[0]?.correct).toBe(true);
    const advanced = await readTeam(team);
    expect(advanced.currentStepIndex).toBe(2);
  });

  it('не знает номера, которого нет ни у одного вопроса', async () => {
    await openQuestion();

    await expect(confirmExternalAnswer(DRUM_CODE + 1)).rejects.toBeInstanceOf(
      UnknownExternalCodeError,
    );
  });

  it('молчит, пока вопрос никем не открыт', async () => {
    await expect(confirmExternalAnswer(DRUM_CODE)).rejects.toBeInstanceOf(NoWaitingTeamError);
  });

  it('второй сигнал подряд команде ничего не добавляет', async () => {
    await openQuestion();
    await confirmExternalAnswer(DRUM_CODE);

    await expect(confirmExternalAnswer(DRUM_CODE)).rejects.toBeInstanceOf(NoWaitingTeamError);
    const advanced = await readTeam(team);
    expect(advanced.currentStepIndex).toBe(2);
  });
});
