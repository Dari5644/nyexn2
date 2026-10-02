import fs from 'fs';
import path from 'path';
import * as repo from '../db/assetRepo.js';
import { UPLOAD_DIR } from '../db/index.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { getFull, save } from './configService.js';
import { isPlainObject, safeFilename } from '../utils/sanitize.js';
import { HttpError } from '../utils/httpError.js';
export function exportBackup() {
  const assets = repo.list().filter(a => ['image', 'snapshot'].includes(a.kind)).map(a => {
    const p = path.join(UPLOAD_DIR, a.filename);
    return { ...a, base64: fs.existsSync(p) ? fs.readFileSync(p).toString('base64') : null };
  });
  return { app: 'nyexn2', version: 1, exportedAt: new Date().toISOString(), config: { ...getFull(), secrets: { ...getFull().secrets, kickClientId: '', kickClientSecret: '' } }, assets };
}
export function restoreBackup(payload) {
  if (!isPlainObject(payload) || payload.app !== 'nyexn2' || !isPlainObject(payload.config)) throw new HttpError(400, 'Invalid backup file');
  for (const a of Array.isArray(payload.assets) ? payload.assets : []) {
    if (!a.base64 || !safeFilename(a.filename)) continue;
    fs.writeFileSync(path.join(UPLOAD_DIR, a.filename), Buffer.from(a.base64, 'base64'));
    repo.add({ filename: a.filename, original: a.original || a.filename, mime: a.mime || 'application/octet-stream', size: a.size || 0, kind: a.kind || 'image' });
  }
  return save({ ...structuredClone(DEFAULT_CONFIG), ...payload.config }, 'Restored from backup');
}
