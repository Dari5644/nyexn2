export function realIp(req) {
  const cf = req.get('cf-connecting-ip');
  return (cf ? cf.trim() : req.ip || req.socket?.remoteAddress || '').replace('::ffff:', '');
}
