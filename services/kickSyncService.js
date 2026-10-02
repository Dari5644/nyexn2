import * as kick from './kickService.js';
import { getFull, saveQuiet, save } from './configService.js';
import { announceLive } from './discordBot.js';
import { announce as notify } from './pushService.js';
import { autoArchive } from './mediaService.js';
export function liveFromChannel(ch) {
  return { isLive: !!ch?.stream?.is_live, title: ch?.stream_title || '', viewers: ch?.stream?.viewer_count || 0, category: ch?.category?.name || '' };
}
const fmtDuration = ms => { const m = Math.round((ms || 0) / 60000); return `${Math.floor(m / 60)}h ${m % 60}m`; };
export async function syncAll() {
  const cfg = getFull();
  const ch = await kick.getChannel(cfg.kick.channel);
  const extras = await kick.getWebExtras(cfg.kick.channel);
  const v = (Array.isArray(extras.videos) ? extras.videos : extras.videos?.data || [])[0];
  const clipList = extras.clips?.clips || extras.clips?.data || [];
  const next = { ...cfg, live: liveFromChannel(ch) };
  if (extras.info?.followers_count != null) next.kick = { ...cfg.kick, followers: extras.info.followers_count };
  if (v) next.session = { title: v.session_title || v.title || '', thumbnail: v.thumbnail?.src || v.thumbnail || '', duration: fmtDuration(v.duration), startedAt: v.created_at || v.start_time || '', views: v.views ?? 0, category: v.categories?.[0]?.name || next.live.category, vodUrl: v.video?.uuid ? `${cfg.kick.url}/videos/${v.video.uuid}` : cfg.kick.url };
  if (clipList.length) next.clips = clipList.slice(0, 12).map(c => ({ id: String(c.id), title: c.title || '', thumbnail: c.thumbnail_url || '', url: c.clip_url || c.video_url || '', mp4: c.video_url || c.clip_url || '', views: c.views ?? 0 }));
  save(next, 'Kick sync');
  if (next.stream?.autoArchiveClips) autoArchive().catch(() => {});
  return { live: next.live, clips: next.clips.length, hasSession: !!v, followers: next.kick.followers };
}
export async function refreshLive() {
  const cfg = getFull();
  const live = liveFromChannel(await kick.getChannel(cfg.kick.channel));
  if (JSON.stringify(live) !== JSON.stringify(cfg.live)) { saveQuiet({ ...cfg, live }); if (live.isLive && !cfg.live.isLive) { announceLive(live).catch(() => {}); if (cfg.notify?.onLive) notify({ title: `🔴 ${cfg.kick.channel} is LIVE`, body: live.title || '', url: '/' }).catch(() => {}); } return { changed: true, live }; }
  return { changed: false, live };
}
export async function refreshFollowers() {
  const cfg = getFull();
  const ex = await kick.getWebExtras(cfg.kick.channel);
  const n = ex.info?.followers_count;
  if (n != null && n !== cfg.kick.followers) saveQuiet({ ...cfg, kick: { ...cfg.kick, followers: n } });
  return n ?? null;
}
