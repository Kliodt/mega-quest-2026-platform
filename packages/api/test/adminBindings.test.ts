import { Location } from '@quest/shared';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { saveBinding } from '../src/services/admin/saveBinding.js';
import { readBinding } from '../src/services/binding/readBinding.js';
import { BindingRoomInvalidError } from '../src/utils/errors/index.js';
import { clearTestDb, ensureIndexes, startTestDb, stopTestDb } from './helpers/testDb.js';

const ROOM = { location: Location.BIRJA, roomNumber: '107 (Б14)' };

describe('коды на дверях в админке', () => {
  beforeAll(startTestDb);
  afterAll(stopTestDb);

  afterEach(clearTestDb);

  it('запоминает номер отдельно от пометки организаторов', async () => {
    const { bindings } = await saveBinding({ ...ROOM, code: 'aaaa1111' });

    expect(bindings).toEqual([
      {
        location: Location.BIRJA,
        roomNumber: '107',
        roomTitle: '107 (Б14)',
        code: 'aaaa1111',
        questionsCount: 0,
      },
    ]);
  });

  /** У двери бывает и два листка: сканируют любой, оба ведут в ту же аудиторию */
  it('разрешает второй код в той же аудитории', async () => {
    await ensureIndexes();
    await saveBinding({ ...ROOM, code: 'aaaa1111' });

    const { bindings } = await saveBinding({ ...ROOM, code: 'bbbb2222' });

    expect(bindings.map((binding) => binding.code).sort()).toEqual(['aaaa1111', 'bbbb2222']);
    expect(await readBinding('aaaa1111')).toMatchObject({ roomNumber: '107' });
    expect(await readBinding('bbbb2222')).toMatchObject({ roomNumber: '107' });
  });

  it('не берёт аудиторию без номера', async () => {
    await expect(
      saveBinding({ location: Location.BIRJA, roomNumber: '(Б14)', code: 'aaaa1111' }),
    ).rejects.toBeInstanceOf(BindingRoomInvalidError);
  });
});
