import { Insignia } from './badge.model';

export interface Progreso {
  readonly _id: string;
  readonly usuarioId: string;
  readonly leccionId: string;
  readonly completada: boolean;
  readonly fechaCompletado?: string;
  readonly xpObtenido: number;
  readonly intentos: number;
}

export interface CompletarProgresoResult {
  readonly xpGanado: number;
  readonly rachaActual: number;
  readonly insigniasNuevas: Insignia[];
  readonly yaCompletada: boolean;
  readonly aciertos: number;
  readonly total: number;
}
