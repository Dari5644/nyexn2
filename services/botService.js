import { getFull, update } from './configService.js';
import { sendChat } from './kickChatApi.js';
import { newId } from '../utils/ids.js';
import { str } from '../utils/sanitize.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
import * as hub from '../ws/hub.js';
import { upsertGuardian } from './modsService.js';
import { award as awardXp } from './xpService.js';
const chat = []; let seq = 0;
const cooldowns = new Map(); const sentByBot = new Map(); const timerRuns = new Map();
const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
export const getChat = since => chat.filter(m => m.id > since);
function push(m) { const msg = { id: ++seq, at: Date.now(), ...m }; chat.push(msg); if (chat.length > 200) chat.shift(); hub.broadcast('chat', msg); }
export const getRecent = () => chat.slice(-60);
const isMod = s => (s?.identity?.badges || []).some(b => ['moderator', 'broadcaster', 'owner'].includes(b.type));
const expand = (t, c) => t.replaceAll('{user}', c.user).replaceAll('{channel}', c.channel).replaceAll('{args}', c.args);

export function matchRule(rule, content, prefix) {
  const c = content.trim(), m = rule.match.trim();
  if (!m) return null;
  if (rule.trigger === 'command') {
    const cmd = (m.startsWith(prefix) ? m : prefix + m).toLowerCase();
    const [first, ...rest] = c.split(/\s+/);
    return first.toLowerCase() === cmd ? rest.join(' ') : null;
  }
  if (rule.trigger === 'exact') return c.toLowerCase() === m.toLowerCase() ? '' : null;
  if (rule.trigger === 'contains') return c.toLowerCase().includes(m.toLowerCase()) ? '' : null;
  return null;
}
async function say(text) {
  for (const [k, exp] of sentByBot) if (exp < Date.now()) sentByBot.delete(k);
  sentByBot.set(text, Date.now() + 15000);
  await sendChat(text);
  push({ user: 'BOT', color: '#53fc18', badges: [{ type: 'moderator', text: 'BOT' }], content: text, bot: true });
}
export async function handleEvent(type, p) {
  if (type !== 'chat.message.sent') return;
  const sender = p.sender || {}, content = String(p.content || '');
  const badges = (sender.identity?.badges || []).map(x => ({ type: x.type, text: x.text, count: x.count }));
  push({ user: sender.username || '?', color: sender.identity?.username_color || '', badges, avatar: sender.profile_picture || '', content, mod: isMod(sender) });
  try { awardXp(sender); } catch (e) { logger.warn('XP failed:', e.message); }
  if (badges.some(x => x.type === 'moderator') && sender.user_id) { try { upsertGuardian({ id: sender.user_id, name: sender.username, username: sender.username, avatar: sender.profile_picture || '', source: 'chat', approved: true }); } catch (e) { logger.warn('Guardian upsert failed:', e.message); } }
  const cfg = getFull(), bot = cfg.bot;
  if (!bot.enabled || sentByBot.has(content)) return;
  const now = Date.now();
  if (now - (cooldowns.get('*') || 0) < bot.globalCooldown * 1000) return;
  for (const rule of bot.rules) {
    if (!rule.enabled) continue;
    const args = matchRule(rule, content, bot.prefix);
    if (args === null || (rule.modOnly && !isMod(sender))) continue;
    if (now - (cooldowns.get(rule.id) || 0) < rule.cooldown * 1000) continue;
    cooldowns.set(rule.id, now); cooldowns.set('*', now);
    try { await say(expand(rule.response, { user: sender.username || '', channel: cfg.kick.channel, args }).slice(0, 500)); }
    catch (e) { logger.warn('Bot reply failed:', e.message); }
    break;
  }
}
export async function sendManual(content) {
  const text = str(content, 500).trim();
  if (!text) throw new HttpError(400, 'Message is empty');
  await say(text);
  return { sent: true };
}
export function saveBot(b) {
  const rules = (Array.isArray(b.rules) ? b.rules : []).slice(0, 200).map(r => ({
    id: r.id || newId('rule'), name: str(r.name, 60), trigger: ['command', 'contains', 'exact'].includes(r.trigger) ? r.trigger : 'command',
    match: str(r.match, 100), response: str(r.response, 500), cooldown: num(r.cooldown, 0, 3600, 10), modOnly: !!r.modOnly, enabled: r.enabled !== false }));
  const timers = (Array.isArray(b.timers) ? b.timers : []).slice(0, 50).map(t => ({
    id: t.id || newId('tmr'), message: str(t.message, 500), everyMinutes: num(t.everyMinutes, 1, 1440, 15), enabled: t.enabled !== false }));
  const bot = { enabled: !!b.enabled, prefix: str(b.prefix, 3) || '!', globalCooldown: num(b.globalCooldown, 0, 60, 2), rules, timers };
  update({ bot }, 'Bot settings');
  return bot;
}
export function startTimers() {
  setInterval(async () => {
    const cfg = getFull();
    if (!cfg.bot.enabled || !cfg.live.isLive) return;
    for (const t of cfg.bot.timers) {
      if (!t.enabled || !t.message || Date.now() - (timerRuns.get(t.id) || Date.now()) < t.everyMinutes * 60000) { if (!timerRuns.has(t.id)) timerRuns.set(t.id, Date.now()); continue; }
      timerRuns.set(t.id, Date.now());
      try { await say(t.message); } catch (e) { logger.warn('Timer failed:', e.message); }
    }
  }, 30000);
}
