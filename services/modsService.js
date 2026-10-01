import { getFull, save, saveQuiet } from './configService.js';
import { str } from '../utils/sanitize.js';
import { HttpError } from '../utils/httpError.js';
export const listAll = () => { const c = getFull(); return c.mods.synced.map(m => ({ ...m, ...(c.mods.overrides[m.id] || {}) })); };
export function upsertGuardian(g) {
  const cfg = getFull(); const list = cfg.mods.synced; const id = String(g.id);
  const i = list.findIndex(m => String(m.id) === id);
  if (i >= 0) {
    const cur = list[i];
    const next = { ...cur, name: g.name || cur.name, username: g.username || cur.username, avatar: g.avatar || cur.avatar, approved: cur.approved || !!g.approved };
    if (JSON.stringify(next) !== JSON.stringify(cur)) { list[i] = next; saveQuiet(cfg); }
    return next;
  }
  const rec = { id, name: str(g.name, 60), username: str(g.username, 60), avatar: str(g.avatar, 400), source: g.source || 'chat', approved: !!g.approved || (g.source === 'linked' && !!cfg.mods.autoApprove), hidden: false, addedAt: Date.now() };
  list.push(rec); saveQuiet(cfg);
  return rec;
}
function mutate(id, fn, label) {
  const cfg = getFull(); const m = cfg.mods.synced.find(x => String(x.id) === String(id));
  if (!m) throw new HttpError(404, 'Guardian not found');
  fn(m, cfg); save(cfg, label); return listAll();
}
export const setApproved = (id, v) => mutate(id, m => { m.approved = !!v; }, 'Guardian approval');
export const setHidden = (id, v) => mutate(id, m => { m.hidden = !!v; }, 'Guardian visibility');
export const remove = id => { const cfg = getFull(); cfg.mods.synced = cfg.mods.synced.filter(m => String(m.id) !== String(id)); delete cfg.mods.overrides[id]; save(cfg, 'Guardian removed'); return listAll(); };
export const setOverride = (id, { title, badge }) => mutate(id, (_m, cfg) => { cfg.mods.overrides[id] = { customTitle: str(title, 60), customBadge: str(badge, 40) }; }, 'Guardian badge');
export function setAutoApprove(v) { const cfg = getFull(); cfg.mods.autoApprove = !!v; save(cfg, 'Guardian auto-approve'); return { autoApprove: !!v }; }
