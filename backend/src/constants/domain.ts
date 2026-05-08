import { ExerciseType, LessonLevel, LessonStatus, UserRole } from '../types';

export const USER_ROLES = ['estudiante', 'profesor', 'administrador'] as const satisfies readonly UserRole[];

export const PUBLIC_REGISTRATION_ROLES = ['estudiante', 'profesor'] as const;

export const LESSON_LEVELS = ['básico', 'intermedio', 'avanzado', 'experto'] as const satisfies readonly LessonLevel[];

export const LESSON_STATUSES = ['borrador', 'publicada', 'archivada'] as const satisfies readonly LessonStatus[];

export const EXERCISE_TYPES = [
  'opcionMultiple',
  'rellenarHuecos',
  'arrastrarSoltar',
  'emparejar',
  'construirComando',
  'detectarError',
] as const satisfies readonly ExerciseType[];

export const EDITOR_EXERCISE_TYPES = [
  'opcionMultiple',
  'rellenarHuecos',
  'arrastrarSoltar',
] as const satisfies readonly ExerciseType[];
