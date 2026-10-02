import * as repo from '../db/auditRepo.js';
import { getFull, save } from './configService.js';
import { getAt, setAt, same } from '../utils/pathDiff.js';
import { HttpError } from '../utils/httpError.js';
import { KEY_AREA } from '../utils/permissions.js';
const parse = s => (s === null ? undefined : JSON.parse(s));
export const list = q => repo.listHistory({ q: String(q.q || '').slice(0, 80), limit: Math.min(300, Number(q.limit) || 100), offset: Math.max(0, Number(q.offset) || 0) })
  .map(h => ({ id: h.id, at: h.at, actor: h.actor, role: h.role, label: h.label, path: h.path, old: parse(h.old_json), new: parse(h.new_json) }));
export function undo(id, force, user) {
  const e = repo.getHistory(Number(id));
  if (!e) throw new HttpError(404, 'History entry not found');
  const top = e.path.split(/[.#@]/)[0];
  if (user.role === 'staff' && user.perms[KEY_AREA[top]] !== 'edit') throw new HttpError(403, 'No edit permission for this field');
  const cfg = getFull(), expected = parse(e.new_json), current = getAt(cfg, e.path);
  if (!force && !same(current, expected)) throw new HttpError(409, 'This field was changed again after this entry', { conflict: true, current });
  if (!setAt(cfg, e.path, parse(e.old_json))) throw new HttpError(409, 'The parent of this field no longer exists');
  save(cfg, `Undo field: ${e.path}`);
  return { ok: true, path: e.path };
}
