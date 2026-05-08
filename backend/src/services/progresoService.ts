import { Progreso } from '../models/Progreso';
import { Leccion } from '../models/Leccion';
import { Usuario, IUsuario } from '../models/Usuario';
import { IInsignia } from '../models/Insignia';
import { createError } from '../middlewares/errorHandler';
import { evaluateAndAwardBadges } from './insigniasService';
import { Types } from 'mongoose';

export interface ProgresoResult {
  xpGanado: number;
  rachaActual: number;
  insigniasNuevas: IInsignia[];
  yaCompletada: boolean;
  aciertos: number;
  total: number;
}

export async function getProgresoByUsuario(usuarioId: string, requesterId: string, requesterRol: string) {
  if (!Types.ObjectId.isValid(usuarioId)) {
    throw createError('ID de usuario no válido.', 400);
  }

  // Users can only see their own progress; admins can see anyone's
  if (usuarioId !== requesterId && requesterRol !== 'administrador') {
    throw createError('No tienes permiso para ver este progreso.', 403);
  }

  return Progreso.find({ usuarioId })
    .sort({ fechaCompletado: -1 })
    .lean();
}

export async function registrarLeccionCompletada(
  usuarioId: string,
  leccionId: string,
  aciertos: number,
  total: number
): Promise<ProgresoResult> {
  if (!Types.ObjectId.isValid(leccionId)) {
    throw createError('ID de lección no válido.', 400);
  }
  if (!Number.isInteger(aciertos) || aciertos < 0) {
    throw createError('Aciertos inválidos.', 400);
  }
  if (!Number.isInteger(total) || total < 1) {
    throw createError('Total inválido.', 400);
  }
  if (aciertos > total) {
    throw createError('Aciertos no puede superar al total.', 400);
  }

  const [leccion, usuario] = await Promise.all([
    Leccion.findOne({ _id: leccionId, estado: 'publicada' }).lean(),
    Usuario.findById(usuarioId),
  ]);

  if (!leccion) throw createError('Lección no encontrada o no publicada.', 404);
  if (!usuario) throw createError('Usuario no encontrado.', 404);

  // Check if already completed (idempotent)
  const existing = await Progreso.findOne({ usuarioId, leccionId });
  if (existing?.completada) {
    return {
      xpGanado: 0,
      rachaActual: usuario.racha,
      insigniasNuevas: [],
      yaCompletada: true,
      aciertos,
      total,
    };
  }

  // XP proporcional: 0/N → 0 XP, N/N → xpRecompensa, intermedios redondeados hacia abajo
  const xpGanado = Math.floor(leccion.xpRecompensa * (aciertos / total));

  // Upsert progress record
  await Progreso.findOneAndUpdate(
    { usuarioId, leccionId },
    {
      completada: true,
      fechaCompletado: new Date(),
      xpObtenido: xpGanado,
      $inc: { intentos: 1 },
    },
    { upsert: true, new: true }
  );

  // Update XP and streak on the user
  const rachaActual = calcularRacha(usuario);
  await Usuario.findByIdAndUpdate(usuarioId, {
    $inc: { xpTotal: xpGanado },
    racha: rachaActual,
    ultimaActividad: new Date(),
  });

  // Evaluate badges with updated streak
  const insigniasNuevas = await evaluateAndAwardBadges(
    new Types.ObjectId(usuarioId),
    rachaActual
  );

  return { xpGanado, rachaActual, insigniasNuevas, yaCompletada: false, aciertos, total };
}

// ── Streak calculation ─────────────────────────────────────────────────────────

function calcularRacha(usuario: IUsuario): number {
  const hoy = startOfDay(new Date());

  if (!usuario.ultimaActividad) {
    return 1;
  }

  const ultimaActividad = startOfDay(new Date(usuario.ultimaActividad));
  const diffDays = Math.round((hoy.getTime() - ultimaActividad.getTime()) / 86_400_000);

  if (diffDays === 0) {
    // Already active today — streak unchanged
    return usuario.racha;
  }

  if (diffDays === 1) {
    // Consecutive day — increment streak
    return usuario.racha + 1;
  }

  // Missed one or more days — reset
  return 1;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
