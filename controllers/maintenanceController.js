import { getFull, update, getPublic } from '../services/configService.js';
import { str } from '../utils/sanitize.js';
export function setMaintenance(req, res) {
  const m = getFull().maintenance;
  const b = req.body || {};
  update({ maintenance: { enabled: !!b.enabled, message: { ar: str(b.message?.ar ?? m.message.ar, 300), en: str(b.message?.en ?? m.message.en, 300) } } }, 'Maintenance');
  res.json({ mode: getPublic().mode });
}
