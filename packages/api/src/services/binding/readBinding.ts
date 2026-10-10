import { BindingModel, type BindingDocument } from '../../models/Binding.js';

/** Аудитория и корпус по коду на двери; null, если такого кода нет. */
export async function readBinding(code: string): Promise<BindingDocument | null> {
  return BindingModel.findOne({ code: code.trim() });
}
