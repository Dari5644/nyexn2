export function applySchema(db) {
  db.pragma('journal_mode = WAL');
  db.exec(`
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL DEFAULT (datetime('now')), label TEXT NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT NOT NULL UNIQUE, original TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, kind TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS visitors (id INTEGER PRIMARY KEY AUTOINCREMENT, sid TEXT NOT NULL UNIQUE, ip TEXT NOT NULL, ua TEXT, device TEXT, os TEXT, browser TEXT, path TEXT, lang TEXT, referrer TEXT, entered_at INTEGER NOT NULL, last_seen INTEGER NOT NULL, left_at INTEGER);
  CREATE INDEX IF NOT EXISTS idx_visitors_ip ON visitors(ip);
  CREATE INDEX IF NOT EXISTS idx_visitors_entered ON visitors(entered_at);
  CREATE TABLE IF NOT EXISTS ip_bans (ip TEXT PRIMARY KEY, reason TEXT, banned_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS discord_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, type TEXT NOT NULL, user_id TEXT, user_name TEXT, channel_id TEXT, content TEXT);
  CREATE INDEX IF NOT EXISTS idx_dlogs_type ON discord_logs(type);
  CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id TEXT UNIQUE, user_id TEXT NOT NULL, user_name TEXT, status TEXT NOT NULL DEFAULT 'open', opened_at INTEGER NOT NULL, closed_at INTEGER, closed_by TEXT);
  `);
}
