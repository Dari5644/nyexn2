import { Router } from 'express';
import { adminConfig, saveConfig } from '../controllers/configController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { isPlainObject } from '../utils/sanitize.js';
const r = Router();
r.get('/config', asyncHandler(adminConfig));
r.put('/config', validate(q => (isPlainObject(q.body) ? null : 'Body must be a JSON object')), asyncHandler(saveConfig));
export default r;
