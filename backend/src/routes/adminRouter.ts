import { Router } from 'express';
import {
  cambiarEstadoLeccion,
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  listarTodasLecciones,
  listarUsuarios,
} from '../controllers/adminController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import {
  adminUpdateLessonStatusValidation,
  updateUserRoleValidation,
  updateUserStatusValidation,
} from '../validators/adminValidators';

export const adminRouter = Router();

adminRouter.use(authMiddleware, roleMiddleware('administrador'));

adminRouter.get('/usuarios', listarUsuarios);

adminRouter.put(
  '/usuarios/:id/rol',
  updateUserRoleValidation,
  validateRequest,
  cambiarRolUsuario
);

adminRouter.put(
  '/usuarios/:id/estado',
  updateUserStatusValidation,
  validateRequest,
  cambiarEstadoUsuario
);

adminRouter.get('/lecciones', listarTodasLecciones);

adminRouter.put(
  '/lecciones/:id/estado',
  adminUpdateLessonStatusValidation,
  validateRequest,
  cambiarEstadoLeccion
);
