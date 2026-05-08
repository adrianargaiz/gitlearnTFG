import bcrypt from 'bcryptjs';
import { Usuario, IUsuario } from '../models/Usuario';
import { UserPublic } from '../types';
import { generateToken } from './tokenService';
import { createError } from '../middlewares/errorHandler';

const SALT_ROUNDS = 12;

export interface AuthResult {
  token: string;
  user: UserPublic;
}

function toPublicUser(user: IUsuario): UserPublic {
  return {
    _id: user._id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    xpTotal: user.xpTotal,
    racha: user.racha,
    insignias: user.insignias,
    activo: user.activo,
    fechaRegistro: user.fechaRegistro,
  };
}

export async function registerUser(
  nombre: string,
  email: string,
  password: string,
  rol: 'estudiante' | 'profesor' = 'estudiante'
): Promise<AuthResult> {
  const existing = await Usuario.findOne({ email }).lean();
  if (existing) {
    throw createError('Ya existe una cuenta con ese email.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await Usuario.create({ nombre, email, passwordHash, rol });

  const token = generateToken(user._id, user.rol, user.email);
  return { token, user: toPublicUser(user) };
}

export async function getUserById(id: string): Promise<UserPublic> {
  const user = await Usuario.findById(id).lean<IUsuario>();
  if (!user) throw createError('Usuario no encontrado.', 404);
  return toPublicUser(user);
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  // passwordHash is select:false — must be explicitly requested
  const user = await Usuario.findOne({ email }).select('+passwordHash');

  if (!user || !user.activo) {
    throw createError('Credenciales incorrectas.', 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw createError('Credenciales incorrectas.', 401);
  }

  const token = generateToken(user._id, user.rol, user.email);
  return { token, user: toPublicUser(user) };
}

export async function findOrCreateGithubUser(
  githubId: string,
  email: string,
  nombre: string
): Promise<AuthResult> {
  let user = await Usuario.findOne({ githubId });

  if (!user) {
    // If an account already exists with this email, link the GitHub account
    user = await Usuario.findOne({ email });

    if (user) {
      user.githubId = githubId;
      await user.save();
    } else {
      user = await Usuario.create({ nombre, email, githubId, passwordHash: '' });
    }
  }

  if (!user.activo) {
    throw createError('Tu cuenta está desactivada.', 403);
  }

  const token = generateToken(user._id, user.rol, user.email);
  return { token, user: toPublicUser(user) };
}
