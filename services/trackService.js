import * as repo from '../db/securityRepo.js';
import { realIp } from '../utils/ip.js';
import { parseUA } from '../utils/device.js';
import { str } from '../utils/sanitize.js';
import { HttpError } from '../utils/httpError.js';
const sidOf = req => { const s = req.body?.sid; if (typeof s !== 'string' || !/^[\w-]{8,64}$/.test(s)) throw new HttpError(400, 'Invalid session'); return s; };
export function enter(req) {
  const ua = str(req.get('user-agent'), 300);
  repo.upsertVisit({ sid: sidOf(req), ip: realIp(req), ua, ...parseUA(ua), path: str(req.body.path, 200), lang: str(req.body.lang, 10), referrer: str(req.body.referrer, 300), now: Date.now() });
}
export const heartbeat = req => repo.touch(sidOf(req), Date.now());
export const leave = req => repo.leave(sidOf(req), Date.now());
