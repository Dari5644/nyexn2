export function computeMode(cfg) {
  if (cfg.panic?.enabled) return 'panic';
  const live = !!cfg.live?.isLive;
  if (cfg.maintenance?.enabled) return live ? 'live-only' : 'maintenance';
  if (cfg.maintenance?.autoWhenOffline) return live ? 'normal' : 'maintenance';
  return 'normal';
}
