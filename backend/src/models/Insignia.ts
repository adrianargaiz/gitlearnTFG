import { Schema, model, Document, Types } from 'mongoose';

export type BadgeCondition =
  | 'primera_leccion'
  | 'racha_7'
  | 'racha_30'
  | 'nivel_basico'
  | 'nivel_intermedio'
  | 'nivel_avanzado'
  | 'nivel_experto'
  | 'todas_lecciones';

export interface IInsignia extends Document {
  _id: Types.ObjectId;
  nombre: string;
  descripcion: string;
  icono: string;
  condicion: BadgeCondition;
}

const insigniaSchema = new Schema<IInsignia>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    icono: {
      type: String,
      required: true,
    },
    condicion: {
      type: String,
      enum: [
        'primera_leccion',
        'racha_7',
        'racha_30',
        'nivel_basico',
        'nivel_intermedio',
        'nivel_avanzado',
        'nivel_experto',
        'todas_lecciones',
      ],
      required: true,
      unique: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const Insignia = model<IInsignia>('Insignia', insigniaSchema);
