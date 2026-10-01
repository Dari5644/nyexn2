import { KICK } from '../config/constants.js';
import { getUserToken } from './kickAuthService.js';
import { getChannel } from './kickService.js';
import { getFull } from './configService.js';
import { HttpError } from '../utils/httpError.js';
let cached = { slug: '', id: null };
let pubKey = null;
export async function broadcasterId() {
  const slug = getFull().kick.channel;
  if (cached.slug === slug && cached.id) return cached.id;
  const ch = await getChannel(slug);
  if (!ch?.broadcaster_user_id) throw new HttpError(404, 'Kick channel not found');
  cached = { slug, id: ch.broadcaster_user_id };
  return cached.id;
}
async function call(path, { method = 'GET', body } = {}) {
  const r = await fetch(KICK.api + path, { method, headers: { Authorization: `Bearer ${await getUserToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, `Kick API ${r.status}: ${j.message || j.error || ''}`.trim());
  return j;
}
export async function sendChat(content) {
  return call('/chat', { method: 'POST', body: { broadcaster_user_id: await broadcasterId(), content: String(content).slice(0, 500), type: 'user' } });
}
export async function subscribe(events = ['chat.message.sent', 'livestream.status.updated']) {
  return call('/events/subscriptions', { method: 'POST', body: { broadcaster_user_id: await broadcasterId(), events: events.map(name => ({ name, version: 1 })), method: 'webhook' } });
}
export const listSubscriptions = () => call('/events/subscriptions');
export async function publicKey() {
  if (pubKey) return pubKey;
  const r = await fetch(`${KICK.api}/public-key`);
  if (!r.ok) throw new HttpError(502, 'Could not fetch Kick public key');
  pubKey = (await r.json()).data?.public_key;
  if (!pubKey) throw new HttpError(502, 'Kick public key missing');
  return pubKey;
}
