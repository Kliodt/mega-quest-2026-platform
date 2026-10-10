function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatPenalty(seconds: number): string {
  if (seconds < 0) {
    return `−${Math.abs(seconds)} с`;
  }
  return `+${seconds} с`;
}

/** Поправка глазами команды: «+1200 с» на бегу не прочитать, а «+20 мин» — сразу */
export function formatAdjustment(seconds: number): string {
  const sign = seconds < 0 ? '−' : '+';
  const total = Math.abs(seconds);
  if (total < 60) {
    return `${sign}${total} с`;
  }
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (rest === 0) {
    return `${sign}${minutes} мин`;
  }
  return `${sign}${minutes} мин ${rest} с`;
}

/** Штрафные минуты словами: «минуту», «минуты», «минут» — по правилам русского счёта. */
export function pluralizeMinutes(minutes: number): string {
  const count = Math.abs(minutes) % 100;
  if (count >= 11 && count <= 14) {
    return 'минут';
  }
  const last = count % 10;
  if (last === 1) {
    return 'минуту';
  }
  if (last >= 2 && last <= 4) {
    return 'минуты';
  }
  return 'минут';
}

export function formatTimeOfDay(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Ответ не подошёл: штраф приписываем, только если он есть. У большинства заданий
 * неверная попытка ничего не стоит, и «+0 с к времени» команду только путает.
 */
export function toWrongAnswerMessage(message: string, penaltySecondsAdded: number): string {
  if (penaltySecondsAdded === 0) {
    return message;
  }
  return `${message}, ${formatAdjustment(penaltySecondsAdded)} к времени`;
}
