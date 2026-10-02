import { KEY_AREA } from '../utils/permissions.js';
import { HttpError } from '../utils/httpError.js';
import { urls } from '../utils/urls.js';
import { getFull, getPublic, update } from '../services/configService.js';
export const publicConfig = (req, res) => res.json({ ...getPublic(), urls: urls(req) });
export const adminConfig = (req, res) => { const c = getFull(); res.json({ ...c, secrets: req.user?.role === 'staff' ? {} : { ...c.secrets, kickClientId: '', kickClientSecret: '' } }); };
export const saveConfig = (req, res) => {
  if (req.user?.role === 'staff') for (const k of Object.keys(req.body || {})) if (req.user.perms[KEY_AREA[k]] !== 'edit') throw new HttpError(403, `No edit permission for "${k}"`);
  return saveConfigNow(req, res);
};
const saveConfigNow = (req, res) => res.json(update(req.body, String(req.query.label || 'Edit').slice(0, 80)));
