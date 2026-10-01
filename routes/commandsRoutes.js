import { Router } from 'express';
import { getLists, saveLists } from '../controllers/commandsController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const r = Router();
r.get('/commands', asyncHandler(getLists));
r.put('/commands', asyncHandler(saveLists));
export default r;
