import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameType, Location, toRoomKey, type RoomRef } from '@quest/shared';
import { BindingModel } from '../models/Binding.js';
import { QuestionModel, getQuestionModel } from '../models/Question.js';
import { type Question } from '../models/questionFields.js';
import { TeamModel } from '../models/Team.js';
import { runLoader } from './runLoader.js';

const questionsDir = fileURLToPath(new URL('questions/', import.meta.url));

/** Незаданные поля вопроса: задание без текста, без подсказок и без штрафа. */
const questionDefaults = {
  html: '',
  acceptedAnswers: [],
  answerIsNextRoom: false,
  hasDynamicAnswer: false,
  shouldSendAnswer: false,
  waitsForExternalAnswer: false,
  externalAnswerCode: null,
  teamSlugs: [],
  cells: [],
  wrongAttemptPenaltySeconds: 0,
  hints: [],
};

interface QuestionEntry {
  question: Question;
}

/** Файл на тип игры: массив вопросов одного `gameType`. */
async function readQuestionFile(fileName: string): Promise<QuestionEntry[]> {
  const raw: unknown = JSON.parse(await readFile(path.join(questionsDir, fileName), 'utf8'));
  if (!Array.isArray(raw)) {
    throw new Error(`${fileName}: JSON must be an array of questions`);
  }

  const entries = raw.map((question, index) => toQuestionEntry(question, `${fileName}[${index}]`));
  assertOneGameType(entries, fileName);
  return entries;
}

function toQuestionEntry(raw: unknown, place: string): QuestionEntry {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${place}: question must be an object`);
  }

  const fields = raw as Partial<Question> & { rooms?: RoomRef[] };
  const question = {
    ...questionDefaults,
    ...fields,
    rooms: (fields.rooms ?? []).map(({ location, roomNumber }) => ({ location, roomNumber })),
  } as Question;
  assertQuestionValid(question, place);
  assertAnswersValid(question, place);
  assertExternalAnswerValid(question, place);

  const entry = { question };
  assertRoomsUnique(entry, place);
  return entry;
}

function assertQuestionValid(question: Question, place: string): void {
  if (question.rooms.length === 0) {
    throw new Error(`${place}: rooms must not be empty`);
  }
  for (const { location, roomNumber } of question.rooms) {
    if (!Object.values(Location).includes(location)) {
      throw new Error(`${place}: unknown location "${location}"`);
    }
    if (typeof roomNumber !== 'string' || roomNumber === '') {
      throw new Error(`${place}: roomNumber must not be empty`);
    }
  }
  if (!Object.values(GameType).includes(question.gameType)) {
    throw new Error(`${place}: unknown game type "${question.gameType}"`);
  }
}

/** Ответ либо заранее известен, либо его подставляет ядро — одно из двух. */
function assertAnswersValid(question: Question, place: string): void {
  const { answerIsNextRoom, hasDynamicAnswer, acceptedAnswers } = question;
  if (hasDynamicAnswer && !answerIsNextRoom) {
    throw new Error(`${place}: a computed answer is always the next room`);
  }
  if (hasDynamicAnswer && acceptedAnswers.length > 0) {
    throw new Error(`${place}: a computed answer leaves acceptedAnswers empty`);
  }
  if (!hasDynamicAnswer && acceptedAnswers.length === 0) {
    throw new Error(`${place}: acceptedAnswers must not be empty`);
  }
}

/** Номер внешнего механизма есть только у вопроса, который его и ждёт. */
function assertExternalAnswerValid(question: Question, place: string): void {
  const { externalAnswerCode, waitsForExternalAnswer } = question;
  if (externalAnswerCode === null) {
    return;
  }
  if (!Number.isInteger(externalAnswerCode) || externalAnswerCode < 0) {
    throw new Error(`${place}: externalAnswerCode must be a non-negative integer`);
  }
  if (!waitsForExternalAnswer) {
    throw new Error(`${place}: externalAnswerCode needs waitsForExternalAnswer`);
  }
}

/** Команде достаётся её вариант, поэтому в аудитории он у неё один. */
function assertTeamVariantsUnique(entries: QuestionEntry[]): void {
  const seen = new Set<string>();
  for (const { question } of entries) {
    for (const teamSlug of question.teamSlugs) {
      for (const room of question.rooms) {
        const key = `${toRoomKey(room)} ${teamSlug}`;
        if (seen.has(key)) {
          throw new Error(`команде «${teamSlug}» заведено два варианта в ${toRoomKey(room)}`);
        }
        seen.add(key);
      }
    }
  }
}

/** Код клетки сканируют в аудитории: он обязан вести ровно в одну клетку. */
function assertCellCodesUnique(entries: QuestionEntry[]): void {
  const codes = new Set<string>();
  for (const { question } of entries) {
    for (const cell of question.cells) {
      if (codes.has(cell.code)) {
        throw new Error(`код клетки ${cell.code} привязан к двум клеткам`);
      }
      codes.add(cell.code);
    }
  }
}

/** Механизм называет себя номером, поэтому номер приводит ровно к одному вопросу. */
function assertExternalCodesUnique(entries: QuestionEntry[]): void {
  const codes = new Set<number>();
  for (const { question } of entries) {
    const code = question.externalAnswerCode;
    if (code === null) {
      continue;
    }
    if (codes.has(code)) {
      throw new Error(`externalAnswerCode ${code} is used by two questions`);
    }
    codes.add(code);
  }
}

function assertOneGameType(entries: QuestionEntry[], fileName: string): void {
  const [first, ...rest] = entries;
  if (!first) {
    return;
  }
  const stranger = rest.find(({ question }) => question.gameType !== first.question.gameType);
  if (stranger) {
    throw new Error(
      `${fileName}: holds ${first.question.gameType} and ${stranger.question.gameType}, one file is one game type`,
    );
  }
}

/** Аудитории внутри одного вопроса не повторяются; разные вопросы одну делить могут. */
function assertRoomsUnique({ question }: QuestionEntry, place: string): void {
  const rooms = new Set<string>();
  for (const room of question.rooms) {
    if (rooms.has(toRoomKey(room))) {
      throw new Error(`${place}: room ${toRoomKey(room)} is listed twice`);
    }
    rooms.add(toRoomKey(room));
  }
}

/** Вопросы аудиторий переписываются целиком: правки в файлах важнее того, что лежит в базе. */
async function replaceQuestions(entries: QuestionEntry[]): Promise<void> {
  const rooms = entries.flatMap(({ question }) => question.rooms);
  await QuestionModel.deleteMany({
    $or: rooms.map(({ location, roomNumber }) => ({
      rooms: { $elemMatch: { location, roomNumber } },
    })),
  });
  await Promise.all(
    entries.map(({ question }) => getQuestionModel(question.gameType).create(question)),
  );
}

async function warnAboutRoomsWithoutCode(entries: QuestionEntry[]): Promise<void> {
  const bindings = await BindingModel.find().lean();
  const withCode = new Set(bindings.map(toRoomKey));
  for (const { question } of entries) {
    for (const room of question.rooms) {
      if (!withCode.has(toRoomKey(room))) {
        console.warn(`  ! ауд. ${toRoomKey(room)} без кода на двери, вопрос не открыть`);
      }
    }
  }
}

/** Вариант достанется команде, только если её `slug` есть в базе. */
async function warnAboutUnknownTeams(entries: QuestionEntry[]): Promise<void> {
  const named = new Set(entries.flatMap(({ question }) => question.teamSlugs));
  if (named.size === 0) {
    return;
  }
  const teams = await TeamModel.find().select('slug').lean();
  const known = new Set(teams.map((team) => team.slug));
  for (const slug of named) {
    if (!known.has(slug)) {
      console.warn(`  ! команды «${slug}» нет в базе, её вариант никому не достанется`);
    }
  }
}

/** Заливает вопросы из `data/questions/*.json`; коды, команды и их прогресс не трогает. */
async function loadQuestions(): Promise<void> {
  const fileNames = (await readdir(questionsDir)).filter((name) => name.endsWith('.json')).sort();
  if (fileNames.length === 0) {
    console.log(`No question files in ${questionsDir}, see the README there`);
    return;
  }

  const files = await Promise.all(fileNames.map(readQuestionFile));
  const entries = files.flat();
  assertExternalCodesUnique(entries);
  assertTeamVariantsUnique(entries);
  assertCellCodesUnique(entries);
  await replaceQuestions(entries);

  console.log(`Questions: ${entries.length}`);
  for (const [index, fileName] of fileNames.entries()) {
    console.log(`  ${fileName}`);
    for (const { question } of files[index] ?? []) {
      const rooms = question.rooms.map(toRoomKey).join(', ');
      const teams =
        question.teamSlugs.length === 0 ? '' : ` — команд: ${question.teamSlugs.length}`;
      console.log(`    ${rooms}${teams}`);
    }
  }
  await warnAboutRoomsWithoutCode(entries);
  await warnAboutUnknownTeams(entries);

  await QuestionModel.syncIndexes();
}

await runLoader(loadQuestions);
