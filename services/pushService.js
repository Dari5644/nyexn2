import webpush from 'web-push';
import { env } from '../config/env.js';
import * as kv from '../db/kvRepo.js';
import * as repo from '../db/pushRepo.js';
import * as hub from '../ws/hub.js';
import { getActor } from '../utils/actor.js';
import { str } from '../utils/sanitize.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
let keys = null;
function init() {
  if (keys) return keys;
  keys = kv.get('vapid');
  if (!keys) { keys = webpush.generateVAPIDKeys(); kv.set('vapid', keys); }
  webpush.setVapidDetails(env.vapidSubject, keys.publicKey, keys.privateKey);
  return keys;
}
export const publicKey = () => init().publicKey;
export function subscribe(sub) {
  if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) throw new HttpError(400, 'Invalid subscription');
  repo.addSub(sub); return { ok: true };
}
export const unsubscribe = endpoint => { repo.removeSub(String(endpoint || '')); return { ok: true }; };
async function pushAll(payload) {
  init(); let sent = 0, failed = 0;
  await Promise.all(repo.subs().map(async s => {
    try { await webpush.sendNotification(s, JSON.stringify(payload)); sent++; }
    catch (e) { failed++; if ([404, 410].includes(e.statusCode)) repo.removeSub(s.endpoint); else logger.warn('Push failed:', e.statusCode || e.message); }
  }));
  return { sent, failed };
}
export async function announce({ title, body = '', url = '/' }) {
  const t = str(title, 120).trim();
  if (!t) throw new HttpError(400, 'Title is required');
  const safeUrl = /^(\/|https?:\/\/)/.test(url) ? str(url, 300) : '/';
  const a = repo.addAnnouncement({ title: t, body: str(body, 400), url: safeUrl, actor: getActor().name });
  hub.broadcast('announcement', a);
  return { ...a, push: await pushAll({ title: a.title, body: a.body, url: a.url }) };
}
export const recent = () => repo.announcements(20);
export const stats = () => ({ subscribers: repo.subCount(), announcements: repo.announcements(30) });
