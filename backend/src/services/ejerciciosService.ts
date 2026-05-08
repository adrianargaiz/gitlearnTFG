import { Ejercicio, IEjercicio } from '../models/Ejercicio';
import { Leccion } from '../models/Leccion';
import { ExerciseType } from '../types';
import { createError } from '../middlewares/errorHandler';
import { Types } from 'mongoose';

export interface CreateEjercicioDto {
  leccionId: string;
  tipo: ExerciseType;
  enunciado: string;
  opciones: string[];
  respuestaCorrecta: string | string[];
  explicacion: string;
  orden: number;
}

export interface UpdateEjercicioDto extends Partial<Omit<CreateEjercicioDto, 'leccionId'>> {}

interface PopulatedLeccionRef {
  autorId: Types.ObjectId;
}

export async function getEjerciciosByLeccion(leccionId: string): Promise<IEjercicio[]> {
  if (!Types.ObjectId.isValid(leccionId)) {
    throw createError('ID de lección no válido.', 400);
  }

  return Ejercicio.find({ leccionId }).sort({ orden: 1 }).lean<IEjercicio[]>();
}

export async function createEjercicio(
  dto: CreateEjercicioDto,
  autorId: string
): Promise<IEjercicio> {
  if (!Types.ObjectId.isValid(dto.leccionId)) {
    throw createError('ID de lección no válido.', 400);
  }

  const leccion = await Leccion.findById(dto.leccionId);
  if (!leccion) throw createError('Lección no encontrada.', 404);

  if (leccion.autorId.toString() !== autorId) {
    throw createError('No tienes permiso para añadir ejercicios a esta lección.', 403);
  }

  const ejercicio = await Ejercicio.create(dto);
  return ejercicio;
}

export async function updateEjercicio(
  id: string,
  dto: UpdateEjercicioDto,
  autorId: string
): Promise<IEjercicio> {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de ejercicio no válido.', 400);

  const ejercicio = await Ejercicio.findById(id).populate<{ leccionId: PopulatedLeccionRef }>(
    'leccionId',
    'autorId'
  );

  if (!ejercicio) throw createError('Ejercicio no encontrado.', 404);

  if (ejercicio.leccionId.autorId.toString() !== autorId) {
    throw createError('No tienes permiso para editar este ejercicio.', 403);
  }

  // Re-assign primitive fields only (leccionId stays populated, not reassigned)
  if (dto.tipo !== undefined) ejercicio.tipo = dto.tipo;
  if (dto.enunciado !== undefined) ejercicio.enunciado = dto.enunciado;
  if (dto.opciones !== undefined) ejercicio.opciones = dto.opciones;
  if (dto.respuestaCorrecta !== undefined) ejercicio.respuestaCorrecta = dto.respuestaCorrecta;
  if (dto.explicacion !== undefined) ejercicio.explicacion = dto.explicacion;
  if (dto.orden !== undefined) ejercicio.orden = dto.orden;

  await ejercicio.save();

  // Return a fresh lean document with correct leccionId type
  const updated = await Ejercicio.findById(ejercicio._id).lean<IEjercicio>();
  if (!updated) throw createError('Error al obtener el ejercicio actualizado.', 500);

  return updated;
}

export async function deleteEjercicio(id: string, autorId: string): Promise<void> {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de ejercicio no válido.', 400);

  const ejercicio = await Ejercicio.findById(id).populate<{ leccionId: PopulatedLeccionRef }>(
    'leccionId',
    'autorId'
  );

  if (!ejercicio) throw createError('Ejercicio no encontrado.', 404);

  if (ejercicio.leccionId.autorId.toString() !== autorId) {
    throw createError('No tienes permiso para eliminar este ejercicio.', 403);
  }

  await ejercicio.deleteOne();
}
