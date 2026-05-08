import { Router } from 'express';
import {
  cambiarEstadoPropia,
  crearLeccion,
  editarLeccion,
  eliminarLeccion,
  listarLecciones,
  listarMisLecciones,
  obtenerLeccion,
} from '../controllers/leccionesController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import {
  lessonValidation,
  listLessonsValidation,
  updateLessonStatusValidation,
  updateLessonValidation,
} from '../validators/lessonValidators';

export const leccionesRouter = Router();

leccionesRouter.get('/', listLessonsValidation, validateRequest, listarLecciones);

leccionesRouter.get(
  '/mias',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  listarMisLecciones
);

leccionesRouter.get('/:id', obtenerLeccion);

leccionesRouter.post(
  '/',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  lessonValidation,
  validateRequest,
  crearLeccion
);

leccionesRouter.put(
  '/:id',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  updateLessonValidation,
  validateRequest,
  editarLeccion
);

leccionesRouter.patch(
  '/:id/estado',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  updateLessonStatusValidation,
  validateRequest,
  cambiarEstadoPropia
);

leccionesRouter.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  eliminarLeccion
);
