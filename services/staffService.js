import bcrypt from 'bcryptjs';
import * as repo from '../db/staffRepo.js';
import { getFull } from './configService.js';
import { getAuth } from './kickAuthService.js';
import { audit } from './auditService.js';
import { env } from '../config/env.js';
import { cleanPerms } from '../utils/permissions.js';
import { HttpError } from '../utils/httpError.js';
export function kickState(s) {
  const linked = !!s.kick_user_id, owner = getAuth()?.userId;
  const verified = linked && (!!s.waive_kick || String(owner) === String(s.kick_user_id) || getFull().mods.synced.some(m => String(m.id) === String(s.kick_user_id) && m.badgeVerified));
  return { linked, verified, username: s.kick_name || '', waived: !!s.waive_kick };
}
export function gate(s) {
  if (!s || s.waive_kick) return null;
  const k = kickState(s);
  if (!k.linked) return { code: 'KICK_LINK_REQUIRED', message: 'Link your Kick account to continue' };
  if (!k.verified) return { code: 'KICK_VERIFY_PENDING', message: 'Waiting for moderator verification: send a message in the stream chat while showing your MOD badge' };
  return null;
}
const strong = p => typeof p === 'string' && p.length >= 10 && /[a-zA-Z]/.test(p) && /\d/.test(p);
const view = s => ({ id: s.id, username: s.username, perms: JSON.parse(s.perms || '{}'), disabled: !!s.disabled, waive: !!s.waive_kick, kick: kickState(s), createdAt: s.created_at, createdBy: s.created_by, lastLogin: s.last_login });
export const me = user => (user.role === 'admin' ? { role: 'admin', name: user.name, perms: 'all', gate: null } : { role: 'staff', name: user.name, perms: user.perms, kick: kickState(user.staff), gate: gate(user.staff) });
export const list = () => repo.list().map(view);
export function create({ username, password, perms }, by) {
  const u = String(username || '').trim();
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(u) || u.toLowerCase() === env.adminUsername.toLowerCase()) throw new HttpError(400, 'Invalid username');
  if (repo.byUsername(u)) throw new HttpError(409, 'Username already exists');
  if (!strong(password)) throw new HttpError(400, 'Password must be 10+ characters with letters and digits');
  const id = repo.create({ username: u, passHash: bcrypt.hashSync(password, 10), perms: cleanPerms(perms), createdBy: by });
  audit('staff_create', u); return view(repo.byId(id));
}
export function update(id, b) {
  const s = repo.byId(Number(id)); if (!s) throw new HttpError(404, 'Staff not found');
  repo.update(s.id, { perms: cleanPerms(b.perms ?? JSON.parse(s.perms)), disabled: b.disabled ?? !!s.disabled, waive: b.waive ?? !!s.waive_kick });
  if (b.password) { if (!strong(b.password)) throw new HttpError(400, 'Password must be 10+ characters with letters and digits'); repo.setPassword(s.id, bcrypt.hashSync(b.password, 10)); }
  audit('staff_update', s.username, Object.keys(b).join(',')); return view(repo.byId(s.id));
}
export function remove(id) { const s = repo.byId(Number(id)); if (!s) throw new HttpError(404, 'Staff not found'); repo.remove(s.id); audit('staff_delete', s.username); return { ok: true }; }
export const devices = id => repo.devices(Number(id));
export function setDevice(id, b) { repo.setDevice(Number(id), { trusted: !!b.trusted, revoked: !!b.revoked }); audit('device_update', String(id), JSON.stringify(b)); return { ok: true }; }
