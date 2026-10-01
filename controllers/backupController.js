import { exportBackup, restoreBackup } from '../services/backupService.js';
export function doExport(_q, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="nyexn2-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify(exportBackup(), null, 2));
}
export function doRestore(req, res) {
  let payload = req.body;
  if (req.file) { try { payload = JSON.parse(req.file.buffer.toString('utf8')); } catch { return res.status(400).json({ error: 'File is not valid JSON' }); } }
  restoreBackup(payload);
  res.json({ ok: true });
}
