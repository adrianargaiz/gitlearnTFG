import { UserRole } from './auth.model';
import { EstadoLeccion, NivelLeccion } from './learning.model';

export interface AdminUser {
  readonly _id: string;
  readonly nombre: string;
  readonly email: string;
  readonly rol: UserRole;
  readonly activo: boolean;
  readonly fechaRegistro: string;
  readonly xpTotal: number;
  readonly racha?: number;
}

export interface AdminLeccion {
  readonly _id: string;
  readonly titulo: string;
  readonly descripcion?: string;
  readonly nivel: NivelLeccion;
  readonly estado: EstadoLeccion;
  readonly autorId: string | { readonly _id: string; readonly nombre: string };
  readonly xpRecompensa: number;
  readonly orden: number;
  readonly ejerciciosCount?: number;
  readonly updatedAt?: string;
}
