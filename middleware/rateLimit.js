import { HttpError } from '../utils/httpError.js';
export function rateLimit(max, windowMs) {
  const hits = new Map();
  return (req, _res, next) => {
    const now = Date.now();
    const rec = (hits.get(req.ip) || []).filter(t => now - t < windowMs);
    if (rec.length >= max) return next(new HttpError(429, 'Too many requests'));
    rec.push(now); hits.set(req.ip, rec); next();
  };
}
