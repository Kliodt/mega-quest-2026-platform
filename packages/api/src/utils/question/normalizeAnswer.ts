/** Нормализация текстового ответа: trim, схлопывание пробелов, нижний регистр. */
export function normalizeAnswer(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}
