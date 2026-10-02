const t = (ar, en) => ({ ar, en });
export const DEFAULT_CONFIG = {
  branding: { title: t('NYEXN2 | المنصة الرسمية', 'NYEXN2 | Official Platform'), tagline: t('صانع محتوى وبث مباشر', 'Content Creator & Streamer'),
    logoUrl: '', faviconUrl: '', accent: '#7B2CBF', accent2: '#C77DFF', cta: '#53FC18', background: '#060608', bgFx: true, defaultLang: 'ar' },
  kick: { channel: 'nyexn2', url: 'https://kick.com/nyexn2', followers: 0, custom: false, recent: [] },
  socials: ['youtube', 'tiktok', 'x', 'instagram'].map(id => ({ id, label: id, url: '', visible: true })),
  donations: { gateways: ['paypal', 'dokan', 'streamlabs'].map(id => ({ id, label: id, url: '' })), amounts: [20, 50, 100, 500, 1000] },
  sections: [
    { id: 'hero', type: 'hero', visible: true, title: t('الرئيسية', 'Home') },
    { id: 'goals', type: 'goals', visible: true, title: t('الأهداف', 'Goals') },
    { id: 'links', type: 'buttons', visible: true, title: t('روابط مهمة', 'Quick Links') },
    { id: 'support', type: 'support', visible: true, title: t('الدعم والتبرعات', 'Support & Donations') },
    { id: 'session', type: 'session', visible: true, title: t('آخر بث والمقاطع', 'Last Session & Clips') },
    { id: 'leaderboard', type: 'leaderboard', visible: true, title: t('لوحة المتصدرين', 'Leaderboard') },
    { id: 'achievements', type: 'achievements', visible: true, title: t('الإنجازات', 'Achievements') },
    { id: 'gifters', type: 'gifters', visible: true, title: t('أفضل المدعمين والمتابعين', 'Top Gifters & Regulars') },
    { id: 'mods', type: 'mods', visible: true, title: t('الحراس', 'The Guardians') }
  ],
  gifters: [], regulars: [], session: {}, clips: [],
  mods: { synced: [], overrides: {}, autoApprove: false },
  commands: [], quickLinks: [],
  bot: { enabled: false, prefix: '!', globalCooldown: 2, rules: [], timers: [] },
  maintenance: { enabled: false, autoWhenOffline: false, message: t('الموقع تحت الصيانة', 'Under Maintenance') },
  panic: { enabled: false, message: t('نعود بعد قليل… نقوم بتأمين البث', 'Be right back — securing the stream') },
  buttons: [], achievements: [], clipArchive: [],
  stream: { showPlayer: true, autoArchiveClips: false },
  xp: { enabled: true, min: 5, max: 15, cooldown: 30 },
  notify: { onLive: true },
  ticker: { enabled: false, text: t('', ''), keywords: [], speed: 30 },
  discord: {
    prefix: '!', guildId: '', logChannelId: '',
    announceLive: { enabled: false, channelId: '', message: '@everyone {channel} is LIVE now! {title}' },
    presence: { text: 'kick.com', type: 'Watching', status: 'online' },
    logs: { messages: true, edits: true, deletes: true, joins: true, leaves: true, tickets: true },
    autoReplies: [],
    tickets: { enabled: false, panelChannelId: '', categoryId: '', staffRoleId: '', panelTitle: 'Support Tickets', panelDescription: 'Press the button below to open a private ticket.', buttonLabel: 'Open Ticket', welcome: 'Welcome {user}! A staff member will be with you shortly.' }
  },
  goals: [
    { id: 'followers', kind: 'followers', title: t('هدف المتابعين', 'Followers Goal'), current: 0, target: 1000, unit: '', auto: true, enabled: true }
  ],
  live: { isLive: false, title: '', viewers: 0, category: '' },
  secrets: { kickClientId: '', kickClientSecret: '' }
};
