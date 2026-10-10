import { readFile } from 'node:fs/promises';
import { BindingModel } from '../models/Binding.js';
import { toBindingsByCode } from '../utils/binding/toBindingsByCode.js';
import { parseCsv } from '../utils/csv/parseCsv.js';
import { dropCollection } from './dropCollection.js';
import { runLoader } from './runLoader.js';

const bindingsFile = new URL('bindings.csv', import.meta.url);

/** Пересоздаёт коды на дверях из таблицы организаторов; вопросы и команды не трогает. */
async function loadBindings(): Promise<void> {
  const bindings = toBindingsByCode(parseCsv(await readFile(bindingsFile, 'utf8')));

  await dropCollection(BindingModel.collection.name);
  await BindingModel.insertMany(
    [...bindings].map(([code, { location, roomNumber, roomTitle }]) => ({
      code,
      location,
      roomNumber,
      roomTitle,
    })),
  );

  console.log(`Door codes: ${bindings.size}`);
}

await runLoader(loadBindings);
