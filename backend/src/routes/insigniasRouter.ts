import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { listarInsignias, obtenerInsigniasPorUsuario } from '../controllers/insigniasController';

export const insigniasRouter = Router();

insigniasRouter.get('/', listarInsignias);
insigniasRouter.get('/:usuarioId', authMiddleware, obtenerInsigniasPorUsuario);
