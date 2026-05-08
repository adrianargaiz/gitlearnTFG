import { Router } from 'express';
import {
  crearEjercicio,
  editarEjercicio,
  eliminarEjercicio,
  listarEjerciciosPorLeccion,
} from '../controllers/ejerciciosController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { exerciseValidation, updateExerciseValidation } from '../validators/exerciseValidators';

export const ejerciciosRouter = Router();

ejerciciosRouter.get('/:leccionId', listarEjerciciosPorLeccion);

ejerciciosRouter.post(
  '/',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  exerciseValidation,
  validateRequest,
  crearEjercicio
);

ejerciciosRouter.put(
  '/:id',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  updateExerciseValidation,
  validateRequest,
  editarEjercicio
);

ejerciciosRouter.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  eliminarEjercicio
);
