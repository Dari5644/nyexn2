import * as s from '../services/securityService.js';
import { realIp } from '../utils/ip.js';
export const visitors = (req, res) => res.json(s.visitors(req.query));
export const stats = (_q, res) => res.json(s.stats());
export const bans = (_q, res) => res.json(s.bans());
export const ban = (req, res) => res.json(s.ban(req.body?.ip, req.body?.reason, realIp(req)));
export const unban = (req, res) => res.json(s.unban(req.query.ip));
export const myIp = (req, res) => res.json({ ip: realIp(req) });
