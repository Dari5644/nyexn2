import multer from 'multer';
import path from 'path';
import { UPLOAD_DIR } from '../db/index.js';
import { ALLOWED_MIME } from '../config/constants.js';
import { randomHex } from '../utils/ids.js';
import { HttpError } from '../utils/httpError.js';
export const assetUpload = multer({
  storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_r, f, cb) => cb(null, randomHex(12) + path.extname(f.originalname).toLowerCase().replace(/[^.\w]/g, '')) }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_r, f, cb) => cb(ALLOWED_MIME[f.mimetype] ? null : new HttpError(400, 'Unsupported file type'), !!ALLOWED_MIME[f.mimetype])
}).single('file');
export const restoreUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }).single('file');
