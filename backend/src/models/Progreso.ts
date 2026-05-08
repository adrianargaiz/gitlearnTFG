import { Schema, model, Document, Types } from 'mongoose';

export interface IProgreso extends Document {
  _id: Types.ObjectId;
  usuarioId: Types.ObjectId;
  leccionId: Types.ObjectId;
  completada: boolean;
  fechaCompletado?: Date;
  xpObtenido: number;
  intentos: number;
}

const progresoSchema = new Schema<IProgreso>(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    leccionId: {
      type: Schema.Types.ObjectId,
      ref: 'Leccion',
      required: true,
    },
    completada: {
      type: Boolean,
      default: false,
    },
    fechaCompletado: {
      type: Date,
    },
    xpObtenido: {
      type: Number,
      default: 0,
      min: 0,
    },
    intentos: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Unique constraint: one progress record per user per lesson
progresoSchema.index({ usuarioId: 1, leccionId: 1 }, { unique: true });
progresoSchema.index({ usuarioId: 1 });

export const Progreso = model<IProgreso>('Progreso', progresoSchema);
