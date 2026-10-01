import { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { env } from '../config/env.js';
import { getFull, update } from './configService.js';
import { getClient, getGuild, isReady, sendLog, applyPresence, announceLive, closeTicket } from './discordBot.js';
import * as repo from '../db/discordRepo.js';
import { str } from '../utils/sanitize.js';
import { HttpError } from '../utils/httpError.js';
import { newId } from '../utils/ids.js';
const need = () => { if (!isReady()) throw new HttpError(503, 'Discord bot is not connected'); return getClient(); };
const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
export function status() {
  const g = getGuild(), c = getClient();
  return { configured: !!env.discordBotToken, ready: isReady(), tag: c?.user?.tag || '', avatar: c?.user?.displayAvatarURL?.() || '', guild: g ? { id: g.id, name: g.name, icon: g.iconURL(), members: g.memberCount } : null };
}
export async function guildInfo() {
  need(); const g = getGuild();
  if (!g) throw new HttpError(404, 'Bot is not in any server');
  await g.channels.fetch(); await g.roles.fetch();
  return {
    channels: [...g.channels.cache.values()].filter(c => [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildCategory].includes(c.type)).map(c => ({ id: c.id, name: c.name, type: c.type === ChannelType.GuildCategory ? 'category' : 'text' })),
    roles: [...g.roles.cache.values()].filter(r => r.id !== g.id).map(r => ({ id: r.id, name: r.name }))
  };
}
export function saveSettings(b) {
  const d = getFull().discord, id = v => str(v, 30).replace(/\D/g, '');
  const rules = (Array.isArray(b.autoReplies) ? b.autoReplies : d.autoReplies).slice(0, 100).map(r => ({ id: r.id || newId('dr'), name: str(r.name, 60), trigger: ['command', 'contains', 'exact'].includes(r.trigger) ? r.trigger : 'contains', match: str(r.match, 100), response: str(r.response, 1900), cooldown: num(r.cooldown, 0, 3600, 5), enabled: r.enabled !== false }));
  const t = { ...d.tickets, ...(b.tickets || {}) }, l = { ...d.logs, ...(b.logs || {}) }, a = { ...d.announceLive, ...(b.announceLive || {}) }, p = { ...d.presence, ...(b.presence || {}) };
  const next = {
    prefix: str(b.prefix ?? d.prefix, 3) || '!', guildId: id(b.guildId ?? d.guildId), logChannelId: id(b.logChannelId ?? d.logChannelId), autoReplies: rules,
    logs: Object.fromEntries(['messages', 'edits', 'deletes', 'joins', 'leaves', 'tickets'].map(k => [k, l[k] !== false])),
    announceLive: { enabled: !!a.enabled, channelId: id(a.channelId), message: str(a.message, 1500) },
    presence: { text: str(p.text, 100), type: ['Playing', 'Watching', 'Listening', 'Competing'].includes(p.type) ? p.type : 'Watching', status: ['online', 'idle', 'dnd', 'invisible'].includes(p.status) ? p.status : 'online' },
    tickets: { enabled: !!t.enabled, panelChannelId: id(t.panelChannelId), categoryId: id(t.categoryId), staffRoleId: id(t.staffRoleId), panelTitle: str(t.panelTitle, 100), panelDescription: str(t.panelDescription, 1000), buttonLabel: str(t.buttonLabel, 40) || 'Open Ticket', welcome: str(t.welcome, 1000) }
  };
  update({ discord: next }, 'Discord settings'); applyPresence();
  return next;
}
export async function sendMessage({ channelId, content, title, description }) {
  const c = need();
  const ch = await c.channels.fetch(String(channelId || '')).catch(() => null);
  if (!ch?.isTextBased?.()) throw new HttpError(400, 'Choose a text channel');
  const payload = { allowedMentions: { parse: ['users', 'roles'] } };
  if (str(content, 2000)) payload.content = str(content, 2000);
  if (str(title, 200) || str(description, 3000)) payload.embeds = [new EmbedBuilder().setColor(0x7b2cbf).setTitle(str(title, 200) || null).setDescription(str(description, 3000) || null)];
  if (!payload.content && !payload.embeds) throw new HttpError(400, 'Message is empty');
  await ch.send(payload);
  sendLog('admin', { userName: 'admin panel', channelId: ch.id, content: `Sent message to #${ch.name}` });
  return { sent: true };
}
export async function postTicketPanel() {
  const c = need(), t = getFull().discord.tickets;
  const ch = await c.channels.fetch(t.panelChannelId).catch(() => null);
  if (!ch?.isTextBased?.()) throw new HttpError(400, 'Choose the ticket panel channel first (and save)');
  await ch.send({ embeds: [new EmbedBuilder().setColor(0x53fc18).setTitle(t.panelTitle || 'Support Tickets').setDescription(t.panelDescription || 'Press the button below.')], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:open').setLabel(t.buttonLabel || 'Open Ticket').setStyle(ButtonStyle.Success))] });
  return { posted: true };
}
export async function moderate({ action, userId, reason, minutes }) {
  need(); const g = getGuild();
  if (!/^\d{15,25}$/.test(String(userId || ''))) throw new HttpError(400, 'Invalid user ID');
  const why = str(reason, 200) || 'Via admin panel';
  if (action === 'unban') await g.members.unban(userId, why);
  else if (action === 'ban') await g.members.ban(userId, { reason: why });
  else { const m = await g.members.fetch(userId).catch(() => null); if (!m) throw new HttpError(404, 'Member not found'); if (action === 'kick') await m.kick(why); else if (action === 'timeout') await m.timeout(num(minutes, 1, 40320, 10) * 60000, why); else throw new HttpError(400, 'Unknown action'); }
  sendLog('admin', { userId, userName: 'admin panel', content: `${action} ${userId}: ${why}` });
  return { ok: true };
}
export const logs = q => repo.listLogs({ type: str(q.type, 20), q: str(q.q, 80), limit: num(q.limit, 1, 300, 100), offset: num(q.offset, 0, 1e6, 0) });
export const clearLogs = () => { repo.clearLogs(); return { ok: true }; };
export const tickets = () => repo.listTickets();
export async function closeTicketById(id) {
  const t = repo.ticketById(Number(id));
  if (!t) throw new HttpError(404, 'Ticket not found');
  if (t.status !== 'open') return { ok: true };
  if (isReady()) await closeTicket(t.channel_id, 'admin panel'); else repo.closeTicket(t.channel_id, 'admin panel');
  return { ok: true };
}
export const testAnnounce = async () => ({ sent: await announceLive(getFull().live.title ? getFull().live : { title: 'Test announcement', category: '' }) });
