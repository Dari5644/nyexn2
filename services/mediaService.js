import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from '../db/index.js';
import * as assets from '../db/assetRepo.js';
import { getFull, saveQuiet } from './configService.js';
import * as kick from './kickService.js';
import { safeFetch, downloadToFile } from '../utils/safeFetch.js';
import { randomHex } from '../utils/ids.js';
import { HttpError } from '../utils/httpError.js';
async function saveRemote(url, { maxBytes, timeout, ext, kind, mimeCheck }) {
  const { res } = await safeFetch(url, { maxBytes, timeout });
  const type = (res.headers.get('content-type') || '').split(';')[0];
  if (mimeCheck && !mimeCheck.test(type)) throw new HttpError(415, `Unexpected content type: ${type || 'unknown'}`);
  const filename = `${kind}_${randomHex(8)}${ext}`;
  const size = await downloadToFile(res, path.join(UPLOAD_DIR, filename), maxBytes);
  assets.add({ filename, original: filename, mime: type || 'application/octet-stream', size, kind });
  return { filename, url: `/uploads/${filename}`, size };
}
const thumbOf = t => (typeof t === 'string' ? t : t?.url || t?.src || '');
export async function snapshot() {
  const cfg = getFull(), ch = await kick.getChannel(cfg.kick.channel);
  if (!ch?.stream?.is_live) throw new HttpError(409, 'The channel is not live right now');
  let u = thumbOf(ch.stream.thumbnail);
  if (!u) u = thumbOf((await kick.getWebExtras(cfg.kick.channel)).info?.livestream?.thumbnail);
  if (!u) throw new HttpError(404, 'Kick did not provide a thumbnail for this stream');
  return { ...(await saveRemote(u, { maxBytes: 6e6, timeout: 15000, ext: '.jpg', kind: 'snapshot', mimeCheck: /^image\//i })), at: Date.now() };
}
export const listSnapshots = () => assets.list().filter(a => a.kind === 'snapshot').map(a => ({ id: a.id, url: `/uploads/${a.filename}`, at: a.created_at, size: a.size }));
export async function archiveClip(id) {
  const cfg = getFull();
  if (cfg.clipArchive.some(c => c.id === String(id))) return { already: true };
  const c = cfg.clips.find(x => String(x.id) === String(id));
  if (!c) throw new HttpError(404, 'Clip not found in the latest sync');
  const src = c.mp4 || c.url;
  if (!/\.mp4(\?|#|$)/i.test(src || '')) throw new HttpError(400, 'Only direct MP4 clips can be archived (HLS streams need ffmpeg)');
  const v = await saveRemote(src, { maxBytes: 400e6, timeout: 300000, ext: '.mp4', kind: 'clip', mimeCheck: /^(video\/|application\/octet-stream)/i });
  let thumb = '';
  try { if (c.thumbnail) thumb = (await saveRemote(c.thumbnail, { maxBytes: 5e6, timeout: 15000, ext: '.jpg', kind: 'clipthumb', mimeCheck: /^image\//i })).url; } catch {}
  const fresh = getFull();
  fresh.clipArchive.unshift({ id: String(c.id), title: c.title, thumbnail: thumb || c.thumbnail, localUrl: v.url, size: v.size, views: c.views, archivedAt: Date.now(), source: src });
  saveQuiet(fresh);
  return fresh.clipArchive[0];
}
export async function autoArchive() {
  const cfg = getFull(); let n = 0;
  for (const c of cfg.clips) { if (n >= 3) break; if (cfg.clipArchive.some(a => a.id === String(c.id))) continue; try { await archiveClip(c.id); n++; } catch {} }
}
export function removeArchived(id) {
  const cfg = getFull(), c = cfg.clipArchive.find(x => x.id === String(id));
  if (!c) throw new HttpError(404, 'Archived clip not found');
  for (const u of [c.localUrl, c.thumbnail]) { const f = path.basename(String(u || '')); const a = f && assets.byFilename(f); if (a) { fs.rmSync(path.join(UPLOAD_DIR, a.filename), { force: true }); assets.remove(a.id); } }
  cfg.clipArchive = cfg.clipArchive.filter(x => x.id !== String(id));
  saveQuiet(cfg);
  return { ok: true };
}
