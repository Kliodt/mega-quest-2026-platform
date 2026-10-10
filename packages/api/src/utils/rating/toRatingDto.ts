import { StepKind, TeamStatus, type RatingDto, type RatingEntryDto } from '@quest/shared';
import { buildTimerSteps } from '../progress/buildTimerSteps.js';
import { type ProgressStateInput } from '../progress/types.js';
import { getTeamStatus } from '../team/getTeamStatus.js';
import { getTimeAdjustmentSeconds } from '../timeAdjustment/getTimeAdjustmentSeconds.js';
import { toTimerDto } from '../timer/toTimerDto.js';
import { type RatingTeamInput } from './types.js';

type UnrankedEntry = Omit<RatingEntryDto, 'rank'>;

const STATUS_ORDER: Record<TeamStatus, number> = {
  [TeamStatus.FINISHED]: 0,
  [TeamStatus.IN_PROGRESS]: 1,
  [TeamStatus.NOT_STARTED]: 2,
};

export function toRatingDto(teams: RatingTeamInput[], now: Date): RatingDto {
  const entries = teams
    .map((team) => toUnrankedEntry(team, now))
    .sort(compareEntries)
    .map((entry, index) => ({ rank: index + 1, ...entry }));
  return { generatedAt: now.toISOString(), entries };
}

function toUnrankedEntry(team: RatingTeamInput, now: Date): UnrankedEntry {
  const status = getTeamStatus(team);
  const statesByIndex = new Map(team.states.map((state) => [state.stepIndex, state]));
  const timer = toTimerDto(
    buildTimerSteps(team.sequence, statesByIndex),
    team.currentStepIndex,
    now,
    getTimeAdjustmentSeconds(team.timeAdjustments),
  );
  let finished: Date | null = null;
  if (status === TeamStatus.FINISHED) {
    finished = getLastAnsweredAt(team.states);
  }

  return {
    teamId: team.id,
    teamName: team.name,
    status,
    solvedCount: team.states.filter((state) => state.answeredAt !== null).length,
    totalQuestions: team.sequence.filter((step) => step.kind === StepKind.QUESTION).length,
    elapsedSeconds: timer.elapsedSeconds,
    timeAdjustmentSeconds: timer.timeAdjustmentSeconds,
    totalSeconds: timer.totalSeconds,
    finishedAt: finished ? finished.toISOString() : null,
  };
}

/** Финишировавшие по времени, идущие по решённым и времени, не начавшие по имени. */
function compareEntries(a: UnrankedEntry, b: UnrankedEntry): number {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus !== 0) {
    return byStatus;
  }
  if (a.status === TeamStatus.FINISHED) {
    return (
      a.totalSeconds - b.totalSeconds ||
      (a.finishedAt ?? '').localeCompare(b.finishedAt ?? '') ||
      a.teamName.localeCompare(b.teamName)
    );
  }
  if (a.status === TeamStatus.IN_PROGRESS) {
    return (
      b.solvedCount - a.solvedCount ||
      a.totalSeconds - b.totalSeconds ||
      a.teamName.localeCompare(b.teamName)
    );
  }
  return a.teamName.localeCompare(b.teamName);
}

function getLastAnsweredAt(states: ProgressStateInput[]): Date | null {
  let latest: Date | null = null;
  for (const state of states) {
    if (state.answeredAt && (latest === null || state.answeredAt > latest)) {
      latest = state.answeredAt;
    }
  }
  return latest;
}
