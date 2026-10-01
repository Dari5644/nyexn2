import * as s from '../services/sectionService.js';
export const add = (req, res) => res.json(s.addCustom(req.body || {}));
export const reorder = (req, res) => res.json(s.reorder(req.body?.ids));
export const visibility = (req, res) => res.json(s.setVisible(req.params.id, req.body?.visible));
export const edit = (req, res) => res.json(s.updateCustom(req.params.id, req.body || {}));
export const remove = (req, res) => res.json(s.removeCustom(req.params.id));
