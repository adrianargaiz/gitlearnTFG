import { Router } from 'express';
import { completarLeccion, obtenerProgreso } from '../controllers/progresoController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { completeLessonValidation } from '../validators/progressValidators';

export const progresoRouter = Router();

progresoRouter.get('/:usuarioId', authMiddleware, obtenerProgreso);

progresoRouter.post(
  '/',
  authMiddleware,
  completeLessonValidation,
  validateRequest,
  completarLeccion
);
