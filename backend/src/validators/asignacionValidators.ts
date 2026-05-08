import { body } from 'express-validator';

export const createAsignacionValidation = [
  body('leccionId')
    .notEmpty()
    .withMessage('La lección es obligatoria.')
    .isMongoId()
    .withMessage('ID de lección no válido.'),
  body('estudiantesIds')
    .isArray({ min: 1 })
    .withMessage('Debes seleccionar al menos un alumno.'),
  body('estudiantesIds.*')
    .isMongoId()
    .withMessage('ID de estudiante no válido.'),
  body('titulo')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('El título no puede superar los 200 caracteres.'),
  body('fechaLimite')
    .optional()
    .isISO8601()
    .withMessage('Fecha límite no válida.'),
];
