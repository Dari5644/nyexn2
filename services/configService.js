import { DEFAULT_CONFIG } from '../config/defaults.js';
import { MAX_SNAPSHOTS } from '../config/constants.js';
import * as cfgRepo from '../db/configRepo.js';
import * as snaps from '../db/snapshotRepo.js';
import * as hub from '../ws/hub.js';
import { computeMode } from './maintenanceService.js';
import { env } from '../config/env.js';
import { randomHex } from '../utils/ids.js';
import { guardStaff, record } from './historyRecorder.js';
const persist = cfg => ({ ...cfg, secrets: { ...cfg.secrets, kickClientId: '', kickClientSecret: '' } });
export function getFull() {
  const d = structuredClone(DEFAULT_CONFIG);
  const c = { ...d, ...(cfgRepo.get() || {}) };
  for (const k of ['branding', 'maintenance', 'kick', 'panic', 'ticker', 'discord', 'mods', 'stream', 'xp', 'notify']) c[k] = { ...d[k], ...c[k] };
  for (const k of ['tickets', 'logs', 'announceLive', 'presence']) c.discord[k] = { ...d.discord[k], ...c.discord[k] };
  for (const s of d.sections) if (!c.sections.some(x => x.id === s.id)) c.sections.push(s);
  let dirty = false;
  for (const s of c.sections) if (!s.secret) { s.secret = randomHex(12); dirty = true; }
  if (dirty) cfgRepo.set(persist(c));
  c.goals = (c.goals || []).filter(g => g.kind !== 'support');
  if (!c.goals.length) c.goals = d.goals;
  c.socials = c.socials.map(s => ({ visible: true, ...s }));
  delete c.soundboard;
  c.secrets = { ...d.secrets, ...c.secrets, kickClientId: env.kickClientId, kickClientSecret: env.kickClientSecret };
  if (env.kickChannel && !c.kick.custom) c.kick = { ...c.kick, channel: env.kickChannel, url: `https://kick.com/${env.kickChannel}` };
  return c;
}
export function getPublic() {
  const { secrets, bot, discord, ...rest } = getFull();
  const mods = { overrides: rest.mods.overrides, synced: rest.mods.synced.filter(m => m.approved && !m.hidden) };
  const sections = rest.sections.map(({ secret, ...s }) => (s.visible ? s : { ...s, content: undefined }));
  return { ...rest, sections, mods, hasKickCredentials: !!(secrets.kickClientId && secrets.kickClientSecret), mode: computeMode(rest) };
}
export function save(cfg, label = 'Edit') {
  const before = getFull();
  guardStaff(before, cfg);
  const p = persist(cfg); cfgRepo.set(p); snaps.add(label, p); snaps.prune(MAX_SNAPSHOTS);
  record(before, cfg, label);
  hub.broadcast('config', getPublic());
  return cfg;
}
export function saveQuiet(cfg) {
  cfgRepo.set(persist(cfg));
  hub.broadcast('config', getPublic());
  return cfg;
}
export const update = (patch, label) => save({ ...getFull(), ...patch }, label);
