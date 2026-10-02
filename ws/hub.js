import { WebSocketServer } from 'ws';
let wss = null;
export function attach(server, initial) {
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', ws => ws.send(JSON.stringify({ type: 'config', payload: initial() })));
}
export function broadcast(type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload });
  for (const c of wss.clients) if (c.readyState === 1) c.send(msg);
}
