import { describe, expect, it } from 'vitest';
import { ScanKind, toScan } from './toScan.js';

const ORIGIN = 'https://quest.example.com';

describe('что поймали в кадр', () => {
  it('код с двери', () => {
    expect(toScan('V75V2VEG', ORIGIN)).toEqual({
      kind: ScanKind.CODE,
      value: 'V75V2VEG',
      code: 'V75V2VEG',
      path: null,
    });
  });

  it('ссылка на платформу — с путём для перехода', () => {
    const scan = toScan(`${ORIGIN}/pub/confirm_video?from=video`, ORIGIN);
    expect(scan.kind).toBe(ScanKind.LINK);
    expect(scan.path).toBe('/pub/confirm_video?from=video');
  });

  it('чужой сайт кодом не считается', () => {
    expect(toScan('https://vk.com/itmo', ORIGIN).kind).toBe(ScanKind.FOREIGN);
  });

  it('чужой сайт не отдаёт код, даже если в адресе есть восемь символов подряд', () => {
    const scan = toScan('https://vk.com/abcd1234', ORIGIN);
    expect(scan.kind).toBe(ScanKind.FOREIGN);
    expect(scan.code).toBeNull();
  });

  it('случайный текст', () => {
    expect(toScan('привет', ORIGIN).kind).toBe(ScanKind.FOREIGN);
  });
});
