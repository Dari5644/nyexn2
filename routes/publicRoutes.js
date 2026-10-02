import { Router } from 'express';
import { recentChat } from '../controllers/chatController.js';
import { publicConfig } from '../controllers/configController.js';
const r = Router();
r.get('/health', (_q, res) => res.json({ ok: true }));
r.get('/config', publicConfig);
r.get('/chat/recent', recentChat);
export default r;
