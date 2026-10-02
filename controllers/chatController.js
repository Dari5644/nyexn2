import { getRecent } from '../services/botService.js';
export const recentChat = (_q, res) => res.json(getRecent());
