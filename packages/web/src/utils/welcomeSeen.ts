const WELCOME_STORAGE_KEY = 'quest.welcome';

/**
 * Приветствие показывается один раз на устройство: после первого кода команда идёт
 * по заданиям, и видеть его снова ей незачем. Хранилище может быть недоступно —
 * тогда приветствие просто покажется ещё раз.
 */
export function isWelcomeSeen(teamId: string): boolean {
  try {
    return window.localStorage.getItem(WELCOME_STORAGE_KEY) === teamId;
  } catch {
    return false;
  }
}

export function setWelcomeSeen(teamId: string): void {
  try {
    window.localStorage.setItem(WELCOME_STORAGE_KEY, teamId);
  } catch {
    // Приватный режим: приветствие покажется снова, и ничего страшного
  }
}
