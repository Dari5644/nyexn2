import { Router } from 'express';
import { kickWebhook } from '../controllers/webhookController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const r = Router();
r.post('/kick/webhook', asyncHandler(kickWebhook));
export default r;
