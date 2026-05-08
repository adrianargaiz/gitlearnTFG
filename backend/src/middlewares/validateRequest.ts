import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { createError } from './errorHandler';

export const validateRequest: RequestHandler = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(createError(errors.array()[0]?.msg ?? 'Datos inválidos.', 422));
  }

  next();
};
