import { NextFunction, Request, Response } from 'express';
import { createError } from '../middlewares/errorHandler';
import { getAllUsuarios, setUsuarioEstado, setUsuarioRol } from '../services/adminService';
import { getAllLecciones, setLeccionEstado } from '../services/leccionesService';
import { LessonStatus, UserRole } from '../types';

export async function listarUsuarios(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuarios = await getAllUsuarios();
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
}

export async function cambiarRolUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id === req.user?.userId) {
      return next(createError('No puedes cambiar tu propio rol.', 403));
    }

    const { rol } = req.body as { rol: UserRole };
    const usuario = await setUsuarioRol(req.params.id ?? '', rol);

    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

export async function cambiarEstadoUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id === req.user?.userId) {
      return next(createError('No puedes desactivar tu propia cuenta.', 403));
    }

    const { activo } = req.body as { activo: boolean };
    const usuario = await setUsuarioEstado(req.params.id ?? '', activo);

    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

export async function listarTodasLecciones(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lecciones = await getAllLecciones();
    res.json(lecciones);
  } catch (err) {
    next(err);
  }
}

export async function cambiarEstadoLeccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { estado } = req.body as { estado: LessonStatus };
    const leccion = await setLeccionEstado(req.params.id ?? '', estado);

    res.json(leccion);
  } catch (err) {
    next(err);
  }
}
