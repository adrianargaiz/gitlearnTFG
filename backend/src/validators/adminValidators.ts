import { body } from 'express-validator';
import { LESSON_STATUSES, USER_ROLES } from '../constants/domain';

export const updateUserRoleValidation = [
  body('rol').isIn(USER_ROLES).withMessage('Rol no válido.'),
];

export const updateUserStatusValidation = [
  body('activo').isBoolean().withMessage('El campo activo debe ser booleano.'),
];

export const adminUpdateLessonStatusValidation = [
  body('estado').isIn(LESSON_STATUSES).withMessage('Estado no válido.'),
];
