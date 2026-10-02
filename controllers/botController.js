import { getFull } from '../services/configService.js';
import { saveBot, getChat, sendManual } from '../services/botService.js';
import { subscribe, listSubscriptions } from '../services/kickChatApi.js';
export const getBot = (_q, res) => res.json(getFull().bot);
export const putBot = (req, res) => res.json(saveBot(req.body || {}));
export const chat = (req, res) => res.json(getChat(Number(req.query.since) || 0));
export const send = async (req, res) => res.json(await sendManual(req.body?.content));
export const doSubscribe = async (_q, res) => res.json(await subscribe());
export const subscriptions = async (_q, res) => res.json(await listSubscriptions());
