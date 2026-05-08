import { Request, Response, NextFunction } from 'express';
import { getAllInsignias, getInsigniasByUsuario } from '../services/insigniasService';
import { createError } from '../middlewares/errorHandler';

export async function listarInsignias(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const insignias = await getAllInsignias();
    res.json(insignias);
  } catch (err) {
    next(err);
  }
}

export async function obtenerInsigniasPorUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const { usuarioId } = req.params;

    if (usuarioId !== req.user.userId && req.user.rol !== 'administrador') {
      return next(createError('No tienes permiso para ver estas insignias.', 403));
    }

    const insignias = await getInsigniasByUsuario(usuarioId ?? '');
    res.json(insignias);
  } catch (err) {
    next(err);
  }
}
