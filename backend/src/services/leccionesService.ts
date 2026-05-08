import { Leccion, ILeccion } from '../models/Leccion';
import { LessonLevel, LessonStatus } from '../types';
import { createError } from '../middlewares/errorHandler';
import { Types } from 'mongoose';

export interface CreateLeccionDto {
  titulo: string;
  descripcion: string;
  nivel: LessonLevel;
  xpRecompensa: number;
  orden: number;
}

export interface UpdateLeccionDto extends Partial<CreateLeccionDto> {
  estado?: LessonStatus;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ejerciciosCountPipeline = [
  {
    $lookup: {
      from: 'ejercicios',
      localField: '_id',
      foreignField: 'leccionId',
      as: '_ejerciciosArr',
    },
  },
  { $addFields: { ejerciciosCount: { $size: '$_ejerciciosArr' } } },
  { $project: { _ejerciciosArr: 0 } },
];

// ── Public queries ─────────────────────────────────────────────────────────────

export async function getLeccionesPublicadas(nivel?: LessonLevel) {
  const match: Record<string, unknown> = { estado: 'publicada' };
  if (nivel) match['nivel'] = nivel;

  return Leccion.aggregate([
    { $match: match },
    { $sort: { nivel: 1, orden: 1 } },
    ...ejerciciosCountPipeline,
  ]);
}

export async function getLeccionById(id: string): Promise<ILeccion> {
  if (!Types.ObjectId.isValid(id)) {
    throw createError('ID de lección no válido.', 400);
  }

  const leccion = await Leccion.findOne({ _id: id, estado: 'publicada' }).lean<ILeccion>();
  if (!leccion) throw createError('Lección no encontrada.', 404);

  return leccion;
}

// ── Teacher operations ─────────────────────────────────────────────────────────

export async function getMisLecciones(autorId: string) {
  return Leccion.aggregate([
    { $match: { autorId: new Types.ObjectId(autorId) } },
    { $sort: { estado: 1, nivel: 1, orden: 1 } },
    ...ejerciciosCountPipeline,
  ]);
}

export async function createLeccion(
  dto: CreateLeccionDto,
  autorId: Types.ObjectId
): Promise<ILeccion> {
  const leccion = await Leccion.create({ ...dto, autorId, estado: 'borrador' });
  return leccion;
}

export async function updateLeccion(
  id: string,
  dto: UpdateLeccionDto,
  autorId: string
): Promise<ILeccion> {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de lección no válido.', 400);

  const leccion = await Leccion.findById(id);
  if (!leccion) throw createError('Lección no encontrada.', 404);

  if (leccion.autorId.toString() !== autorId) {
    throw createError('No tienes permiso para editar esta lección.', 403);
  }

  Object.assign(leccion, dto);
  await leccion.save();

  return leccion;
}

export async function deleteLeccion(id: string, autorId: string): Promise<void> {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de lección no válido.', 400);

  const leccion = await Leccion.findById(id);
  if (!leccion) throw createError('Lección no encontrada.', 404);

  if (leccion.autorId.toString() !== autorId) {
    throw createError('No tienes permiso para eliminar esta lección.', 403);
  }

  if (leccion.estado === 'publicada') {
    throw createError('No se puede eliminar una lección publicada. Archívala primero.', 409);
  }

  await leccion.deleteOne();
}

// ── Admin operations ───────────────────────────────────────────────────────────

export async function getAllLecciones() {
  return Leccion.aggregate([
    { $sort: { estado: 1, nivel: 1, orden: 1 } },
    {
      $lookup: {
        from: 'usuarios',
        localField: 'autorId',
        foreignField: '_id',
        as: '_autorArr',
        pipeline: [{ $project: { _id: 1, nombre: 1 } }],
      },
    },
    {
      $addFields: {
        autorId: { $ifNull: [{ $arrayElemAt: ['$_autorArr', 0] }, '$autorId'] },
      },
    },
    { $project: { _autorArr: 0 } },
    ...ejerciciosCountPipeline,
  ]);
}

export async function setLeccionEstado(id: string, estado: LessonStatus): Promise<ILeccion> {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de lección no válido.', 400);

  const leccion = await Leccion.findByIdAndUpdate(id, { estado }, { new: true });
  if (!leccion) throw createError('Lección no encontrada.', 404);

  return leccion;
}

// ── Teacher: change own lesson status ─────────────────────────────────────────

export async function setPropiasLeccionEstado(
  id: string,
  autorId: string,
  estado: LessonStatus
): Promise<ILeccion> {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de lección no válido.', 400);

  const leccion = await Leccion.findById(id);
  if (!leccion) throw createError('Lección no encontrada.', 404);

  if (leccion.autorId.toString() !== autorId) {
    throw createError('No tienes permiso para cambiar el estado de esta lección.', 403);
  }

  leccion.estado = estado;
  await leccion.save();

  return leccion;
}

