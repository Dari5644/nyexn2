import { Client, GatewayIntentBits, Partials, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActivityType, Events } from 'discord.js';
import { env } from '../config/env.js';
import { getFull } from './configService.js';
import { matchRule } from './botService.js';
import * as repo from '../db/discordRepo.js';
import { logger } from '../utils/logger.js';

let client = null, ready = false;
const cooldowns = new Map();
const cfg = () => getFull().discord;
export const getClient = () => client;
export const isReady = () => ready;
export function getGuild() {
  if (!client) return null;
  const id = env.discordGuildId || cfg().guildId;
  return (id && client.guilds.cache.get(id)) || client.guilds.cache.first() || null;
}
const inGuild = g => !!g && (!getGuild() || g.id === getGuild().id);
const FLAG = { message: 'messages', edit: 'edits', delete: 'deletes', join: 'joins', leave: 'leaves', ticket: 'tickets' };

export async function sendLog(type, { userId = '', userName = '', channelId = '', content = '' }) {
  const d = cfg();
  if (FLAG[type] && d.logs?.[FLAG[type]] === false) return;
  repo.addLog({ type, userId, userName, channelId, content: String(content).slice(0, 1500) });
  if (d.logChannelId && ready && type !== 'message') {
    try {
      const ch = await client.channels.fetch(d.logChannelId);
      await ch?.send({ embeds: [new EmbedBuilder().setColor(0x7b2cbf).setTitle(`📋 ${type.toUpperCase()}`).setDescription(String(content).slice(0, 1800) || '—').addFields({ name: 'User', value: `${userName || '—'} (${userId || '—'})` }).setTimestamp()] });
    } catch {}
  }
}
export function applyPresence() {
  if (!ready) return;
  const p = cfg().presence || {};
  const types = { Playing: ActivityType.Playing, Watching: ActivityType.Watching, Listening: ActivityType.Listening, Competing: ActivityType.Competing };
  client.user.setPresence({ activities: p.text ? [{ name: p.text, type: types[p.type] ?? ActivityType.Watching }] : [], status: ['online', 'idle', 'dnd', 'invisible'].includes(p.status) ? p.status : 'online' });
}
async function onMessage(m) {
  if (m.author?.bot || !m.guild || !inGuild(m.guild)) return;
  sendLog('message', { userId: m.author.id, userName: m.author.tag, channelId: m.channelId, content: m.content });
  const d = cfg();
  if (!m.content) return;
  for (const r of d.autoReplies) {
    if (!r.enabled) continue;
    const args = matchRule(r, m.content, d.prefix || '!');
    if (args === null) continue;
    const key = `${r.id}:${m.channelId}`;
    if (Date.now() - (cooldowns.get(key) || 0) < (r.cooldown || 0) * 1000) continue;
    cooldowns.set(key, Date.now());
    try { await m.reply({ content: r.response.replaceAll('{user}', `<@${m.author.id}>`).replaceAll('{args}', args).slice(0, 2000), allowedMentions: { repliedUser: false, parse: [] } }); }
    catch (e) { logger.warn('Discord reply failed:', e.message); }
    break;
  }
}
async function openTicket(i) {
  const t = cfg().tickets, guild = i.guild;
  if (!t.enabled || !guild) return i.reply({ content: 'Tickets are disabled.', ephemeral: true });
  const existing = repo.openTicketByUser(i.user.id);
  if (existing) return i.reply({ content: `You already have an open ticket: <#${existing.channel_id}>`, ephemeral: true });
  await i.deferReply({ ephemeral: true });
  try {
    const perms = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles];
    const overwrites = [{ id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: i.user.id, allow: perms }, { id: client.user.id, allow: [...perms, PermissionFlagsBits.ManageChannels] }];
    if (t.staffRoleId) overwrites.push({ id: t.staffRoleId, allow: perms });
    const name = `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90) || `ticket-${i.user.id}`;
    const ch = await guild.channels.create({ name, type: ChannelType.GuildText, parent: t.categoryId || undefined, permissionOverwrites: overwrites });
    repo.addTicket({ channelId: ch.id, userId: i.user.id, userName: i.user.tag });
    await ch.send({
      content: `<@${i.user.id}>${t.staffRoleId ? ` <@&${t.staffRoleId}>` : ''}`,
      embeds: [new EmbedBuilder().setColor(0x53fc18).setTitle('🎫 Ticket').setDescription((t.welcome || 'Welcome {user}!').replaceAll('{user}', `<@${i.user.id}>`))],
      components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel('Close').setStyle(ButtonStyle.Danger))]
    });
    sendLog('ticket', { userId: i.user.id, userName: i.user.tag, channelId: ch.id, content: `Ticket opened: #${ch.name}` });
    await i.editReply({ content: `Your ticket: <#${ch.id}>` });
  } catch (e) { logger.warn('Ticket create failed:', e.message); await i.editReply({ content: 'Could not create the ticket (check bot permissions).' }).catch(() => {}); }
}
export async function closeTicket(channelId, by = 'admin') {
  const t = repo.ticketByChannel(channelId);
  if (!t || t.status !== 'open') return false;
  repo.closeTicket(channelId, by);
  sendLog('ticket', { userId: t.user_id, userName: t.user_name, channelId, content: `Ticket closed by ${by}` });
  try { const ch = await client.channels.fetch(channelId); setTimeout(() => ch.delete('Ticket closed').catch(() => {}), 5000); } catch {}
  return true;
}
async function closeFromButton(i) {
  const t = repo.ticketByChannel(i.channelId);
  if (!t) return i.reply({ content: 'Not a ticket channel.', ephemeral: true });
  const staff = cfg().tickets.staffRoleId;
  const ok = i.user.id === t.user_id || i.memberPermissions?.has(PermissionFlagsBits.ManageChannels) || (staff && i.member?.roles?.cache?.has(staff));
  if (!ok) return i.reply({ content: 'You cannot close this ticket.', ephemeral: true });
  await i.reply({ content: 'Closing in 5 seconds…' });
  await closeTicket(i.channelId, i.user.tag);
}
export async function announceLive(live) {
  const a = cfg().announceLive, c = getFull();
  if (!ready || !a?.enabled || !a.channelId) return false;
  const text = (a.message || '').replaceAll('{channel}', c.kick.channel).replaceAll('{title}', live.title || '');
  const ch = await client.channels.fetch(a.channelId);
  await ch.send({ content: text.slice(0, 1900), embeds: [new EmbedBuilder().setColor(0x53fc18).setTitle(live.title || `${c.kick.channel} is LIVE`).setURL(c.kick.url).setDescription(live.category ? `🎮 ${live.category}` : null)], allowedMentions: { parse: ['everyone', 'roles'] } });
  return true;
}
export async function start() {
  if (!env.discordBotToken) { logger.warn('DISCORD_BOT_TOKEN is not set: Discord bot is disabled'); return; }
  client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Message, Partials.Channel] });
  client.once(Events.ClientReady, () => { ready = true; applyPresence(); logger.info(`Discord bot ready as ${client.user.tag}`); });
  client.on(Events.MessageCreate, onMessage);
  client.on(Events.MessageUpdate, (o, n) => { if (n.author?.bot || !n.guild || !inGuild(n.guild) || o.content === n.content) return; sendLog('edit', { userId: n.author?.id, userName: n.author?.tag, channelId: n.channelId, content: `Before: ${o.content ?? '(uncached)'}\nAfter: ${n.content ?? ''}` }); });
  client.on(Events.MessageDelete, m => { if (m.author?.bot || !m.guild || !inGuild(m.guild)) return; sendLog('delete', { userId: m.author?.id, userName: m.author?.tag, channelId: m.channelId, content: m.content ?? '(uncached)' }); });
  client.on(Events.GuildMemberAdd, m => sendLog('join', { userId: m.id, userName: m.user.tag, content: `${m.user.tag} joined the server` }));
  client.on(Events.GuildMemberRemove, m => sendLog('leave', { userId: m.id, userName: m.user?.tag, content: `${m.user?.tag || m.id} left the server` }));
  client.on(Events.ChannelDelete, ch => repo.closeTicket(ch.id, 'channel deleted'));
  client.on(Events.InteractionCreate, i => { if (!i.isButton()) return; if (i.customId === 'ticket:open') openTicket(i); else if (i.customId === 'ticket:close') closeFromButton(i); });
  client.on(Events.Error, e => logger.warn('Discord error:', e.message));
  try { await client.login(env.discordBotToken); }
  catch (e) { logger.error('Discord login failed:', e.message, '(enable Server Members + Message Content intents in the Discord Developer Portal)'); client = null; }
}
