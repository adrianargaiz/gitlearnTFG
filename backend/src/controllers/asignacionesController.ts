import { NextFunction, Request, Response } from 'express';
import { createError } from '../middlewares/errorHandler';
import {
  createAsignacion,
  deleteAsignacion,
  getAsignacionesByEstudiante,
  getAsignacionesByLeccion,
  getAsignacionesByProfesor,
  getEstudiantesActivos,
} from '../services/asignacionesService';

export async function listarEstudiantes(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const estudiantes = await getEstudiantesActivos();
    res.json(estudiantes);
  } catch (err) {
    next(err);
  }
}

export async function listarMisAsignaciones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));
    const asignaciones = await getAsignacionesByEstudiante(req.user.userId);
    res.json(asignaciones);
  } catch (err) {
    next(err);
  }
}

export async function listarAsignacionesProfesor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));
    const asignaciones = await getAsignacionesByProfesor(req.user.userId);
    res.json(asignaciones);
  } catch (err) {
    next(err);
  }
}

export async function listarAsignacionesPorLeccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));
    const asignaciones = await getAsignacionesByLeccion(
      req.params.leccionId ?? '',
      req.user.userId
    );
    res.json(asignaciones);
  } catch (err) {
    next(err);
  }
}

export async function crearAsignacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));
    const asignacion = await createAsignacion(req.body, req.user.userId);
    res.status(201).json(asignacion);
  } catch (err) {
    next(err);
  }
}

export async function eliminarAsignacion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));
    await deleteAsignacion(req.params.id ?? '', req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
