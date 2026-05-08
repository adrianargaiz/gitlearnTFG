export type NivelLeccion = 'básico' | 'intermedio' | 'avanzado' | 'experto';
export type EstadoLeccion = 'borrador' | 'publicada' | 'archivada';
export type TipoEjercicio =
  | 'opcionMultiple'
  | 'rellenarHuecos'
  | 'arrastrarSoltar'
  | 'emparejar'
  | 'construirComando'
  | 'detectarError';

export interface Leccion {
  readonly _id: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly nivel: NivelLeccion;
  readonly estado: EstadoLeccion;
  readonly autorId: string | { readonly _id: string; readonly nombre: string };
  readonly xpRecompensa: number;
  readonly orden: number;
  readonly ejerciciosCount?: number;
  readonly updatedAt?: string;
  readonly fechaCreacion?: string;
}

export interface CrearLeccionDto {
  readonly titulo: string;
  readonly descripcion: string;
  readonly nivel: NivelLeccion;
  readonly estado: EstadoLeccion;
  readonly xpRecompensa: number;
  readonly orden: number;
}

export interface Ejercicio {
  readonly _id: string;
  readonly leccionId: string;
  readonly tipo: TipoEjercicio;
  readonly enunciado: string;
  readonly opciones: readonly string[];
  readonly respuestaCorrecta: string | readonly string[];
  readonly explicacion: string;
  readonly orden: number;
}

export interface CrearEjercicioDto {
  readonly leccionId: string;
  readonly tipo: TipoEjercicio;
  readonly enunciado: string;
  readonly opciones?: string[];
  readonly respuestaCorrecta: string | string[];
  readonly explicacion?: string;
  readonly orden: number;
}

export interface EstudianteResumen {
  readonly _id: string;
  readonly nombre: string;
  readonly email: string;
}

export interface Asignacion {
  readonly _id: string;
  readonly profesorId: string;
  readonly leccionId: string | Leccion;
  readonly estudiantesIds: string[];
  readonly titulo?: string;
  readonly fechaAsignacion: string;
  readonly fechaLimite?: string;
  readonly activa: boolean;
}

export interface AsignacionConDetalle {
  readonly _id: string;
  readonly leccionId: {
    readonly _id: string;
    readonly titulo: string;
    readonly descripcion: string;
    readonly nivel: NivelLeccion;
    readonly xpRecompensa: number;
    readonly estado: EstadoLeccion;
  };
  readonly estudiantesIds: string[];
  readonly titulo?: string;
  readonly fechaAsignacion: string;
  readonly fechaLimite?: string;
  readonly activa: boolean;
  readonly completada: boolean;
}

export interface CrearAsignacionDto {
  readonly leccionId: string;
  readonly estudiantesIds: string[];
  readonly titulo?: string;
  readonly fechaLimite?: string;
}
