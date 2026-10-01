import * as snaps from '../db/snapshotRepo.js';
import { save } from './configService.js';
import { HttpError } from '../utils/httpError.js';
export const list = () => snaps.list();
export function revert(id) {
  const cfg = snaps.get(id);
  if (!cfg) throw new HttpError(404, 'Snapshot not found');
  return save(cfg, `Reverted to #${id}`);
}
