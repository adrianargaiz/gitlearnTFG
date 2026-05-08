export type UserRole = 'estudiante' | 'profesor' | 'administrador';

export interface User {
  readonly _id: string;
  readonly nombre: string;
  readonly email: string;
  readonly rol: UserRole;
  readonly xpTotal: number;
  readonly racha: number;
  readonly activo: boolean;
}

export interface AuthResponse {
  readonly token: string;
  readonly user: User;
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface RegisterCredentials {
  readonly nombre: string;
  readonly email: string;
  readonly password: string;
  readonly rol: Extract<UserRole, 'estudiante' | 'profesor'>;
}
