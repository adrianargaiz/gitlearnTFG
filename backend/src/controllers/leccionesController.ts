import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { createError } from '../middlewares/errorHandler';
import {
  createLeccion,
  deleteLeccion,
  getLeccionById,
  getLeccionesPublicadas,
  getMisLecciones,
  setPropiasLeccionEstado,
  updateLeccion,
} from '../services/leccionesService';
import { LessonLevel, LessonStatus } from '../types';

export async function listarLecciones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const nivel = req.query.nivel as LessonLevel | undefined;
    const lecciones = await getLeccionesPublicadas(nivel);

    res.json(lecciones);
  } catch (err) {
    next(err);
  }
}

export async function listarMisLecciones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const lecciones = await getMisLecciones(req.user.userId);
    res.json(lecciones);
  } catch (err) {
    next(err);
  }
}

export async function obtenerLeccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leccion = await getLeccionById(req.params.id ?? '');
    res.json(leccion);
  } catch (err) {
    next(err);
  }
}

export async function crearLeccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const leccion = await createLeccion(
      req.body as Parameters<typeof createLeccion>[0],
      new Types.ObjectId(req.user.userId)
    );

    res.status(201).json(leccion);
  } catch (err) {
    next(err);
  }
}

export async function editarLeccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const leccion = await updateLeccion(
      req.params.id ?? '',
      req.body as Parameters<typeof updateLeccion>[1],
      req.user.userId
    );

    res.json(leccion);
  } catch (err) {
    next(err);
  }
}

export async function cambiarEstadoPropia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const { estado } = req.body as { estado: LessonStatus };
    const leccion = await setPropiasLeccionEstado(req.params.id ?? '', req.user.userId, estado);

    res.json(leccion);
  } catch (err) {
    next(err);
  }
}

export async function eliminarLeccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    await deleteLeccion(req.params.id ?? '', req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
