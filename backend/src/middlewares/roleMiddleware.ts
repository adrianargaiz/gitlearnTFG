import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

type Role = 'estudiante' | 'profesor' | 'administrador';

/**
 * Middleware factory that restricts a route to the specified roles.
 * Must be used AFTER authMiddleware.
 *
 * @example
 * router.post('/lecciones', authMiddleware, roleMiddleware('profesor'), createLesson);
 */
export function roleMiddleware(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('No autenticado.', 401));
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return next(createError('No tienes permiso para realizar esta acción.', 403));
    }

    next();
  };
}
