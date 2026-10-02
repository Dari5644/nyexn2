import crypto from 'crypto';
export const randomHex = (n = 8) => crypto.randomBytes(n).toString('hex');
export const newId = prefix => `${prefix}_${randomHex(5)}`;
