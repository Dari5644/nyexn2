import { register, list, remove } from '../services/assetService.js';
export const upload = (req, res) => res.json(register(req.file));
export const listAssets = (_q, res) => res.json(list());
export const deleteAsset = (req, res) => { remove(Number(req.params.id)); res.json({ ok: true }); };
