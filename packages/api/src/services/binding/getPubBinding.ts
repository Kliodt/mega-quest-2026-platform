import { type PubBindingDto } from '@quest/shared';
import { toPubBindingDto } from '../../utils/binding/toPubBindingDto.js';
import { BindingNotFoundError } from '../../utils/errors/index.js';
import { readBinding } from './readBinding.js';

/** Какая аудитория за кодом на двери; неизвестный код — ошибка. */
export async function getPubBinding(code: string): Promise<PubBindingDto> {
  const binding = await readBinding(code);
  if (!binding) {
    throw new BindingNotFoundError(code);
  }
  return toPubBindingDto(code, binding);
}
