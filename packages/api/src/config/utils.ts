export function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

/** Пустая или пробельная строка считается отсутствием значения и заменяется на `fallback`. */
export function readEnv(name: string, fallback: string): string;
export function readEnv(name: string, fallback: null): string | null;
export function readEnv(name: string, fallback: string | null): string | null {
  const value = process.env[name]?.trim();
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

export function readPortEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`${name} must be a positive integer, got "${raw}"`);
  }
  return port;
}
