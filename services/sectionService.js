import { getFull, save } from './configService.js';
import { CUSTOM_SECTION_TYPES } from '../config/constants.js';
import { newId, randomHex } from '../utils/ids.js';
import { str } from '../utils/sanitize.js';
import { HttpError } from '../utils/httpError.js';
export function addCustom({ type, title, content }) {
  if (!CUSTOM_SECTION_TYPES.includes(type)) throw new HttpError(400, 'Invalid section type');
  const cfg = getFull();
  cfg.sections.push({ id: newId('custom'), secret: randomHex(12), type, custom: true, visible: true, title: { ar: str(title?.ar, 100), en: str(title?.en, 100) }, content: content ?? {} });
  return save(cfg, 'Section: add').sections;
}
export function reorder(ids) {
  const cfg = getFull();
  if (!Array.isArray(ids) || ids.length !== cfg.sections.length || !cfg.sections.every(s => ids.includes(s.id))) throw new HttpError(400, 'ids must list every section exactly once');
  cfg.sections = ids.map(id => cfg.sections.find(s => s.id === id));
  return save(cfg, 'Section: reorder').sections;
}
export function setVisible(id, visible) {
  const cfg = getFull();
  const s = cfg.sections.find(x => x.id === id);
  if (!s) throw new HttpError(404, 'Section not found');
  s.visible = !!visible;
  return save(cfg, 'Section: visibility').sections;
}
export function updateCustom(id, patch) {
  const cfg = getFull();
  const s = cfg.sections.find(x => x.id === id);
  if (!s) throw new HttpError(404, 'Section not found');
  if (patch.title) s.title = { ar: str(patch.title.ar, 100), en: str(patch.title.en, 100) };
  if (patch.content !== undefined && s.custom) s.content = patch.content;
  return save(cfg, 'Section: edit').sections;
}
export function removeCustom(id) {
  const cfg = getFull();
  if (!cfg.sections.some(s => s.id === id && s.custom)) throw new HttpError(404, 'Only custom sections can be removed');
  cfg.sections = cfg.sections.filter(s => s.id !== id);
  return save(cfg, 'Section: remove').sections;
}
export function regenSecret(id) {
  const cfg = getFull(); const s = cfg.sections.find(x => x.id === id);
  if (!s) throw new HttpError(404, 'Section not found');
  s.secret = randomHex(12);
  return save(cfg, 'Section: new secret URL').sections;
}
export function bySecret(secret) {
  const s = getFull().sections.find(x => x.secret && x.secret === String(secret));
  if (!s) throw new HttpError(404, 'Section not found');
  const { secret: _s, ...pub } = s;
  return pub;
}
