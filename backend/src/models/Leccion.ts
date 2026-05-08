import { Schema, model, Document, Types } from 'mongoose';
import { LessonLevel, LessonStatus } from '../types';

export interface ILeccion extends Document {
  _id: Types.ObjectId;
  titulo: string;
  descripcion: string;
  nivel: LessonLevel;
  estado: LessonStatus;
  autorId: Types.ObjectId;
  fechaCreacion: Date;
  xpRecompensa: number;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

const leccionSchema = new Schema<ILeccion>(
  {
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio.'],
      trim: true,
      maxlength: [200, 'El título no puede superar los 200 caracteres.'],
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria.'],
      trim: true,
      maxlength: [1000, 'La descripción no puede superar los 1000 caracteres.'],
    },
    nivel: {
      type: String,
      enum: ['básico', 'intermedio', 'avanzado', 'experto'],
      required: [true, 'El nivel es obligatorio.'],
    },
    estado: {
      type: String,
      enum: ['borrador', 'publicada', 'archivada'],
      default: 'borrador',
    },
    autorId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El autor es obligatorio.'],
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    xpRecompensa: {
      type: Number,
      required: [true, 'La recompensa XP es obligatoria.'],
      min: [0, 'La recompensa XP no puede ser negativa.'],
      max: [500, 'La recompensa XP no puede superar 500.'],
    },
    orden: {
      type: Number,
      required: [true, 'El orden es obligatorio.'],
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

leccionSchema.index({ nivel: 1, estado: 1, orden: 1 });
leccionSchema.index({ autorId: 1 });

export const Leccion = model<ILeccion>('Leccion', leccionSchema);
