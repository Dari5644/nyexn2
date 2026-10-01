import { login } from '../services/authService.js';
export const doLogin = (req, res) => res.json({ token: login(req.body?.password, req.ip) });
