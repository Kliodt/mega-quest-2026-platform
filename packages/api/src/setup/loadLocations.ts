import { readFile } from 'node:fs/promises';
import { Location } from '@quest/shared';
import { LocationNoteModel } from '../models/LocationNote.js';
import { dropCollection } from './dropCollection.js';
import { runLoader } from './runLoader.js';

const locationsFile = new URL('locations.json', import.meta.url);

interface LocationNoteData {
  /** Корпус позади; без него текст показывается на любом переходе в `location` */
  from: Location | null;
  location: Location;
  html: string;
}

function toLocation(raw: unknown, index: number): Location {
  if (typeof raw !== 'string' || !Object.values(Location).includes(raw as Location)) {
    throw new Error(`locations.json: запись ${index + 1}, неизвестный корпус ${String(raw)}`);
  }
  return raw as Location;
}

function toNotes(raw: unknown): LocationNoteData[] {
  if (!Array.isArray(raw)) {
    throw new Error('locations.json: ожидается массив');
  }
  const notes = raw.map((entry, index) => {
    const note = entry as Partial<Record<keyof LocationNoteData, unknown>>;
    if (typeof note.html !== 'string') {
      throw new Error(`locations.json: запись ${index + 1} без html`);
    }
    let from: Location | null = null;
    if (note.from !== undefined && note.from !== null) {
      from = toLocation(note.from, index);
    }
    return { from, location: toLocation(note.location, index), html: note.html };
  });

  const pairs = new Set<string>();
  notes.forEach((note) => {
    const pair = `${note.from ?? ''}/${note.location}`;
    if (pairs.has(pair)) {
      throw new Error(`locations.json: пара корпусов ${pair} описана дважды`);
    }
    pairs.add(pair);
  });
  return notes;
}

/**
 * Пересоздаёт тексты переходов между корпусами. Команд, вопросов и прогресса не трогает,
 * поэтому запускать можно хоть посреди квеста: текст доедет до команд следующим обновлением.
 */
async function loadLocations(): Promise<void> {
  const notes = toNotes(JSON.parse(await readFile(locationsFile, 'utf8')));
  const filled = notes.filter((note) => note.html.trim() !== '');

  await dropCollection(LocationNoteModel.collection.name);
  if (filled.length > 0) {
    await LocationNoteModel.insertMany(filled);
  }

  console.log(`Location notes: ${filled.length} of ${notes.length}`);
}

await runLoader(loadLocations);
