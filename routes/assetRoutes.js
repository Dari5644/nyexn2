import { Router } from 'express';
import { upload, listAssets, deleteAsset } from '../controllers/assetController.js';
import { assetUpload } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const r = Router();
r.get('/assets', asyncHandler(listAssets));
r.post('/upload', assetUpload, asyncHandler(upload));
r.delete('/assets/:id', asyncHandler(deleteAsset));
export default r;
