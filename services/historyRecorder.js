import * as repo from '../db/auditRepo.js';
import { diff, isDeletion } from '../utils/pathDiff.js';
import { getActor } from '../utils/actor.js';
import { audit } from './auditService.js';
import { HttpError } from '../utils/httpError.js';
export function guardStaff(before, after) {
  if (getActor().role !== 'staff') return;
  if (diff(before, after).some(isDeletion)) throw new HttpError(403, 'Staff accounts can never delete data, sections or settings');
}
export function record(before, after, label) {
  if (/^(Restored|Reverted)/.test(label)) { audit('config_bulk', label); return; }
  const entries = diff(before, after);
  if (!entries.length) return;
  const a = getActor();
  for (const e of entries) repo.addHistory({ actor: a.name, role: a.role, label, path: e.path, old: e.old, new: e.new });
  repo.pruneHistory(3000);
  audit('config', label, `${entries.length} field(s): ${entries.slice(0, 6).map(e => e.path).join(', ')}`);
}
