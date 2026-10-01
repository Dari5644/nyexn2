import { syncAll, refreshLive } from '../services/kickSyncService.js';
import { getChannelDetails } from '../services/kickService.js';
import { getFull, save } from '../services/configService.js';
import { HttpError } from '../utils/httpError.js';
export const sync = async (_q, res) => res.json(await syncAll());
export const liveStatus = async (_q, res) => res.json(await refreshLive());
const validSlug = s => typeof s === 'string' && /^[\w-]{2,40}$/.test(s.trim());
export async function channelInfo(req, res) {
  if (!validSlug(req.query.slug)) throw new HttpError(400, 'Invalid channel name');
  res.json(await getChannelDetails(req.query.slug.trim().toLowerCase()));
}
export async function selectChannel(req, res) {
  if (!validSlug(req.body?.slug)) throw new HttpError(400, 'Invalid channel name');
  const d = await getChannelDetails(req.body.slug.trim().toLowerCase());
  const cfg = getFull();
  const recent = [{ slug: d.slug, name: d.name, avatar: d.avatar }, ...(cfg.kick.recent || []).filter(r => r.slug !== d.slug)].slice(0, 6);
  save({ ...cfg, kick: { ...cfg.kick, channel: d.slug, url: `https://kick.com/${d.slug}`, custom: true, followers: d.followers ?? cfg.kick.followers, recent } }, 'Channel selected');
  res.json(d);
}
