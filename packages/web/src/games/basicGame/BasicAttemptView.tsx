import { type ReactNode } from 'react';
import { type AttemptViewProps } from '../types.js';

function readText(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const text = (payload as { text?: unknown }).text;
  if (typeof text !== 'string') {
    return null;
  }
  return text;
}

/** Ответ команды в текстовой игре: просто введённая строка. */
export function BasicAttemptView({ payload }: AttemptViewProps): ReactNode {
  const text = readText(payload);
  if (text === null) {
    return <span className="muted">ответ не распознан</span>;
  }
  return <span>«{text}»</span>;
}
