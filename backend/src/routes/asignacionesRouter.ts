import { Router } from 'express';
import {
  crearAsignacion,
  eliminarAsignacion,
  listarAsignacionesPorLeccion,
  listarAsignacionesProfesor,
  listarEstudiantes,
  listarMisAsignaciones,
} from '../controllers/asignacionesController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { createAsignacionValidation } from '../validators/asignacionValidators';

export const asignacionesRouter = Router();

// Estudiante: ver sus asignaciones
asignacionesRouter.get('/mias', authMiddleware, roleMiddleware('estudiante'), listarMisAsignaciones);

// Profesor: ver lista de estudiantes activos para el modal
asignacionesRouter.get(
  '/estudiantes',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  listarEstudiantes
);

// Profesor: ver todas sus asignaciones creadas
asignacionesRouter.get(
  '/mis-asignaciones',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  listarAsignacionesProfesor
);

// Profesor: ver asignaciones de una lección concreta
asignacionesRouter.get(
  '/por-leccion/:leccionId',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  listarAsignacionesPorLeccion
);

// Profesor: crear asignación
asignacionesRouter.post(
  '/',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  createAsignacionValidation,
  validateRequest,
  crearAsignacion
);

// Profesor: eliminar asignación
asignacionesRouter.delete(
  '/:id',
  authMiddleware,
  roleMiddleware('profesor', 'administrador'),
  eliminarAsignacion
);
