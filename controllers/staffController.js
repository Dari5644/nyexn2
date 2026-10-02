import * as s from '../services/staffService.js';
import * as audit from '../services/auditService.js';
import { buildAuthUrl, safeReturnTo } from '../services/kickAuthService.js';
import { urls } from '../utils/urls.js';
import { HttpError } from '../utils/httpError.js';
const master = req => { if (req.user.role !== 'admin') throw new HttpError(403, 'Manager only'); };
export const me = (req, res) => res.json(s.me(req.user));
export const list = (req, res) => { master(req); res.json(s.list()); };
export const create = (req, res) => { master(req); res.json(s.create(req.body || {}, req.user.name)); };
export const update = (req, res) => { master(req); res.json(s.update(req.params.id, req.body || {})); };
export const remove = (req, res) => { master(req); res.json(s.remove(req.params.id)); };
export const devices = (req, res) => { master(req); res.json(s.devices(req.params.id)); };
export const setDevice = (req, res) => { master(req); res.json(s.setDevice(req.params.id, req.body || {})); };
export const auditList = (req, res) => { master(req); res.json(audit.listAudit(req.query)); };
export const kickUrl = (req, res) => {
  if (req.user.role !== 'staff') throw new HttpError(400, 'Staff accounts only');
  res.json({ url: buildAuthUrl({ purpose: 'staff', redirectUri: urls(req).redirectUri, returnTo: safeReturnTo(req.query.returnTo), scopes: ['user:read'], extra: { staffId: req.user.id } }) });
};
