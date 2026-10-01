import crypto from 'crypto';
import { publicKey } from './kickChatApi.js';
import { handleEvent } from './botService.js';
import { refreshLive } from './kickSyncService.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
const seen = new Set();
export async function receive(req) {
  const id = req.get('Kick-Event-Message-Id'), ts = req.get('Kick-Event-Message-Timestamp'), sig = req.get('Kick-Event-Signature'), type = req.get('Kick-Event-Type');
  if (!id || !ts || !sig || !type || !req.rawBody) throw new HttpError(400, 'Missing Kick headers');
  const signed = Buffer.concat([Buffer.from(`${id}.${ts}.`), req.rawBody]);
  const ok = crypto.createVerify('RSA-SHA256').update(signed).verify(await publicKey(), sig, 'base64');
  if (!ok) throw new HttpError(401, 'Invalid signature');
  if (seen.has(id)) return;
  seen.add(id); if (seen.size > 500) seen.delete(seen.values().next().value);
  if (type === 'livestream.status.updated') refreshLive().catch(e => logger.warn(e.message));
  else await handleEvent(type, req.body);
}
