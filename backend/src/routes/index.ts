import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import { adminRouter } from './adminRouter';
import { asignacionesRouter } from './asignacionesRouter';
import { authRouter } from './authRouter';
import { ejerciciosRouter } from './ejerciciosRouter';
import { insigniasRouter } from './insigniasRouter';
import { leccionesRouter } from './leccionesRouter';
import { progresoRouter } from './progresoRouter';

export const router = Router();

router.get('/health', healthCheck);
router.use('/auth', authRouter);
router.use('/lecciones', leccionesRouter);
router.use('/ejercicios', ejerciciosRouter);
router.use('/progreso', progresoRouter);
router.use('/insignias', insigniasRouter);
router.use('/asignaciones', asignacionesRouter);
router.use('/admin', adminRouter);
