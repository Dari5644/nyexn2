import crypto from 'crypto';
import { KICK, KICK_SCOPES } from '../config/constants.js';
import { env } from '../config/env.js';
import * as kv from '../db/kvRepo.js';
import { getFull } from './configService.js';
import { HttpError } from '../utils/httpError.js';
const pending = new Map();
const b64u = b => b.toString('base64url');
const AUTH_KEY = 'kick_auth';

export function safeReturnTo(v) {
  if (env.origin !== '*') return env.origin.replace(/\/$/, '');
  try { const u = new URL(String(v)); return ['http:', 'https:'].includes(u.protocol) ? u.origin : null; } catch { return null; }
}
export function buildAuthUrl({ purpose, redirectUri, returnTo, scopes }) {
  const s = getFull().secrets;
  if (!s.kickClientId || !s.kickClientSecret) throw new HttpError(400, 'Save Kick Client ID and Secret first');
  if (!returnTo) throw new HttpError(400, 'Invalid returnTo');
  for (const [k, p] of pending) if (p.exp < Date.now()) pending.delete(k);
  const verifier = b64u(crypto.randomBytes(48));
  const state = b64u(crypto.randomBytes(16));
  pending.set(state, { verifier, purpose, redirectUri, returnTo, exp: Date.now() + 10 * 60000 });
  const q = new URLSearchParams({ client_id: s.kickClientId, redirect_uri: redirectUri, response_type: 'code', scope: (scopes || KICK_SCOPES).join(' '),
    code_challenge: b64u(crypto.createHash('sha256').update(verifier).digest()), code_challenge_method: 'S256', state });
  return `${KICK.authorize}?${q}`;
}
export function consumeState(state) {
  const p = pending.get(state); pending.delete(state);
  return p && p.exp > Date.now() ? p : null;
}
async function tokenRequest(params) {
  const r = await fetch(KICK.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, `Kick token error (${r.status}) ${j.error_description || j.error || ''}`.trim());
  return j;
}
async function fetchMe(access) {
  const r = await fetch(`${KICK.api}/users`, { headers: { Authorization: `Bearer ${access}` } });
  if (!r.ok) throw new HttpError(502, `Kick user lookup failed (${r.status})`);
  return (await r.json()).data?.[0];
}
export async function complete(p, code) {
  const s = getFull().secrets;
  const tok = await tokenRequest({ grant_type: 'authorization_code', client_id: s.kickClientId, client_secret: s.kickClientSecret, redirect_uri: p.redirectUri, code_verifier: p.verifier, code });
  const me = await fetchMe(tok.access_token);
  if (!me?.user_id) throw new HttpError(502, 'Could not read Kick user');
  return { tok, me };
}
export function saveAuth(tok, me) {
  kv.set(AUTH_KEY, { accessToken: tok.access_token, refreshToken: tok.refresh_token, expiresAt: Date.now() + (tok.expires_in || 3600) * 1000, scope: tok.scope || '', userId: me.user_id, username: me.name });
}
export const getAuth = () => kv.get(AUTH_KEY);
export async function getUserToken() {
  const a = getAuth();
  if (!a) throw new HttpError(400, 'Kick account is not connected');
  if (Date.now() < a.expiresAt - 60000) return a.accessToken;
  const s = getFull().secrets;
  const tok = await tokenRequest({ grant_type: 'refresh_token', client_id: s.kickClientId, client_secret: s.kickClientSecret, refresh_token: a.refreshToken });
  kv.set(AUTH_KEY, { ...a, accessToken: tok.access_token, refreshToken: tok.refresh_token || a.refreshToken, expiresAt: Date.now() + (tok.expires_in || 3600) * 1000 });
  return tok.access_token;
}
export function status() {
  const a = getAuth();
  return { connected: !!a, username: a?.username || '', userId: a?.userId || null, scope: a?.scope || '', expiresAt: a?.expiresAt || 0 };
}
export const disconnect = () => kv.del(AUTH_KEY);
