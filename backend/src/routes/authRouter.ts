import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { githubCallback, getMe, login, logout, register } from '../controllers/authController';
import { environment } from '../config/environment';
import { authRateLimiter } from '../config/rateLimiters';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { loginValidation, registerValidation } from '../validators/authValidators';

export const authRouter = Router();

authRouter.get('/me', authMiddleware, getMe);
authRouter.post('/register', authRateLimiter, registerValidation, validateRequest, register);
authRouter.post('/login', authRateLimiter, loginValidation, validateRequest, login);
authRouter.post('/logout', logout);

authRouter.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

authRouter.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${environment.frontendUrl}/login?error=oauth_failed`,
  }),
  (req: Request, res: Response, next: NextFunction) => {
    const authenticatedUser = req.user as { _token?: string } | undefined;

    if (authenticatedUser?._token) {
      (req as Request & { authToken?: string }).authToken = authenticatedUser._token;
    }

    githubCallback(req, res);
    void next;
  }
);
