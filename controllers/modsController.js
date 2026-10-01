import * as m from '../services/modsService.js';
export const list = (_q, res) => res.json({ guardians: m.listAll() });
export const approve = (req, res) => res.json(m.setApproved(req.params.id, req.body?.approved));
export const hide = (req, res) => res.json(m.setHidden(req.params.id, req.body?.hidden));
export const override = (req, res) => res.json(m.setOverride(req.params.id, req.body || {}));
export const remove = (req, res) => res.json(m.remove(req.params.id));
export const settings = (req, res) => res.json(m.setAutoApprove(req.body?.autoApprove));
