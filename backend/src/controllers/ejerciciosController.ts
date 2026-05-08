import { NextFunction, Request, Response } from 'express';
import { createError } from '../middlewares/errorHandler';
import {
  createEjercicio,
  deleteEjercicio,
  getEjerciciosByLeccion,
  updateEjercicio,
} from '../services/ejerciciosService';

export async function listarEjerciciosPorLeccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ejercicios = await getEjerciciosByLeccion(req.params.leccionId ?? '');
    res.json(ejercicios);
  } catch (err) {
    next(err);
  }
}

export async function crearEjercicio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const ejercicio = await createEjercicio(req.body, req.user.userId);
    res.status(201).json(ejercicio);
  } catch (err) {
    next(err);
  }
}

export async function editarEjercicio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const ejercicio = await updateEjercicio(req.params.id ?? '', req.body, req.user.userId);
    res.json(ejercicio);
  } catch (err) {
    next(err);
  }
}

export async function eliminarEjercicio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    await deleteEjercicio(req.params.id ?? '', req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
