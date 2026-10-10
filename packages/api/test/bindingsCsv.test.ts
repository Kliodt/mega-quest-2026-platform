import { Location } from '@quest/shared';
import { describe, expect, it } from 'vitest';
import { toBindingsByCode } from '../src/utils/binding/toBindingsByCode.js';
import { parseCsv } from '../src/utils/csv/parseCsv.js';

function toBindings(csv: string) {
  return toBindingsByCode(parseCsv(csv));
}

describe('toBindingsByCode', () => {
  it('читает таблицу организаторов: код, аудитория, корпус', () => {
    const bindings = toBindings('code,room,location\nV75V2VEG,107,birja\nHS6X8PX5,119,birja\n');

    expect(bindings.size).toBe(2);
    expect(bindings.get('V75V2VEG')).toEqual({
      location: Location.BIRJA,
      roomNumber: '107',
      roomTitle: '107',
    });
  });

  it('понимает корпус, записанный названием', () => {
    const bindings = toBindings('code,room,location\nV75V2VEG,1216,Ломоносова\n');

    expect(bindings.get('V75V2VEG')?.location).toBe(Location.LOMO);
  });

  /** В таблице к номеру дописывают корпус Биржи; платформа знает только номер */
  it('отбрасывает пометку рядом с номером аудитории', () => {
    const bindings = toBindings('code,room,location\nV75V2VEG,107 (Б14),birja\n');

    expect(bindings.get('V75V2VEG')).toEqual({
      location: Location.BIRJA,
      roomNumber: '107',
      roomTitle: '107 (Б14)',
    });
  });

  it('принимает колонку roomNumber вместо room', () => {
    const bindings = toBindings('code,roomNumber,location\nV75V2VEG,2101,cronva\n');

    expect(bindings.get('V75V2VEG')?.roomNumber).toBe('2101');
  });

  it('пропускает пустые строки в конце файла', () => {
    const bindings = toBindings('code,room,location\nV75V2VEG,107,birja\n,,\n');

    expect(bindings.size).toBe(1);
  });

  it('ругается на код не из восьми символов', () => {
    expect(() => toBindings('code,room,location\nSHORT,107,birja\n')).toThrow(/код/);
  });

  it('ругается на неизвестный корпус', () => {
    expect(() => toBindings('code,room,location\nV75V2VEG,107,кампус\n')).toThrow(/корпус/);
  });

  it('ругается на повтор кода: одна дверь — один код', () => {
    const csv = 'code,room,location\nV75V2VEG,107,birja\nV75V2VEG,119,birja\n';

    expect(() => toBindings(csv)).toThrow(/второй раз/);
  });

  it('ругается, если в таблице нет нужных колонок', () => {
    expect(() => toBindings('код,аудитория\nV75V2VEG,107\n')).toThrow(/аудитори/);
  });
});
