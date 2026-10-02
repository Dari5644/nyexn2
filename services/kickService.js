import { KICK } from '../config/constants.js';
import { getFull } from './configService.js';
import { HttpError } from '../utils/httpError.js';
let tok = { value: null, exp: 0 };
async function token() {
  const s = getFull().secrets;
  if (!s.kickClientId || !s.kickClientSecret) throw new HttpError(400, 'Kick credentials are not set');
  if (tok.value && Date.now() < tok.exp) return tok.value;
  const r = await fetch(KICK.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: s.kickClientId, client_secret: s.kickClientSecret }) });
  if (!r.ok) throw new HttpError(502, `Kick auth failed (${r.status})`);
  const j = await r.json();
  tok = { value: j.access_token, exp: Date.now() + Math.max(60, (j.expires_in || 3600) - 60) * 1000 };
  return tok.value;
}
export async function getChannel(slug) {
  const r = await fetch(`${KICK.api}/channels?slug=${encodeURIComponent(slug)}`, { headers: { Authorization: `Bearer ${await token()}` } });
  if (!r.ok) throw new HttpError(502, `Kick API error (${r.status})`);
  return (await r.json()).data?.[0] || null;
}
export async function getWebExtras(slug) {
  const get = async p => { try { const r = await fetch(`${KICK.web}/${encodeURIComponent(slug)}${p}`, { headers: { Accept: 'application/json' } }); return r.ok ? await r.json() : null; } catch { return null; } };
  const [info, videos, clips] = await Promise.all([get(''), get('/videos'), get('/clips')]);
  return { info, videos, clips };
}
export async function getChannelDetails(slug) {
  const ch = await getChannel(slug);
  if (!ch) throw new HttpError(404, 'Channel not found');
  let user = null;
  try {
    const r = await fetch(`${KICK.api}/users?id=${ch.broadcaster_user_id}`, { headers: { Authorization: `Bearer ${await token()}` } });
    if (r.ok) user = (await r.json()).data?.[0] || null;
  } catch {}
  const ex = await getWebExtras(slug);
  return {
    slug: ch.slug || slug, userId: ch.broadcaster_user_id, name: user?.name || ch.slug || slug, avatar: user?.profile_picture || ex.info?.user?.profile_pic || '',
    description: ch.channel_description || '', banner: ch.banner_picture || '', isLive: !!ch.stream?.is_live, title: ch.stream_title || '',
    viewers: ch.stream?.viewer_count || 0, category: ch.category?.name || '', followers: ex.info?.followers_count ?? null
  };
}
