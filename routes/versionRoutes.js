import { Router } from 'express';
import { listVersions, revertVersion } from '../controllers/versionController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const r = Router();
r.get('/versions', asyncHandler(listVersions));
r.post('/versions/:id/revert', asyncHandler(revertVersion));
export default r;
