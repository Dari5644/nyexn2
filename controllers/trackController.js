import * as t from '../services/trackService.js';
export const enter = (req, res) => { t.enter(req); res.json({ ok: true }); };
export const heartbeat = (req, res) => { t.heartbeat(req); res.json({ ok: true }); };
export const leave = (req, res) => { t.leave(req); res.json({ ok: true }); };
