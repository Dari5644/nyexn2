import * as repo from '../db/auditRepo.js';
import { getActor } from '../utils/actor.js';
export function audit(action, target = '', detail = '', extra = {}) {
  const a = getActor();
  try { repo.addAudit({ actor: extra.actor ?? a.name, role: extra.role ?? a.role, action, target, detail: String(detail).slice(0, 500), ip: extra.ip }); repo.pruneAudit(5000); } catch {}
}
export const listAudit = q => repo.listAudit({ q: String(q.q || '').slice(0, 80), limit: Math.min(300, Number(q.limit) || 100), offset: Math.max(0, Number(q.offset) || 0) });
