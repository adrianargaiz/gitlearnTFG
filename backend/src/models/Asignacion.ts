import { Schema, model, Document, Types } from 'mongoose';

export interface IAsignacion extends Document {
  _id: Types.ObjectId;
  profesorId: Types.ObjectId;
  leccionId: Types.ObjectId;
  estudiantesIds: Types.ObjectId[];
  titulo?: string;
  fechaAsignacion: Date;
  fechaLimite?: Date;
  activa: boolean;
}

const asignacionSchema = new Schema<IAsignacion>(
  {
    profesorId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El profesor es obligatorio.'],
    },
    leccionId: {
      type: Schema.Types.ObjectId,
      ref: 'Leccion',
      required: [true, 'La lección es obligatoria.'],
    },
    estudiantesIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Usuario',
      default: [],
    },
    titulo: {
      type: String,
      trim: true,
      maxlength: [200, 'El título no puede superar los 200 caracteres.'],
    },
    fechaAsignacion: {
      type: Date,
      default: () => new Date(),
    },
    fechaLimite: {
      type: Date,
    },
    activa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

asignacionSchema.index({ profesorId: 1 });
asignacionSchema.index({ estudiantesIds: 1 });
asignacionSchema.index({ leccionId: 1, profesorId: 1 });

export const Asignacion = model<IAsignacion>('Asignacion', asignacionSchema);
