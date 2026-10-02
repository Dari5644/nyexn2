import { buildAuthUrl, consumeState, complete, saveAuth, getAuth, status, disconnect, safeReturnTo } from '../services/kickAuthService.js';
import { signAdmin } from '../services/authService.js';
import { getFull } from '../services/configService.js';
import { subscribe } from '../services/kickChatApi.js';
import { upsertGuardian } from '../services/modsService.js';
import { setKick as setStaffKick } from '../db/staffRepo.js';
import { urls } from '../utils/urls.js';
import { env } from '../config/env.js';
import { KICK_SCOPES } from '../config/constants.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
const redirectUri = req => urls(req).redirectUri;
export const info = (req, res) => res.json({ ...urls(req), scopes: KICK_SCOPES, channel: getFull().kick.channel, env: { clientId: !!env.kickClientId, clientSecret: !!env.kickClientSecret } });
export const authStatus = (_q, res) => res.json(status());
export const authDisconnect = (_q, res) => { disconnect(); res.json({ ok: true }); };
export const connectUrl = (req, res) => res.json({ url: buildAuthUrl({ purpose: 'connect', redirectUri: redirectUri(req), returnTo: safeReturnTo(req.query.returnTo) }) });
export function loginUrl(req, res) {
  if (env.origin === '*') throw new HttpError(400, 'Set FRONTEND_ORIGIN on the backend to enable Kick login');
  if (!getAuth()) throw new HttpError(400, 'Connect a Kick account from the admin panel first');
  res.json({ url: buildAuthUrl({ purpose: 'login', redirectUri: redirectUri(req), returnTo: safeReturnTo() }) });
}
export async function callback(req, res) {
  const { code, state, error } = req.query;
  const p = consumeState(String(state || ''));
  if (!p) return res.status(400).send('Invalid or expired Kick login state. Close this tab and try again.');
  const back = q => res.redirect(`${p.returnTo}/admin${q}`);
  if (error || !code) return back('?kick=error');
  try {
    const { tok, me } = await complete(p, String(code));
    if (p.purpose === 'staff') { setStaffKick(p.extra.staffId, me.user_id, me.name); return back('?kick=linked'); }
    if (p.purpose === 'guardian') {
      const g = upsertGuardian({ id: me.user_id, name: me.name, username: me.name, avatar: me.profile_picture || '', source: 'linked' });
      return res.redirect(`${p.returnTo}/?guardian=${g.approved ? 'ok' : 'pending'}`);
    }
    if (p.purpose === 'connect') { saveAuth(tok, me); subscribe().catch(e => logger.warn('Auto-subscribe failed:', e.message)); return back('?kick=connected'); }
    const owner = getAuth()?.userId;
    return owner && String(owner) === String(me.user_id) ? back(`#kick_token=${signAdmin()}`) : back('?kick=denied');
  } catch (e) { logger.warn('Kick callback failed:', e.message); return back('?kick=error'); }
}
export const guardianUrl = (req, res) => res.json({ url: buildAuthUrl({ purpose: 'guardian', redirectUri: redirectUri(req), returnTo: safeReturnTo(req.query.returnTo), scopes: ['user:read'] }) });
