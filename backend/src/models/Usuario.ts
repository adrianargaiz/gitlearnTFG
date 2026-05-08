import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../types';

export interface IUsuario extends Document {
  _id: Types.ObjectId;
  nombre: string;
  email: string;
  passwordHash: string;
  githubId?: string;
  rol: UserRole;
  fechaRegistro: Date;
  racha: number;
  ultimaActividad?: Date;
  xpTotal: number;
  insignias: Types.ObjectId[];
  activo: boolean;
}

const usuarioSchema = new Schema<IUsuario>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio.'],
      trim: true,
      maxlength: [100, 'El nombre no puede superar los 100 caracteres.'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El email no tiene un formato válido.'],
    },
    passwordHash: {
      type: String,
      default: '',
      select: false, // never returned in queries unless explicitly requested
    },
    githubId: {
      type: String,
      sparse: true,
      unique: true,
    },
    rol: {
      type: String,
      enum: ['estudiante', 'profesor', 'administrador'],
      default: 'estudiante',
    },
    fechaRegistro: {
      type: Date,
      default: Date.now,
    },
    racha: {
      type: Number,
      default: 0,
      min: 0,
    },
    ultimaActividad: {
      type: Date,
    },
    xpTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    insignias: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Insignia',
      },
    ],
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);


export const Usuario = model<IUsuario>('Usuario', usuarioSchema);
