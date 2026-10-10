import { type AdminBindingsDto } from '@quest/shared';
import { BindingModel } from '../../models/Binding.js';
import { BindingNotFoundError } from '../../utils/errors/index.js';
import { getAdminBindings } from './getAdminBindings.js';

/** Убирает код: аудитория остаётся, но открыть её будет нечем. */
export async function deleteBinding(code: string): Promise<AdminBindingsDto> {
  const { deletedCount } = await BindingModel.deleteOne({ code });
  if (deletedCount === 0) {
    throw new BindingNotFoundError(code);
  }
  return getAdminBindings();
}
