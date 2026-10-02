// Field-level diff / apply. Paths: a.b.c  |  list#itemId.field  |  list@order
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const idArr = a => Array.isArray(a) && a.length > 0 && a.every(x => isObj(x) && typeof x.id === 'string');
export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const IGNORE = ['secrets', 'live', 'session', 'clips', 'clipArchive', 'mods.synced', 'kick.followers', 'kick.recent'];
const ignored = p => IGNORE.some(i => p === i || p.startsWith(i + '.') || p.startsWith(i + '#'));
export function diff(a, b, base = '', out = []) {
  if (isObj(a) && isObj(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const p = base ? `${base}.${k}` : k;
      if (ignored(p)) continue;
      if (!(k in b)) out.push({ path: p, old: a[k], new: undefined });
      else if (!(k in a)) out.push({ path: p, old: undefined, new: b[k] });
      else diff(a[k], b[k], p, out);
    }
  } else if (idArr(a) && idArr(b)) {
    const am = new Map(a.map(x => [x.id, x])), bm = new Map(b.map(x => [x.id, x]));
    for (const [id, x] of am) { const p = `${base}#${id}`; if (!bm.has(id)) out.push({ path: p, old: x, new: undefined }); else diff(x, bm.get(id), p, out); }
    for (const [id, x] of bm) if (!am.has(id)) out.push({ path: `${base}#${id}`, old: undefined, new: x });
    const ao = a.filter(x => bm.has(x.id)).map(x => x.id), bo = b.filter(x => am.has(x.id)).map(x => x.id);
    if (!same(ao, bo)) out.push({ path: `${base}@order`, old: ao, new: bo });
  } else if (!same(a, b) && !ignored(base)) out.push({ path: base, old: a, new: b });
  return out;
}
const tokens = p => p.replace(/#/g, '.#').replace(/@order$/, '.@order').split('.').filter(Boolean);
export function getAt(obj, path) {
  let cur = obj;
  for (const t of tokens(path)) {
    if (cur == null) return undefined;
    if (t.startsWith('#')) cur = Array.isArray(cur) ? cur.find(x => x.id === t.slice(1)) : undefined;
    else if (t === '@order') return Array.isArray(cur) ? cur.map(x => x.id) : undefined;
    else cur = cur[t];
  }
  return cur;
}
export function setAt(obj, path, value) {
  const t = tokens(path); let cur = obj;
  for (let i = 0; i < t.length - 1; i++) {
    const k = t[i];
    if (k.startsWith('#')) cur = Array.isArray(cur) ? cur.find(x => x.id === k.slice(1)) : undefined;
    else { if (cur[k] == null) cur[k] = {}; cur = cur[k]; }
    if (cur == null) return false;
  }
  const last = t[t.length - 1];
  if (last === '@order') { const pos = x => { const i = value.indexOf(x.id); return i < 0 ? 1e9 : i; }; cur.sort((x, y) => pos(x) - pos(y)); return true; }
  if (last.startsWith('#')) {
    const id = last.slice(1), i = cur.findIndex(x => x.id === id);
    if (value === undefined) { if (i >= 0) cur.splice(i, 1); } else if (i >= 0) cur[i] = value; else cur.push(value);
    return true;
  }
  if (value === undefined) delete cur[last]; else cur[last] = value;
  return true;
}
export const isDeletion = e => (e.old !== undefined && e.new === undefined) || (Array.isArray(e.old) && Array.isArray(e.new) && e.new.length < e.old.length);
