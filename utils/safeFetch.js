import dns from 'dns/promises';
import fs from 'fs';
import net from 'net';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { HttpError } from './httpError.js';
const priv = ip => {
  if (net.isIPv4(ip)) { const [a, b] = ip.split('.').map(Number); return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224; }
  const l = ip.toLowerCase(); return l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80') || l.startsWith('::ffff:');
};
export async function assertPublicUrl(u) {
  let url; try { url = new URL(u); } catch { throw new HttpError(400, 'Invalid URL'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new HttpError(400, 'Only http(s) URLs are allowed');
  const addrs = await dns.lookup(url.hostname, { all: true }).catch(() => []);
  if (!addrs.length || addrs.some(a => priv(a.address))) throw new HttpError(400, 'URL points to a private or unreachable address');
  return url;
}
export async function safeFetch(u, { maxBytes = 2e6, timeout = 10000, accept } = {}) {
  let next = u;
  for (let i = 0; i < 4; i++) {
    const url = await assertPublicUrl(next);
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(timeout), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NYEXN2Bot/1.0)', ...(accept ? { Accept: accept } : {}) } }).catch(e => { throw new HttpError(502, `Request failed: ${e.cause?.code || e.message}`); });
    if ([301, 302, 303, 307, 308].includes(res.status)) { const loc = res.headers.get('location'); if (!loc) throw new HttpError(502, 'Bad redirect'); next = new URL(loc, url).toString(); continue; }
    if (!res.ok) throw new HttpError(502, `Remote server answered ${res.status}`);
    if (Number(res.headers.get('content-length') || 0) > maxBytes) throw new HttpError(413, 'Remote file is too large');
    return { res, url: url.toString() };
  }
  throw new HttpError(508, 'Too many redirects');
}
export async function readLimited(res, maxBytes) {
  const chunks = []; let n = 0;
  for await (const c of res.body) { n += c.length; if (n > maxBytes) throw new HttpError(413, 'Remote file is too large'); chunks.push(c); }
  return Buffer.concat(chunks);
}
export async function downloadToFile(res, file, maxBytes) {
  let n = 0;
  const counter = new Transform({ transform(chunk, _e, cb) { n += chunk.length; n > maxBytes ? cb(new HttpError(413, 'Remote file is too large')) : cb(null, chunk); } });
  try { await pipeline(Readable.fromWeb(res.body), counter, fs.createWriteStream(file)); } catch (e) { fs.rmSync(file, { force: true }); throw e; }
  return n;
}
