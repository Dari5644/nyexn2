import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
const hash = bcrypt.hashSync(env.adminPassword, 10);
const fails = new Map();
export function login(password, ip) {
  const rec = fails.get(ip) || { n: 0, until: 0 };
  if (Date.now() < rec.until) throw new HttpError(429, 'Too many attempts, try later');
  if (typeof password !== 'string' || !bcrypt.compareSync(password, hash)) {
    rec.n += 1;
    if (rec.n >= 5) { rec.until = Date.now() + 5 * 60000; rec.n = 0; }
    fails.set(ip, rec);
    throw new HttpError(401, 'Invalid password');
  }
  fails.delete(ip);
  return signAdmin();
}
export const signAdmin = () => jwt.sign({ role: 'admin' }, env.jwtSecret, { expiresIn: '12h' });
export const verify = token => jwt.verify(token, env.jwtSecret);
