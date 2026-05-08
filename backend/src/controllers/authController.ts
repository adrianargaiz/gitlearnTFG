import { NextFunction, Request, Response } from 'express';
import { environment } from '../config/environment';
import { createError } from '../middlewares/errorHandler';
import { getUserById, loginUser, registerUser } from '../services/authService';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { nombre, email, password, rol } = req.body as {
      nombre: string;
      email: string;
      password: string;
      rol?: 'estudiante' | 'profesor';
    };

    const result = await registerUser(nombre, email, password, rol);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await loginUser(email, password);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ message: 'Sesión cerrada correctamente.' });
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) return next(createError('No autenticado.', 401));

    const user = await getUserById(req.user.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export function githubCallback(req: Request, res: Response): void {
  const token = (req as Request & { authToken?: string }).authToken;

  if (!token) {
    res.redirect(`${environment.frontendUrl}/login?error=oauth_failed`);
    return;
  }

  res.redirect(`${environment.frontendUrl}/auth/github/callback?token=${token}`);
}
