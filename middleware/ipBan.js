import * as repo from '../db/securityRepo.js';
import { realIp } from '../utils/ip.js';
let banned = new Set(repo.bans().map(b => b.ip));
export const reloadBans = () => { banned = new Set(repo.bans().map(b => b.ip)); };
export function ipBan(req, res, next) {
  if (banned.has(realIp(req))) return res.status(403).json({ error: 'Access denied' });
  next();
}
