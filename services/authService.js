import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import * as staffRepo from '../db/staffRepo.js';
import { audit } from './auditService.js';
import { HttpError } from '../utils/httpError.js';
const hash = bcrypt.hashSync(env.adminPassword, 10);
const fails = new Map();
const dh = id => crypto.createHash('sha256').update(String(id)).digest('hex');
export const signAdmin = () => jwt.sign({ role: 'admin' }, env.jwtSecret, { expiresIn: '12h' });
export async function login({ username, password, deviceId, ua = '', ip = '' }) {
  const user = String(username || env.adminUsername).trim();
  const key = `${ip}|${user.toLowerCase()}`;
  const rec = fails.get(key) || { n: 0, until: 0 };
  if (Date.now() < rec.until) throw new HttpError(429, 'Too many attempts, try later');
  const fail = () => { rec.n += 1; if (rec.n >= 5) { rec.until = Date.now() + 5 * 60000; rec.n = 0; } fails.set(key, rec); audit('login_failed', user, '', { actor: user, role: '?', ip }); throw new HttpError(401, 'Invalid username or password'); };
  if (typeof password !== 'string') return fail();
  if (user.toLowerCase() === env.adminUsername.toLowerCase()) {
    if (!bcrypt.compareSync(password, hash)) return fail();
    fails.delete(key); audit('login', user, 'master', { actor: user, role: 'admin', ip });
    return { token: signAdmin(), role: 'admin', username: env.adminUsername };
  }
  const s = staffRepo.byUsername(user);
  if (!s || s.disabled || !bcrypt.compareSync(password, s.pass_hash)) return fail();
  fails.delete(key);
  const did = /^[\w-]{16,64}$/.test(String(deviceId || '')) ? dh(deviceId) : dh(`${ua}|${ip}`);
  const dev = staffRepo.touchDevice(s.id, did, ua.slice(0, 200), ip);
  if (dev.revoked) { audit('login_blocked_device', s.username, 'revoked device', { actor: s.username, role: 'staff', ip }); throw new HttpError(403, 'This device was revoked by the manager'); }
  staffRepo.touchLogin(s.id);
  audit(dev.known ? 'login' : 'login_new_device', s.username, `${ua.slice(0, 80)}`, { actor: s.username, role: 'staff', ip });
  const token = jwt.sign({ role: 'staff', uid: s.id, dh: did }, env.jwtSecret, { expiresIn: dev.trusted ? '30d' : '12h' });
  return { token, role: 'staff', username: s.username, deviceKnown: dev.known, deviceTrusted: dev.trusted };
}
export function resolveUser(token) {
  const p = jwt.verify(token, env.jwtSecret);
  if (p.role === 'admin') return { role: 'admin', name: env.adminUsername, perms: {} };
  if (p.role === 'staff') {
    const s = staffRepo.byId(p.uid);
    const d = s && staffRepo.device(s.id, p.dh);
    if (!s || s.disabled || !d || d.revoked) throw new HttpError(401, 'Session no longer valid');
    return { role: 'staff', id: s.id, name: s.username, perms: JSON.parse(s.perms || '{}'), staff: s };
  }
  throw new HttpError(401, 'Unauthorized');
}
