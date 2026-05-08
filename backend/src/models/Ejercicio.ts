import { Schema, model, Document, Types } from 'mongoose';
import { ExerciseType } from '../types';

export interface IEjercicio extends Document {
  _id: Types.ObjectId;
  leccionId: Types.ObjectId;
  tipo: ExerciseType;
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: string | string[];
  explicacion: string;
  orden: number;
}

const ejercicioSchema = new Schema<IEjercicio>(
  {
    leccionId: {
      type: Schema.Types.ObjectId,
      ref: 'Leccion',
      required: [true, 'La lección es obligatoria.'],
    },
    tipo: {
      type: String,
      enum: ['opcionMultiple', 'rellenarHuecos', 'arrastrarSoltar', 'emparejar', 'construirComando', 'detectarError'],
      required: [true, 'El tipo de ejercicio es obligatorio.'],
    },
    enunciado: {
      type: String,
      required: [true, 'El enunciado es obligatorio.'],
      trim: true,
      maxlength: [2000, 'El enunciado no puede superar los 2000 caracteres.'],
    },
    opciones: {
      type: [String],
      default: [],
    },
    // Mixed type to support both string and string[]
    respuestaCorrecta: {
      type: Schema.Types.Mixed,
      required: [true, 'La respuesta correcta es obligatoria.'],
    },
    explicacion: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'La explicación no puede superar los 1000 caracteres.'],
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

ejercicioSchema.index({ leccionId: 1, orden: 1 });

export const Ejercicio = model<IEjercicio>('Ejercicio', ejercicioSchema);
