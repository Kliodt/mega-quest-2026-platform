import { readFile } from 'node:fs/promises';
import { QuestionModel } from '../models/Question.js';
import { QuestionStateModel } from '../models/QuestionState.js';
import { TeamModel } from '../models/Team.js';
import { hashPassword } from '../utils/auth/hashPassword.js';
import { parseCsv } from '../utils/csv/parseCsv.js';
import { toSequenceQuestions } from '../utils/sequence/toSequenceQuestions.js';
import { type SequenceQuestionLookup } from '../utils/sequence/types.js';
import { validateSequence } from '../utils/sequence/validateSequence.js';
import { dropCollection } from './dropCollection.js';
import { runLoader } from './runLoader.js';
import { toTeamData, type TeamData } from './toTeamData.js';

const teamsFile = new URL('teams.csv', import.meta.url);

/** Команды из таблицы организаторов; строки без порядка корпусов пропускаются. */
async function readTeams(): Promise<TeamData[]> {
  const rows = parseCsv(await readFile(teamsFile, 'utf8'));
  const teams = rows.map(toTeamData).filter((team): team is TeamData => team !== null);
  const skipped = rows.length - teams.length;
  if (skipped > 0) {
    console.warn(`  ! строк без порядка корпусов: ${skipped}, они пропущены`);
  }
  assertTeamsValid(teams);
  return teams;
}

function assertTeamsValid(teams: TeamData[]): void {
  const names = new Set<string>();
  const slugs = new Set<string>();
  for (const { slug, name, password } of teams) {
    if (name === '' || password === '') {
      throw new Error(`Team "${name}": name and password are required`);
    }
    if (slug === '') {
      throw new Error(`Team "${name}": slug is required, variants are bound to it`);
    }
    if (names.has(name)) {
      throw new Error(`Team "${name}": duplicate name`);
    }
    if (slugs.has(slug)) {
      throw new Error(`Team "${name}": duplicate slug "${slug}"`);
    }
    names.add(name);
    slugs.add(slug);
  }
}

function assertSequencesValid(teams: TeamData[], questions: SequenceQuestionLookup): void {
  const broken = teams
    .map((team) => ({ team, result: validateSequence(team.sequence, questions, team.slug) }))
    .filter(({ result }) => !result.ok);
  if (broken.length === 0) {
    return;
  }
  const report = broken
    .map(({ team, result }) => `  ${team.name}:\n    - ${result.errors.join('\n    - ')}`)
    .join('\n');
  throw new Error(`Invalid routes: ${broken.length} of ${teams.length}\n${report}`);
}

/** Пересоздаёт команды и стирает весь их прогресс; вопросы не трогает. */
async function loadTeams(): Promise<void> {
  const teams = await readTeams();
  const questions = toSequenceQuestions(await QuestionModel.find().lean());
  assertSequencesValid(teams, questions);

  await dropCollection(QuestionStateModel.collection.name);
  await dropCollection(TeamModel.collection.name);

  const documents = await Promise.all(
    teams.map(async (team) => ({
      slug: team.slug,
      name: team.name,
      passwordHash: await hashPassword(team.password),
      sessionId: null,
      sequence: team.sequence,
      currentStepIndex: 0,
      timeAdjustments: [],
    })),
  );
  await TeamModel.insertMany(documents);

  console.log(`Teams: ${teams.length}`);
  for (const team of teams) {
    console.log(`  ${team.name} / ${team.password} — шагов ${team.sequence.length}`);
  }

  await QuestionStateModel.syncIndexes();
  await TeamModel.syncIndexes();
}

await runLoader(loadTeams);
