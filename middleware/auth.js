import { verify } from '../services/authService.js';
import { HttpError } from '../utils/httpError.js';
export function requireAdmin(req, _res, next) {
  const h = req.headers.authorization || '';
  try { verify(h.startsWith('Bearer ') ? h.slice(7) : ''); next(); }
  catch { next(new HttpError(401, 'Unauthorized')); }
}
