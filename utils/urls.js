import { env } from '../config/env.js';
const first = v => (v ? String(v).split(',')[0].trim() : '');
export function urls(req) {
  const base = env.redirectUri
    ? new URL(env.redirectUri).origin
    : `${first(req.get('x-forwarded-proto')) || req.protocol}://${first(req.get('x-forwarded-host')) || req.get('host')}`;
  return { apiBase: base, redirectUri: env.redirectUri || `${base}/api/kick/oauth/callback`, webhookUrl: `${base}/api/kick/webhook` };
}
