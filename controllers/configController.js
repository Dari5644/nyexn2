import { urls } from '../utils/urls.js';
import { getFull, getPublic, update } from '../services/configService.js';
export const publicConfig = (req, res) => res.json({ ...getPublic(), urls: urls(req) });
export const adminConfig = (_q, res) => { const c = getFull(); res.json({ ...c, secrets: { ...c.secrets, kickClientId: '', kickClientSecret: '' } }); };
export const saveConfig = (req, res) => res.json(update(req.body, String(req.query.label || 'Edit').slice(0, 80)));
