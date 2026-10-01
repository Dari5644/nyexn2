import fs from 'fs';
import path from 'path';
import * as repo from '../db/assetRepo.js';
import { UPLOAD_DIR } from '../db/index.js';
import { ALLOWED_MIME } from '../config/constants.js';
import { HttpError } from '../utils/httpError.js';
export function register(file) {
  if (!file) throw new HttpError(400, 'No file uploaded');
  const kind = ALLOWED_MIME[file.mimetype];
  repo.add({ filename: file.filename, original: file.originalname, mime: file.mimetype, size: file.size, kind });
  return { url: `/uploads/${file.filename}`, kind, name: file.originalname };
}
export const list = () => repo.list().map(a => ({ ...a, url: `/uploads/${a.filename}` }));
export function remove(id) {
  const a = repo.get(id);
  if (!a) throw new HttpError(404, 'Asset not found');
  fs.rmSync(path.join(UPLOAD_DIR, a.filename), { force: true });
  repo.remove(a.id);
}
