import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';

const JWT_EXPIRES_IN = '7d';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hashValue: string) {
  return bcrypt.compare(password, hashValue);
}

export function signAccessToken(payload: object) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, env.JWT_SECRET) as object;
  } catch {
    return null;
  }
}

export default {
  hashPassword,
  comparePassword,
  signAccessToken,
  verifyAccessToken,
};
