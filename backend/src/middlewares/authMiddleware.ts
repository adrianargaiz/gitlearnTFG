import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';

export interface JwtPayload {
  readonly userId: string;
  readonly rol: 'estudiante' | 'profesor' | 'administrador';
  readonly email: string;
}

// Augment Express.User so Passport and our JWT middleware share the same type
declare global {
  namespace Express {
    interface User extends JwtPayload {}
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError('Token de autenticación no proporcionado.', 401));
  }

  const token = authHeader.slice(7);
  const secret = process.env['JWT_SECRET'];

  if (!secret) {
    return next(createError('Configuración de servidor incorrecta.', 500));
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(createError('Token inválido o expirado.', 401));
  }
}
