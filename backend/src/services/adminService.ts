import { Usuario } from '../models/Usuario';
import { UserRole } from '../types';
import { createError } from '../middlewares/errorHandler';
import { Types } from 'mongoose';

export async function getAllUsuarios() {
  return Usuario.find()
    .select('-passwordHash')
    .sort({ fechaRegistro: -1 })
    .lean();
}

export async function setUsuarioRol(id: string, rol: UserRole) {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de usuario no válido.', 400);

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { rol },
    { new: true }
  ).select('-passwordHash');

  if (!usuario) throw createError('Usuario no encontrado.', 404);
  return usuario;
}

export async function setUsuarioEstado(id: string, activo: boolean) {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de usuario no válido.', 400);

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { activo },
    { new: true }
  ).select('-passwordHash');

  if (!usuario) throw createError('Usuario no encontrado.', 404);
  return usuario;
}
