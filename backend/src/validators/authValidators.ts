import { body } from 'express-validator';
import { PUBLIC_REGISTRATION_ROLES } from '../constants/domain';

export const registerValidation = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio.')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar los 100 caracteres.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio.')
    .isEmail()
    .withMessage('El email no tiene un formato válido.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria.')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe contener al menos una mayúscula.')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe contener al menos un número.'),
  body('rol')
    .optional()
    .isIn(PUBLIC_REGISTRATION_ROLES)
    .withMessage('El rol debe ser estudiante o profesor.'),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio.')
    .isEmail()
    .withMessage('El email no tiene un formato válido.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
];
