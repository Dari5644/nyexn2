import * as cheerio from 'cheerio';
import { safeFetch, readLimited } from '../utils/safeFetch.js';
const top = (arr, n) => { const m = new Map(); arr.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0]); };
const norm = h => { h = h.toLowerCase(); return h.length === 4 ? '#' + [...h.slice(1)].map(c => c + c).join('') : h; };
export async function scrape(u) {
  const { res, url } = await safeFetch(u, { maxBytes: 1.5e6, timeout: 12000, accept: 'text/html' });
  const html = (await readLimited(res, 1.5e6)).toString('utf8');
  const $ = cheerio.load(html);
  const abs = h => { try { return new URL(h, url).toString(); } catch { return ''; } };
  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const title = clean($('meta[property="og:title"]').attr('content') || $('title').first().text()).slice(0, 120);
  const description = clean($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content')).slice(0, 220);
  const og = abs($('meta[property="og:image"]').attr('content') || '');
  const headings = $('h1,h2,h3').map((_, e) => clean($(e).text())).get().filter(t => t.length > 2 && t.length < 90).slice(0, 6);
  const buttons = $('a,button').filter((_, e) => /btn|button|cta/i.test($(e).attr('class') || '') || $(e).attr('role') === 'button').map((_, e) => ({ label: clean($(e).text()).slice(0, 30), url: abs($(e).attr('href') || '') })).get().filter(b => b.label && b.label.length > 1).slice(0, 4);
  const images = [og, ...$('img').map((_, e) => abs($(e).attr('src') || '')).get()].filter(x => /^https?:/.test(x) && !/\.(svg|gif)(\?|$)/i.test(x)).slice(0, 3);
  const css = $('style').map((_, e) => $(e).text()).get().join(' ') + ' ' + $('[style]').map((_, e) => $(e).attr('style')).get().join(' ') + ' ' + ($('meta[name="theme-color"]').attr('content') || '');
  const palette = top((css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).map(norm).filter(c => !['#ffffff', '#000000', '#fff'].includes(c)), 5);
  const fonts = top((css.match(/font-family\s*:\s*([^;}"]+)/gi) || []).map(f => f.split(':')[1].split(',')[0].replace(/["']/g, '').trim()).filter(Boolean), 3);
  let id = 0; const el = o => ({ id: `e${Date.now().toString(36)}${id++}`, rot: 0, ...o });
  const elements = [];
  let y = 50;
  if (title) { elements.push(el({ type: 'text', x: 80, y, w: 840, h: 100, z: 1, props: { text: { ar: title, en: title }, size: 52, weight: 800, align: 'center', color: '#ffffff' } })); y += 120; }
  if (description) { elements.push(el({ type: 'text', x: 120, y, w: 760, h: 80, z: 1, props: { text: { ar: description, en: description }, size: 24, weight: 400, align: 'center', color: 'rgba(255,255,255,.75)' } })); y += 110; }
  if (images[0]) { elements.push(el({ type: 'image', x: 150, y, w: 700, h: 360, z: 1, props: { src: images[0], radius: 24, fit: 'cover' } })); y += 400; }
  buttons.forEach((b, i) => { elements.push(el({ type: 'button', x: 330, y: y + i * 90, w: 340, h: 70, z: 2, props: { label: { ar: b.label, en: b.label }, url: b.url, style: i === 0 ? 'neon' : 'glass' } })); });
  y += buttons.length * 90 + 20;
  return { source: url, title, description, headings, palette, fonts, canvas: { w: 1000, h: Math.max(500, y + 30), bg: { type: 'transparent' } }, elements };
}
