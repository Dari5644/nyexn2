import { receive } from '../services/webhookService.js';
export const kickWebhook = async (req, res) => { await receive(req); res.sendStatus(200); };
