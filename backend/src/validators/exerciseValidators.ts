import { body } from 'express-validator';
import { EDITOR_EXERCISE_TYPES } from '../constants/domain';

export const exerciseValidation = [
  body('leccionId')
    .notEmpty()
    .withMessage('La lección es obligatoria.')
    .isMongoId()
    .withMessage('ID de lección no válido.'),
  body('tipo').isIn(EDITOR_EXERCISE_TYPES).withMessage('Tipo de ejercicio no válido.'),
  body('enunciado')
    .trim()
    .notEmpty()
    .withMessage('El enunciado es obligatorio.')
    .isLength({ max: 2000 })
    .withMessage('El enunciado no puede superar los 2000 caracteres.'),
  body('opciones').optional().isArray().withMessage('Las opciones deben ser un array.'),
  body('respuestaCorrecta').notEmpty().withMessage('La respuesta correcta es obligatoria.'),
  body('orden').isInt({ min: 0 }).withMessage('El orden debe ser un número positivo.'),
];

export const updateExerciseValidation = exerciseValidation
  .slice(1)
  .map((validator) => validator.optional());
