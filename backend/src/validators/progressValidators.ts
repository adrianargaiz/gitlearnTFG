import { body } from 'express-validator';

export const completeLessonValidation = [
  body('leccionId')
    .notEmpty()
    .withMessage('La lección es obligatoria.')
    .isMongoId()
    .withMessage('ID de lección no válido.'),
  body('aciertos')
    .isInt({ min: 0 })
    .withMessage('Aciertos debe ser un entero >= 0.'),
  body('total')
    .isInt({ min: 1 })
    .withMessage('Total debe ser un entero >= 1.'),
  body('aciertos').custom((aciertos: number, { req }) => {
    const total = Number((req.body as { total?: unknown }).total);
    if (Number.isFinite(total) && Number(aciertos) > total) {
      throw new Error('Aciertos no puede superar al total.');
    }
    return true;
  }),
];
