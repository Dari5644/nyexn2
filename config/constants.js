export const MAX_SNAPSHOTS = 100;
export const ALLOWED_MIME = {
  'image/png': 'image', 'image/jpeg': 'image', 'image/webp': 'image', 'image/gif': 'image',
  'image/svg+xml': 'image', 'image/x-icon': 'image'
};
export const KICK = { authorize: 'https://id.kick.com/oauth/authorize', token: 'https://id.kick.com/oauth/token', api: 'https://api.kick.com/public/v1', web: 'https://kick.com/api/v2/channels' };
export const CUSTOM_SECTION_TYPES = ['imageGrid', 'html', 'apiCard', 'design'];
export const KICK_SCOPES = ['user:read', 'channel:read', 'chat:write', 'events:subscribe'];
