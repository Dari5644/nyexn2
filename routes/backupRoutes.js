import { Router } from 'express';
import { doExport, doRestore } from '../controllers/backupController.js';
import { restoreUpload } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const r = Router();
r.get('/backup/export', asyncHandler(doExport));
r.post('/backup/restore', restoreUpload, asyncHandler(doRestore));
export default r;
