import { env } from '../config/env.js';
import { getFull } from './configService.js';
import { refreshLive, refreshFollowers } from './kickSyncService.js';
import { logger } from '../utils/logger.js';
export function start() {
  let n = 0;
  setInterval(async () => {
    const s = getFull().secrets;
    if (!s.kickClientId || !s.kickClientSecret) return;
    try { await refreshLive(); if (n++ % 10 === 0) await refreshFollowers(); } catch (e) { logger.warn('Live poll failed:', e.message); }
  }, env.pollMs);
}
