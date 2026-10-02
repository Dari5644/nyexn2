import { db } from './index.js';
export const award = u => db.prepare(`INSERT INTO xp (user_id, username, avatar, color, xp, messages, week_key, week_xp, last_at) VALUES (@id, @name, @avatar, @color, @xp, 1, @week, @xp, @now)
  ON CONFLICT(user_id) DO UPDATE SET username = @name, avatar = CASE WHEN @avatar != '' THEN @avatar ELSE avatar END, color = @color, xp = xp + @xp, messages = messages + 1,
  week_xp = CASE WHEN week_key = @week THEN week_xp + @xp ELSE @xp END, week_key = @week, last_at = @now`).run({ ...u, now: Date.now() });
export const top = n => db.prepare('SELECT * FROM xp ORDER BY xp DESC LIMIT ?').all(n);
export const topWeek = (week, n) => db.prepare('SELECT * FROM xp WHERE week_key = ? ORDER BY week_xp DESC LIMIT ?').all(week, n);
export const clear = () => db.prepare('DELETE FROM xp').run();
