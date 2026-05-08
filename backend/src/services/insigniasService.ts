import { Insignia, IInsignia, BadgeCondition } from '../models/Insignia';
import { UsuarioInsignia } from '../models/UsuarioInsignia';
import { Progreso } from '../models/Progreso';
import { Leccion } from '../models/Leccion';
import { Usuario } from '../models/Usuario';
import { Types } from 'mongoose';
import { LessonLevel } from '../types';

export async function getAllInsignias(): Promise<IInsignia[]> {
  return Insignia.find().lean<IInsignia[]>();
}

export async function getInsigniasByUsuario(usuarioId: string): Promise<IInsignia[]> {
  const records = await UsuarioInsignia.find({ usuarioId })
    .populate<{ insigniaId: IInsignia }>('insigniaId')
    .lean();

  return records.map((r) => r.insigniaId as IInsignia);
}

/**
 * Evaluates all badge conditions for a user after a lesson completion.
 * Returns only the badges that were newly awarded in this call.
 */
export async function evaluateAndAwardBadges(
  usuarioId: Types.ObjectId,
  rachaActual: number
): Promise<IInsignia[]> {
  const [allInsignias, alreadyOwned, completedProgresos] = await Promise.all([
    Insignia.find().lean<IInsignia[]>(),
    UsuarioInsignia.find({ usuarioId }).lean(),
    Progreso.find({ usuarioId, completada: true }).lean(),
  ]);

  const ownedIds = new Set(alreadyOwned.map((ui) => ui.insigniaId.toString()));
  const completedLeccionIds = new Set(completedProgresos.map((p) => p.leccionId.toString()));

  const publishedLecciones = await Leccion.find({ estado: 'publicada' })
    .select('_id nivel')
    .lean<Array<{ _id: Types.ObjectId; nivel: LessonLevel }>>();

  const newlyAwarded: IInsignia[] = [];

  for (const insignia of allInsignias) {
    if (ownedIds.has(insignia._id.toString())) continue;

    const earned = checkCondition(
      insignia.condicion,
      completedLeccionIds,
      publishedLecciones,
      rachaActual
    );

    if (earned) {
      await UsuarioInsignia.create({ usuarioId, insigniaId: insignia._id });
      await Usuario.updateOne({ _id: usuarioId }, { $push: { insignias: insignia._id } });
      newlyAwarded.push(insignia);
    }
  }

  return newlyAwarded;
}

// ── Condition evaluators ───────────────────────────────────────────────────────

function checkCondition(
  condicion: BadgeCondition,
  completedIds: Set<string>,
  publishedLecciones: Array<{ _id: Types.ObjectId; nivel: LessonLevel }>,
  rachaActual: number
): boolean {
  switch (condicion) {
    case 'primera_leccion':
      return completedIds.size >= 1;
    case 'racha_7':
      return rachaActual >= 7;
    case 'racha_30':
      return rachaActual >= 30;
    case 'nivel_basico':
      return levelCompleted('básico', completedIds, publishedLecciones);
    case 'nivel_intermedio':
      return levelCompleted('intermedio', completedIds, publishedLecciones);
    case 'nivel_avanzado':
      return levelCompleted('avanzado', completedIds, publishedLecciones);
    case 'nivel_experto':
      return levelCompleted('experto', completedIds, publishedLecciones);
    case 'todas_lecciones':
      return publishedLecciones.every((l) => completedIds.has(l._id.toString()));
    default:
      return false;
  }
}

function levelCompleted(
  nivel: LessonLevel,
  completedIds: Set<string>,
  publishedLecciones: Array<{ _id: Types.ObjectId; nivel: LessonLevel }>
): boolean {
  const inLevel = publishedLecciones.filter((l) => l.nivel === nivel);
  if (inLevel.length === 0) return false;
  return inLevel.every((l) => completedIds.has(l._id.toString()));
}
