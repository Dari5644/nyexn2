import { login } from '../services/authService.js';
import { realIp } from '../utils/ip.js';
export const doLogin = async (req, res) => res.json(await login({ username: req.body?.username, password: req.body?.password, deviceId: req.body?.deviceId, ua: req.get('user-agent') || '', ip: realIp(req) }));
