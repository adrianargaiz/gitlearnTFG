import { body, query } from 'express-validator';
import { LESSON_LEVELS, LESSON_STATUSES } from '../constants/domain';

export const listLessonsValidation = [
  query('nivel').optional().isIn(LESSON_LEVELS).withMessage('Nivel no válido.'),
];

export const lessonValidation = [
  body('titulo')
    .trim()
    .notEmpty()
    .withMessage('El título es obligatorio.')
    .isLength({ max: 200 })
    .withMessage('El título no puede superar los 200 caracteres.'),
  body('descripcion')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria.')
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede superar los 1000 caracteres.'),
  body('nivel').isIn(LESSON_LEVELS).withMessage('Nivel no válido.'),
  body('xpRecompensa')
    .isInt({ min: 0, max: 500 })
    .withMessage('XP debe estar entre 0 y 500.'),
  body('orden').isInt({ min: 0 }).withMessage('El orden debe ser un número positivo.'),
];

export const updateLessonValidation = [
  ...lessonValidation.map((validator) => validator.optional()),
  body('estado').optional().isIn(LESSON_STATUSES).withMessage('Estado no válido.'),
];

export const updateLessonStatusValidation = [
  body('estado').isIn(LESSON_STATUSES).withMessage('Estado no válido.'),
];
