import { logger } from '../utils/logger.js';
export function errorHandler(err, _req, res, _next) {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) logger.error(err);
  res.status(status).json({ error: status >= 500 ? 'Server error' : err.message, ...(status < 500 && err.data ? err.data : {}) });
}
