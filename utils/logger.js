const fmt = (l, a) => console[l === 'error' ? 'error' : 'log'](`[${new Date().toISOString()}] ${l.toUpperCase()}`, ...a);
export const logger = { info: (...a) => fmt('info', a), warn: (...a) => fmt('warn', a), error: (...a) => fmt('error', a) };
