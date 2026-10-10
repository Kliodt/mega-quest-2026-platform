import { Location } from '@quest/shared';
import { Schema, model, type HydratedDocument } from 'mongoose';

/**
 * Что организаторы говорят команде на пути в этот корпус: как дойти, куда заходить.
 * Дорога зависит от обоих концов, поэтому текст подписан парой: `from` — корпус позади,
 * `null` в нём значит «любой переход в этот корпус», в том числе самый первый.
 */
interface LocationNote {
  from: Location | null;
  location: Location;
  html: string;
}

export interface LocationNoteDocument extends HydratedDocument<LocationNote> {}

const locationNoteSchema = new Schema<LocationNote>(
  {
    from: { type: String, default: null, enum: [...Object.values(Location), null] },
    location: { type: String, required: true, enum: Object.values(Location) },
    html: { type: String, required: true },
  },
  { timestamps: false },
);

locationNoteSchema.index({ from: 1, location: 1 }, { unique: true });

export const LocationNoteModel = model<LocationNote>(
  'LocationNote',
  locationNoteSchema,
  'locationNotes',
);
