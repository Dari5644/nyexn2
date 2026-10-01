export const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isDiscordWebhook = u => typeof u === 'string' && /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(u);
export const safeFilename = n => /^[\w.-]+$/.test(n);
export const str = (v, max = 500) => (typeof v === 'string' ? v.slice(0, max) : '');
