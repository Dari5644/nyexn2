import { Router } from 'express';
import { setMaintenance } from '../controllers/maintenanceController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const r = Router();
r.put('/maintenance', asyncHandler(setMaintenance));
export default r;
