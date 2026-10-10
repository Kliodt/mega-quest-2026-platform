import { toCode } from './toCode.js';

export enum ScanKind {
  /** Код с двери: восемь букв и цифр из таблицы кодов */
  CODE = 'code',
  /** Ссылка на саму платформу: по ней можно перейти */
  LINK = 'link',
  /** Чужой QR: ни кодом, ни нашей ссылкой не является */
  FOREIGN = 'foreign',
}

export interface Scan {
  kind: ScanKind;
  /** Что прочитала камера */
  value: string;
  /** Код с двери; null у ссылок и чужих QR */
  code: string | null;
  /** Путь внутри платформы вместе с параметрами; null не у ссылок */
  path: string | null;
}

/**
 * Что команда поймала в кадр. Ссылки на платформу узнаём по адресу, коды — по формату
 * таблицы кодов, всё остальное считаем чужим QR: отправлять его на сервер незачем.
 */
export function toScan(scanned: string, origin: string): Scan {
  const trimmed = scanned.trim();
  const url = toUrl(trimmed);

  if (url !== null) {
    if (url.origin === origin) {
      return {
        kind: ScanKind.LINK,
        value: trimmed,
        code: null,
        path: `${url.pathname}${url.search}`,
      };
    }
    return { kind: ScanKind.FOREIGN, value: trimmed, code: null, path: null };
  }

  const code = toCode(trimmed);
  if (code === null) {
    return { kind: ScanKind.FOREIGN, value: trimmed, code: null, path: null };
  }
  return { kind: ScanKind.CODE, value: trimmed, code, path: null };
}

function toUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
