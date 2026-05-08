import { Types } from 'mongoose';

// ── Shared domain types ────────────────────────────────────────────────────────

export type UserRole = 'estudiante' | 'profesor' | 'administrador';
export type LessonLevel = 'básico' | 'intermedio' | 'avanzado' | 'experto';
export type LessonStatus = 'borrador' | 'publicada' | 'archivada';
export type ExerciseType =
  | 'opcionMultiple'
  | 'rellenarHuecos'
  | 'arrastrarSoltar'
  | 'emparejar'
  | 'construirComando'
  | 'detectarError';

// ── Safe user shape returned in API responses (no passwordHash) ───────────────
export interface UserPublic {
  readonly _id: Types.ObjectId;
  readonly nombre: string;
  readonly email: string;
  readonly rol: UserRole;
  readonly xpTotal: number;
  readonly racha: number;
  readonly insignias: Types.ObjectId[];
  readonly activo: boolean;
  readonly fechaRegistro: Date;
}
