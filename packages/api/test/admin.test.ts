import {
  StepState,
  StepKind,
  TeamStatus,
  TimeAdjustmentType,
  type BasicAdminQuestionDto,
} from '@quest/shared';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { QuestionStateModel } from '../src/models/QuestionState.js';
import { TeamModel, type TeamDocument } from '../src/models/Team.js';
import { addTimeAdjustment } from '../src/services/admin/addTimeAdjustment.js';
import { answerForTeam } from '../src/services/admin/answerForTeam.js';
import { createTeam } from '../src/services/admin/createTeam.js';
import { deleteTeam } from '../src/services/admin/deleteTeam.js';
import { deleteTimeAdjustment } from '../src/services/admin/deleteTimeAdjustment.js';
import { getAdminQuestions } from '../src/services/admin/getAdminQuestions.js';
import { getAdminTeamDetail } from '../src/services/admin/getAdminTeamDetail.js';
import { getAdminTeams } from '../src/services/admin/getAdminTeams.js';
import { rewindTeam } from '../src/services/admin/rewindTeam.js';
import { scanForTeam } from '../src/services/admin/scanForTeam.js';
import { updateTeam } from '../src/services/admin/updateTeam.js';
import { loginTeam } from '../src/services/auth/loginTeam.js';
import { submitAnswer } from '../src/services/openQuestion/submitAnswer.js';
import { takeHint } from '../src/services/openQuestion/takeHint.js';
import { enterCode } from '../src/services/quest/enterCode.js';
import { getProgress } from '../src/services/quest/getProgress.js';
import {
  NoOpenQuestionError,
  QuestFinishedError,
  RewindStepInvalidError,
  RouteInvalidError,
  RoutePrefixLockedError,
  TeamNameTakenError,
  TeamNotFoundError,
  TimeAdjustmentNotFoundError,
  TimeAdjustmentStepInvalidError,
} from '../src/utils/errors/index.js';
import {
  clearTestDb,
  ensureIndexes,
  loadBindings,
  loadQuestion,
  loadTeam,
  QUESTION_A,
  QUESTION_B,
  LT,
  Q,
  readTeam,
  RT,
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

const ROUTE = [LT, Q(QUESTION_A), RT, Q(QUESTION_B)];

describe('admin services', () => {
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
      hintPenalties: [10, 20],
    });
    await loadQuestion(QUESTION_B, {
      prompt: 'Символ золота?',
      acceptedAnswers: ['Au'],
      wrongAttemptPenaltySeconds: 45,
      hintPenalties: [15],
    });
    team = await loadTeam(ROUTE);
  });

  afterEach(async () => {
    await clearTestDb();
  });

  describe('teams list and detail', () => {
    it('lists teams with rating figures and route position', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);

      const list = await getAdminTeams();

      expect(list.teams).toHaveLength(1);
      expect(list.teams[0]).toMatchObject({
        teamName: 'Тестовая',
        status: TeamStatus.IN_PROGRESS,
        currentStepIndex: 1,
        totalSteps: 4,
        solvedCount: 0,
      });
    });

    it('builds the map with per-step summary, attempts and hints', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'Питер' });
      await takeHint(await readTeam(team), 0);
      await submitAnswer(await readTeam(team), { text: 'Москва' });

      const detail = await getAdminTeamDetail(team.id);

      expect(detail.team.status).toBe(TeamStatus.IN_PROGRESS);
      expect(detail.steps.map((step) => step.state)).toEqual([
        StepState.DONE,
        StepState.DONE,
        StepState.ACTIVE,
        StepState.AWAITING_CODE,
      ]);
      const first = detail.steps[1];
      expect(first?.kind).toBe(StepKind.QUESTION);
      if (first?.kind !== StepKind.QUESTION) {
        return;
      }
      expect(first.question?.roomNumber).toBe(QUESTION_A.roomNumber);
      expect(first.timeAdjustmentSeconds).toBe(40);
      expect(first.hintsCount).toBe(1);
      expect(first.attemptsCount).toBe(2);
      expect(first.wrongAttemptsCount).toBe(1);
      expect(first.attempts.map((attempt) => attempt.payload)).toEqual([
        { text: 'Питер' },
        { text: 'Москва' },
      ]);
      expect(first.hints[0]?.index).toBe(0);
      expect(detail.timer.timeAdjustmentSeconds).toBe(40);
      expect(
        detail.timeAdjustments.map((adjustment) => [
          adjustment.type,
          adjustment.timeAdjustmentSeconds,
          adjustment.stepIndex,
        ]),
      ).toEqual([
        [TimeAdjustmentType.WRONG_ANSWER, 30, 1],
        [TimeAdjustmentType.HINT, 10, 1],
      ]);
    });

    it('rejects an unknown team', async () => {
      await expectApiError(getAdminTeamDetail('0123456789abcdef01234567'), TeamNotFoundError);
    });
  });

  describe('createTeam', () => {
    it('creates a team that can log in with the given password', async () => {
      const detail = await createTeam({ name: 'Новая', password: 'secret1', sequence: ROUTE });

      expect(detail.team.status).toBe(TeamStatus.NOT_STARTED);
      expect(detail.steps).toHaveLength(4);
      const logged = await loginTeam('Новая', 'secret1');
      expect(logged.id).toBe(detail.team.id);
    });

    it('rejects a duplicate name', async () => {
      await expectApiError(
        createTeam({ name: 'Тестовая', password: 'secret1', sequence: ROUTE }),
        TeamNameTakenError,
      );
    });

    it('rejects an invalid route and reports the reasons', async () => {
      const failure = await createTeam({
        name: 'Кривая',
        password: 'secret1',
        sequence: [LT, Q({ ...QUESTION_A, roomNumber: 'нет такой' }), RT],
      }).catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(RouteInvalidError);
      const errors = (failure as RouteInvalidError).data?.errors;
      expect(Array.isArray(errors)).toBe(true);
      expect(JSON.stringify(errors)).toContain('no question in room');
    });
  });

  describe('updateTeam', () => {
    it('renames, changes password and drops the active session', async () => {
      await loginTeam('Тестовая', 'irrelevant').catch(() => undefined);
      await TeamModel.updateOne({ _id: team._id }, { $set: { sessionId: 'sid' } });

      const detail = await updateTeam(team.id, { name: 'Переименованная', password: 'newpass' });

      expect(detail.team.name).toBe('Переименованная');
      const fresh = await readTeam(team);
      expect(fresh.sessionId).toBeNull();
      expect((await loginTeam('Переименованная', 'newpass')).id).toBe(team.id);
    });

    it('rejects a name already used by another team', async () => {
      await loadTeam(ROUTE, 'Другая');
      await expectApiError(updateTeam(team.id, { name: 'Другая' }), TeamNameTakenError);
    });

    it('replaces the whole route before the team starts', async () => {
      const detail = await updateTeam(team.id, { sequence: [LT, Q(QUESTION_B)] });
      expect(detail.team.sequence).toEqual([LT, Q(QUESTION_B)]);
      expect(detail.steps).toHaveLength(2);
    });

    it('keeps the passed prefix locked once the team has started', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);

      await expectApiError(
        updateTeam(team.id, { sequence: [LT, Q(QUESTION_B), RT, Q(QUESTION_A)] }),
        RoutePrefixLockedError,
      );
      const detail = await updateTeam(team.id, { sequence: [LT, Q(QUESTION_A)] });
      expect(detail.team.sequence).toEqual([LT, Q(QUESTION_A)]);
    });

    it('validates the new route', async () => {
      await expectApiError(updateTeam(team.id, { sequence: [Q(QUESTION_A)] }), RouteInvalidError);
    });
  });

  describe('deleteTeam', () => {
    it('removes the team with its states', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);

      await deleteTeam(team.id);

      expect(await TeamModel.countDocuments()).toBe(0);
      expect(await QuestionStateModel.countDocuments()).toBe(0);
      await expectApiError(deleteTeam(team.id), TeamNotFoundError);
    });
  });

  describe('time adjustments', () => {
    it('adds a penalty and a compensation and reflects both in timer and history', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await addTimeAdjustment(team.id, {
        timeAdjustmentSeconds: 60,
        type: TimeAdjustmentType.PENALTY,
        comment: 'опоздание',
      });
      const detail = await addTimeAdjustment(team.id, {
        timeAdjustmentSeconds: -90,
        type: TimeAdjustmentType.COMPENSATION,
        comment: 'сбой',
        stepIndex: 1,
      });

      expect(detail.timeAdjustments.map((a) => a.timeAdjustmentSeconds)).toEqual([60, -90]);
      expect(detail.timeAdjustments.map((a) => a.stepIndex)).toEqual([null, 1]);
      expect(detail.timer.timeAdjustmentSeconds).toBe(-30);
      const first = detail.steps[1];
      if (first?.kind === StepKind.QUESTION) {
        expect(first.timeAdjustmentSeconds).toBe(-90);
      }

      const progress = await getProgress(await readTeam(team));
      expect(progress.timer.timeAdjustmentSeconds).toBe(-30);
      expect(progress.timeAdjustments.map((a) => a.type)).toEqual([
        TimeAdjustmentType.PENALTY,
        TimeAdjustmentType.COMPENSATION,
      ]);
    });

    it('rejects a stepIndex that is not a question step of this team', async () => {
      const transitionStep = { timeAdjustmentSeconds: 30, type: TimeAdjustmentType.PENALTY };

      await expectApiError(
        addTimeAdjustment(team.id, { ...transitionStep, comment: 'переход', stepIndex: 0 }),
        TimeAdjustmentStepInvalidError,
      );
      await expectApiError(
        addTimeAdjustment(team.id, { ...transitionStep, comment: 'за краем', stepIndex: 99 }),
        TimeAdjustmentStepInvalidError,
      );

      const detail = await getAdminTeamDetail(team.id);
      expect(detail.timeAdjustments).toHaveLength(0);
    });

    it('lets the organiser cancel an automatic penalty', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await takeHint(await readTeam(team), 0);
      const before = await getAdminTeamDetail(team.id);
      const hintAdjustment = before.timeAdjustments[0];
      expect(hintAdjustment?.type).toBe(TimeAdjustmentType.HINT);

      const detail = await deleteTimeAdjustment(team.id, hintAdjustment?.id ?? '');

      expect(detail.timeAdjustments).toHaveLength(0);
      expect(detail.timer.timeAdjustmentSeconds).toBe(0);
      const state = await QuestionStateModel.findOne({ teamId: team._id, stepIndex: 1 });
      expect(state?.hintsTaken).toHaveLength(1);
    });

    it('deletes an adjustment and rejects unknown ones', async () => {
      const added = await addTimeAdjustment(team.id, {
        timeAdjustmentSeconds: 60,
        type: TimeAdjustmentType.PENALTY,
        comment: 'опоздание',
      });
      const timeAdjustmentId = added.timeAdjustments[0]?.id ?? '';

      const detail = await deleteTimeAdjustment(team.id, timeAdjustmentId);

      expect(detail.timeAdjustments).toHaveLength(0);
      await expectApiError(
        deleteTimeAdjustment(team.id, timeAdjustmentId),
        TimeAdjustmentNotFoundError,
      );
      await expectApiError(
        deleteTimeAdjustment('0123456789abcdef01234567', timeAdjustmentId),
        TeamNotFoundError,
      );
    });
  });

  describe('rewindTeam', () => {
    it('clears the step, keeps manual adjustments and lets the team enter the code again', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'Питер' });
      await takeHint(await readTeam(team), 0);
      await addTimeAdjustment(team.id, {
        timeAdjustmentSeconds: 60,
        type: TimeAdjustmentType.PENALTY,
        comment: 'опоздание',
        stepIndex: 1,
      });

      const detail = await rewindTeam(team.id, 1);

      expect(detail.team.currentStepIndex).toBe(0);
      expect(detail.steps.map((step) => step.state)).toEqual([
        StepState.ACTIVE,
        StepState.AWAITING_CODE,
        StepState.LOCKED,
        StepState.LOCKED,
      ]);
      expect(detail.timeAdjustments.map((adjustment) => adjustment.type)).toEqual([
        TimeAdjustmentType.PENALTY,
      ]);
      expect(detail.timer.timeAdjustmentSeconds).toBe(60);
      expect(await QuestionStateModel.countDocuments({ teamId: team._id })).toBe(0);

      const progress = await enterCode(await readTeam(team), QUESTION_A.code, silentLog);
      expect(progress.question?.roomNumber).toBe(QUESTION_A.roomNumber);
      expect(progress.question?.wrongAttemptsCount).toBe(0);
    });

    it('drops every later step when rewinding past answered questions', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'Москва' });
      await enterCode(await readTeam(team), QUESTION_B.code, silentLog);
      await submitAnswer(await readTeam(team), { text: 'неверно' });

      const detail = await rewindTeam(team.id, 1);

      expect(detail.team.currentStepIndex).toBe(0);
      expect(detail.timer.timeAdjustmentSeconds).toBe(0);
      expect(detail.timer.elapsedSeconds).toBe(0);
      expect(await QuestionStateModel.countDocuments({ teamId: team._id })).toBe(0);
    });

    it('rejects a transition step, a step ahead of the team and an unknown team', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);

      await expectApiError(rewindTeam(team.id, 0), RewindStepInvalidError);
      await expectApiError(rewindTeam(team.id, 3), RewindStepInvalidError);
      await expectApiError(rewindTeam('0123456789abcdef01234567', 1), TeamNotFoundError);
      expect((await readTeam(team)).currentStepIndex).toBe(1);
    });
  });

  describe('answerForTeam', () => {
    /** Вопрос сломался: организатор закрывает его сам, и команда идёт дальше */
    it('closes the open question, advances the team and logs the answer', async () => {
      await enterCode(team, QUESTION_A.code, silentLog);

      const detail = await answerForTeam(team.id);

      expect(detail.team.currentStepIndex).toBe(2);
      const step = detail.steps[1];
      expect(step?.kind).toBe(StepKind.QUESTION);
      expect(step?.state).toBe(StepState.DONE);
      if (step?.kind === StepKind.QUESTION) {
        expect(step.attempts).toHaveLength(1);
        expect(step.attempts[0]?.correct).toBe(true);
        expect(step.attempts[0]?.payload).toEqual({ text: 'ответ засчитан организатором' });
      }
    });

    it('has nothing to close without an open question', async () => {
      await expectApiError(answerForTeam(team.id), NoOpenQuestionError);
      await expectApiError(answerForTeam('0123456789abcdef01234567'), TeamNotFoundError);
    });
  });

  describe('scanForTeam', () => {
    /** QR не читается: организатор открывает шаг сам, как будто команда отсканировала код */
    it('opens the question of the next step', async () => {
      const detail = await scanForTeam(team.id, silentLog);

      expect(detail.team.currentStepIndex).toBe(1);
      const step = detail.steps[1];
      expect(step?.state).toBe(StepState.ACTIVE);
      if (step?.kind === StepKind.QUESTION) {
        expect(step.question?.roomNumber).toBe(QUESTION_A.roomNumber);
      }
    });

    /** Повторный скан ничего не ломает: вопрос уже открыт, шаг тот же */
    it('does nothing while the question is already open', async () => {
      await scanForTeam(team.id, silentLog);

      const detail = await scanForTeam(team.id, silentLog);

      expect(detail.team.currentStepIndex).toBe(1);
      await expectApiError(scanForTeam('0123456789abcdef01234567', silentLog), TeamNotFoundError);
    });

    /** Ответ на последнем вопросе закрывает квест сам: сканировать за командой нечего */
    it('has nothing to scan once the quest is finished', async () => {
      const finish = { location: QUESTION_A.location, roomNumber: 'выход' };
      const finishing = await loadTeam(
        [LT, Q(QUESTION_A), { kind: StepKind.LOCATION_TRANSITION, options: [finish] }],
        'Финиширующая',
      );
      await scanForTeam(finishing.id, silentLog);
      await submitAnswer(await readTeam(finishing), { text: 'Москва' });

      const detail = await getAdminTeamDetail(finishing.id);
      expect(detail.team.status).toBe(TeamStatus.FINISHED);
      await expectApiError(scanForTeam(finishing.id, silentLog), QuestFinishedError);
    });
  });

  describe('questions', () => {
    it('lists every question with its room and type', async () => {
      const { questions } = await getAdminQuestions();

      expect(questions.map((question) => question.rooms)).toEqual([
        [toRoom(QUESTION_A)],
        [toRoom(QUESTION_B)],
      ]);
    });

    it('exposes accepted answers to the organiser through the game type', async () => {
      const { questions } = await getAdminQuestions();
      const first = questions[0]?.content as BasicAdminQuestionDto | undefined;

      expect(first?.acceptedAnswers).toEqual([{ html: 'Москва' }]);
      expect(first?.hints).toHaveLength(2);
    });
  });
});
