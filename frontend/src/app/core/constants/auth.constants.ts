import { UserRole } from '../models/auth.model';

export const AUTH_TOKEN_STORAGE_KEY = 'gl_token';
export const AUTH_USER_STORAGE_KEY = 'gl_user';

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  estudiante: '/app/dashboard',
  profesor: '/profesor/dashboard',
  administrador: '/admin/dashboard',
};
