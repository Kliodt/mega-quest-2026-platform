import { type AdminBindingsDto, type AdminSaveBindingRequestDto } from '@quest/shared';
import { BindingModel } from '../../models/Binding.js';
import { readRoomNumber } from '../../utils/csv/readRoomNumber.js';
import { BindingRoomInvalidError } from '../../utils/errors/index.js';
import { getAdminBindings } from './getAdminBindings.js';

/**
 * Заводит код или переносит его в другую аудиторию. Второй код на ту же дверь разрешён:
 * скан любого из них открывает эту аудиторию, а организаторам иногда нужно повесить
 * запасной листок. Аудиторию пишут как в таблице — «107 (Б14)»: номер идёт в маршруты
 * и вопросы, а запись целиком остаётся для страниц с кодами.
 */
export async function saveBinding(body: AdminSaveBindingRequestDto): Promise<AdminBindingsDto> {
  const { code, location } = body;
  const roomTitle = body.roomNumber.trim();
  const roomNumber = readRoomNumber(roomTitle);
  if (roomNumber === '') {
    throw new BindingRoomInvalidError(roomTitle);
  }

  await BindingModel.updateOne(
    { code },
    { code, location, roomNumber, roomTitle },
    { upsert: true, runValidators: true },
  );
  return getAdminBindings();
}
