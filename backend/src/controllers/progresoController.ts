import { NextFunction, Request, Response } from 'express';
import { createError } from '../middlewares/errorHandler';
import { getProgresoByUsuario, registrarLeccionCompletada } from '../services/progresoService';

export async function obtenerProgreso(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const progreso = await getProgresoByUsuario(
      req.params.usuarioId ?? '',
      req.user.userId,
      req.user.rol
    );

    res.json(progreso);
  } catch (err) {
    next(err);
  }
}

export async function completarLeccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const { leccionId, aciertos, total } = req.body as {
      leccionId: string;
      aciertos: number;
      total: number;
    };
    const result = await registrarLeccionCompletada(req.user.userId, leccionId, aciertos, total);

    res.json(result);
  } catch (err) {
    next(err);
  }
}
