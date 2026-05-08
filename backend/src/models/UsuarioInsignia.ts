import { Schema, model, Document, Types } from 'mongoose';

export interface IUsuarioInsignia extends Document {
  _id: Types.ObjectId;
  usuarioId: Types.ObjectId;
  insigniaId: Types.ObjectId;
  fechaObtencion: Date;
}

const usuarioInsigniaSchema = new Schema<IUsuarioInsignia>(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    insigniaId: {
      type: Schema.Types.ObjectId,
      ref: 'Insignia',
      required: true,
    },
    fechaObtencion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

usuarioInsigniaSchema.index({ usuarioId: 1, insigniaId: 1 }, { unique: true });
usuarioInsigniaSchema.index({ usuarioId: 1 });

export const UsuarioInsignia = model<IUsuarioInsignia>('UsuarioInsignia', usuarioInsigniaSchema);
