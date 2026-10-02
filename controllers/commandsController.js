import { getFull, update } from '../services/configService.js';
import { str } from '../utils/sanitize.js';
const clean = (arr, keys) => (Array.isArray(arr) ? arr.slice(0, 100).map(o => Object.fromEntries(keys.map(k => [k, str(o?.[k], 300)]))) : []);
export const getLists = (_q, res) => { const c = getFull(); res.json({ commands: c.commands, quickLinks: c.quickLinks }); };
export function saveLists(req, res) {
  const b = req.body || {};
  const patch = {};
  if (b.commands) patch.commands = clean(b.commands, ['name', 'description', 'response']);
  if (b.quickLinks) patch.quickLinks = clean(b.quickLinks, ['label', 'url', 'icon']);
  update(patch, 'Commands & links');
  res.json(patch);
}
