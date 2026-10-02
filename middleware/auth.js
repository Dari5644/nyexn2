import { resolveUser } from '../services/authService.js';
import { gate } from '../services/staffService.js';
import { actorStore } from '../utils/actor.js';
import { areaOf } from '../utils/permissions.js';
import { HttpError } from '../utils/httpError.js';
function enforce(req, user) {
  const p = req.path;
  if (/^\/(me|staff\/me)/.test(p)) return;
  if (req.method === 'DELETE') throw new HttpError(403, 'Staff accounts can never delete data');
  if (/^\/(backup\/restore|versions\/\d+\/revert)/.test(p)) throw new HttpError(403, 'Not allowed for staff accounts');
  const g = gate(user.staff);
  if (g) throw new HttpError(403, g.message, { code: g.code });
  const area = areaOf(p), write = req.method !== 'GET';
  if (!area || area === 'staff') throw new HttpError(403, 'Not allowed');
  if (area === 'config') return;
  if (area === 'upload') { if (Object.values(user.perms).includes('edit')) return; throw new HttpError(403, 'Not allowed'); }
  const lvl = user.perms[area];
  if (!(lvl === 'edit' || (!write && lvl === 'view'))) throw new HttpError(403, `No ${write ? 'edit' : 'view'} permission for "${area}"`);
}
export function requireAdmin(req, _res, next) {
  try {
    const h = req.headers.authorization || '';
    const user = resolveUser(h.startsWith('Bearer ') ? h.slice(7) : '');
    req.user = user;
    if (user.role === 'staff') enforce(req, user);
    actorStore.run({ name: user.name, role: user.role }, () => next());
  } catch (e) { next(e instanceof HttpError ? e : new HttpError(401, 'Unauthorized')); }
}
