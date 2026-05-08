import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { environment } from '../config/environment';
import { JwtPayload } from '../middlewares/authMiddleware';
import { UserRole } from '../types';

function getSecret(): string {
  const secret = environment.jwtSecret;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return secret;
}

export function generateToken(userId: Types.ObjectId, rol: UserRole, email: string): string {
  const payload: JwtPayload = { userId: userId.toString(), rol, email };

  return jwt.sign(payload, getSecret(), {
    expiresIn: environment.jwtExpiry as jwt.SignOptions['expiresIn'],
  });
}
