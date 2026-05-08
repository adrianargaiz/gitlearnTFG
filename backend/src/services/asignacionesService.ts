import { Types } from 'mongoose';
import { Asignacion, IAsignacion } from '../models/Asignacion';
import { Leccion } from '../models/Leccion';
import { Progreso } from '../models/Progreso';
import { Usuario } from '../models/Usuario';
import { createError } from '../middlewares/errorHandler';

export interface CreateAsignacionDto {
  leccionId: string;
  estudiantesIds: string[];
  titulo?: string;
  fechaLimite?: string;
}

export interface EstudianteResumen {
  _id: string;
  nombre: string;
  email: string;
}

export interface AsignacionConDetalle {
  _id: string;
  leccionId: {
    _id: string;
    titulo: string;
    descripcion: string;
    nivel: string;
    xpRecompensa: number;
    estado: string;
  };
  estudiantesIds: string[];
  titulo?: string;
  fechaAsignacion: Date;
  fechaLimite?: Date;
  activa: boolean;
  completada: boolean;
}

export async function getEstudiantesActivos(): Promise<EstudianteResumen[]> {
  return Usuario.find({ rol: 'estudiante', activo: true })
    .select('_id nombre email')
    .sort({ nombre: 1 })
    .lean<EstudianteResumen[]>();
}

export async function createAsignacion(
  dto: CreateAsignacionDto,
  profesorId: string
): Promise<IAsignacion> {
  if (!Types.ObjectId.isValid(dto.leccionId)) {
    throw createError('ID de lección no válido.', 400);
  }

  const leccion = await Leccion.findById(dto.leccionId);
  if (!leccion) throw createError('Lección no encontrada.', 404);

  if (leccion.autorId.toString() !== profesorId) {
    throw createError('Solo puedes asignar tus propias lecciones.', 403);
  }

  for (const id of dto.estudiantesIds) {
    if (!Types.ObjectId.isValid(id)) throw createError(`ID de estudiante no válido: ${id}`, 400);
  }

  const asignacion = await Asignacion.create({
    profesorId: new Types.ObjectId(profesorId),
    leccionId: new Types.ObjectId(dto.leccionId),
    estudiantesIds: dto.estudiantesIds.map((id) => new Types.ObjectId(id)),
    titulo: dto.titulo?.trim() || undefined,
    fechaLimite: dto.fechaLimite ? new Date(dto.fechaLimite) : undefined,
  });

  return asignacion;
}

export async function getAsignacionesByEstudiante(
  estudianteId: string
): Promise<AsignacionConDetalle[]> {
  if (!Types.ObjectId.isValid(estudianteId)) {
    throw createError('ID de estudiante no válido.', 400);
  }

  const asignaciones = await Asignacion.find({
    estudiantesIds: new Types.ObjectId(estudianteId),
    activa: true,
  })
    .populate('leccionId', 'titulo descripcion nivel xpRecompensa estado')
    .sort({ fechaAsignacion: -1 })
    .lean();

  const leccionIds = asignaciones
    .map((a) => (a.leccionId as unknown as { _id: Types.ObjectId })._id)
    .filter(Boolean);

  const progresos = await Progreso.find({
    usuarioId: new Types.ObjectId(estudianteId),
    leccionId: { $in: leccionIds },
    completada: true,
  })
    .select('leccionId')
    .lean();

  const completadasSet = new Set(progresos.map((p) => p.leccionId.toString()));

  return asignaciones.map((a) => {
    const leccion = a.leccionId as unknown as AsignacionConDetalle['leccionId'];
    return {
      _id: a._id.toString(),
      leccionId: leccion,
      estudiantesIds: a.estudiantesIds.map((id) => id.toString()),
      titulo: a.titulo,
      fechaAsignacion: a.fechaAsignacion,
      fechaLimite: a.fechaLimite,
      activa: a.activa,
      completada: completadasSet.has(leccion._id.toString()),
    };
  });
}

export async function getAsignacionesByProfesor(profesorId: string) {
  if (!Types.ObjectId.isValid(profesorId)) {
    throw createError('ID de profesor no válido.', 400);
  }

  return Asignacion.find({ profesorId: new Types.ObjectId(profesorId) })
    .populate('leccionId', 'titulo nivel estado')
    .populate('estudiantesIds', 'nombre email')
    .sort({ fechaAsignacion: -1 })
    .lean();
}

export async function getAsignacionesByLeccion(leccionId: string, profesorId: string) {
  if (!Types.ObjectId.isValid(leccionId)) {
    throw createError('ID de lección no válido.', 400);
  }

  return Asignacion.find({
    leccionId: new Types.ObjectId(leccionId),
    profesorId: new Types.ObjectId(profesorId),
  })
    .sort({ fechaAsignacion: -1 })
    .lean();
}

export async function deleteAsignacion(id: string, profesorId: string): Promise<void> {
  if (!Types.ObjectId.isValid(id)) throw createError('ID de asignación no válido.', 400);

  const asignacion = await Asignacion.findById(id);
  if (!asignacion) throw createError('Asignación no encontrada.', 404);

  if (asignacion.profesorId.toString() !== profesorId) {
    throw createError('No tienes permiso para eliminar esta asignación.', 403);
  }

  await asignacion.deleteOne();
}

export async function countPendientesEstudiante(estudianteId: string): Promise<number> {
  if (!Types.ObjectId.isValid(estudianteId)) return 0;

  const asignaciones = await Asignacion.find({
    estudiantesIds: new Types.ObjectId(estudianteId),
    activa: true,
  })
    .select('leccionId')
    .lean();

  const leccionIds = asignaciones.map((a) => a.leccionId);

  const completadas = await Progreso.countDocuments({
    usuarioId: new Types.ObjectId(estudianteId),
    leccionId: { $in: leccionIds },
    completada: true,
  });

  return asignaciones.length - completadas;
}
