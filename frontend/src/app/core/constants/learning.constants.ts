import { EstadoLeccion, NivelLeccion } from '../models/learning.model';

export const LESSON_LEVEL_ORDER: readonly NivelLeccion[] = [
  'básico',
  'intermedio',
  'avanzado',
  'experto',
];

export const LESSON_LEVEL_COLOR: Record<string, string> = {
  básico: '#3B82F6',
  intermedio: '#7C3AED',
  avanzado: '#F97316',
  experto: '#D29922',
};

export const LESSON_STATUS_LABEL: Record<EstadoLeccion, string> = {
  publicada: 'Publicada',
  borrador: 'Borrador',
  archivada: 'Archivada',
};

export const LESSON_STATUS_BADGE_CLASS: Record<EstadoLeccion, string> = {
  publicada: 'gl-badge-green',
  borrador: 'gl-badge-amber',
  archivada: 'gl-badge-grey',
};

const FALLBACK_BADGE_COLOR = '#94A3B8';
const FALLBACK_BADGE_ICON = 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';

export const BADGE_COLOR: Record<string, string> = {
  primera_leccion:  '#2ECC71',
  nivel_basico:     '#3B82F6',
  nivel_intermedio: '#7C3AED',
  nivel_avanzado:   '#F97316',
  nivel_experto:    '#D29922',
  racha_7:          '#EF4444',
  racha_30:         '#EC4899',
  todas_lecciones:  '#06B6D4',
};

export const BADGE_ICON_PATH: Record<string, string> = {
  primera_leccion:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  nivel_basico:     'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  nivel_intermedio: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a9 9 0 0 0 9-9',
  nivel_avanzado:   'M18 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM18 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6 9v6M9 18h6',
  nivel_experto:    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  racha_7:          'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  racha_30:         'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  todas_lecciones:  'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z',
};

export function badgeColor(condicion: string): string {
  return BADGE_COLOR[condicion] ?? FALLBACK_BADGE_COLOR;
}

export function badgeIconPath(condicion: string): string {
  return BADGE_ICON_PATH[condicion] ?? FALLBACK_BADGE_ICON;
}
