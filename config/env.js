import 'dotenv/config';
const need = k => { if (!process.env[k]) throw new Error(`Missing env var ${k}`); return process.env[k]; };
export const env = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: need('JWT_SECRET'),
  adminPassword: need('ADMIN_PASSWORD'),
  origin: process.env.FRONTEND_ORIGIN || '*',
  redirectUri: process.env.KICK_REDIRECT_URI || '',
  trustProxy: Number(process.env.TRUST_PROXY) || 1,
  adminUsername: (process.env.ADMIN_USERNAME || 'admin').trim(),
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  kickClientId: process.env.KICK_CLIENT_ID || '',
  kickClientSecret: process.env.KICK_CLIENT_SECRET || '',
  kickChannel: (process.env.KICK_CHANNEL || '').trim().toLowerCase(),
  discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
  discordGuildId: process.env.DISCORD_GUILD_ID || '',
  discordProxy: process.env.DISCORD_PROXY_URL || '',
  dataDir: process.env.DATA_DIR || './data',
  pollMs: Number(process.env.KICK_POLL_MS) || 60000
};
if (env.jwtSecret.length < 16) throw new Error('JWT_SECRET must be at least 16 chars');
if (!env.kickClientId || !env.kickClientSecret) console.warn('[warn] KICK_CLIENT_ID / KICK_CLIENT_SECRET are not set: Kick features are disabled');
