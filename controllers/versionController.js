import { list, revert } from '../services/versionService.js';
export const listVersions = (_q, res) => res.json(list());
export const revertVersion = (req, res) => { revert(Number(req.params.id)); res.json({ ok: true }); };
