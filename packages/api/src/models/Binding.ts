import { Location } from '@quest/shared';
import { Schema, model, type HydratedDocument } from 'mongoose';

export const BINDING_CODE_PATTERN = /^[a-zA-Z0-9]{8}$/;

/** Код на двери: говорит, в какой аудитории какого корпуса стоит команда. */
interface Binding {
  code: string;
  roomNumber: string;
  /** Как аудитория записана у организаторов («107 (Б14)»); пусто — совпадает с номером */
  roomTitle: string;
  location: Location;
}

export interface BindingDocument extends HydratedDocument<Binding> {}

const bindingSchema = new Schema<Binding>(
  {
    code: { type: String, required: true, unique: true, match: BINDING_CODE_PATTERN },
    roomNumber: { type: String, required: true },
    roomTitle: { type: String, default: '' },
    location: { type: String, required: true, enum: Object.values(Location) },
  },
  { timestamps: false },
);

export const BindingModel = model<Binding>('Binding', bindingSchema, 'bindings');
