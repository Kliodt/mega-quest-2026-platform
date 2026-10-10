import { type RoomNumberDto } from '@quest/shared';
import { MOCK_CODE } from '../../config/env.js';
import { WrongCodeError } from '../../utils/errors/index.js';
import { readBinding } from './readBinding.js';

/** Номер аудитории по её коду; тестовый код возвращается как есть. */
export async function readRoomNumber(code: string): Promise<RoomNumberDto> {
  const trimmed = code.trim();
  if (MOCK_CODE !== null && trimmed === MOCK_CODE) {
    return { roomNumber: trimmed };
  }
  const binding = await readBinding(trimmed);
  if (!binding) {
    throw new WrongCodeError();
  }
  return { roomNumber: binding.roomNumber };
}
