import { Router } from 'express';
import { doLogin } from '../controllers/authController.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const r = Router();
r.post('/login', rateLimit(20, 60000), asyncHandler(doLogin));
export default r;
