// Stars & Shade · free-minutes limit for people who aren't signed in.
// Free minutes: 10 (added up across visits on this device) of talking with Skye or studying in the Shade School.
// At 5 minutes a friendly "save this" sign-up sheet slides up once. It can be closed and the talk keeps going.
// At 10 minutes the talk stops and the sheet appears again. It can also be closed, but a new talk needs an account.
// Needs js/account.js loaded first. Signed-in people are never counted or stopped.
(() => {
  const LIMIT = 600, NUDGE = 300, WARN = 30, IDLE = 90, KEY = 'ss-guest-s', NKEY = 'ss-guest-nudged';
  let used = 0, last = Date.now(), lastAct = Date.now(), timer = 0, fired = false, warned = false, nudged = false;
  const kinds = new Set(), limitCbs = [], warnCbs = [];
  try { used = Math.max(0, +localStorage.getItem(KEY) || 0); nudged = localStorage.getItem(NKEY) === '1'; } catch (e) {}
  const A = () => window.SSAcct;
  let known = false;                       // true once we know whether they're signed in
  if (A()) A().ready.then(() => { known = true; });
  const guest = () => !!(A() && known && !A().user);
  const save = () => { try { localStorage.setItem(KEY, String(Math.round(used))); } catch (e) {} };
  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true, capture: true }));

  function tick() {
    const now = Date.now(), dt = Math.min(2, (now - last) / 1000); last = now;
    if (!guest()) return;
    const talking = kinds.has('talk'), studying = kinds.has('study') && !document.hidden && now - lastAct < IDLE * 1000;
    if (!talking && !studying) return;
    used += dt;
    if (!nudged && used >= NUDGE && used < LIMIT - WARN) { nudged = true; try { localStorage.setItem(NKEY, '1'); } catch (e) {} nudge(); }
    if (!warned && used >= LIMIT - WARN) { warned = true; warnCbs.forEach(f => { try { f(); } catch (e) {} }); }
    if (used >= LIMIT && !fired) { fired = true; save(); limitCbs.forEach(f => { try { f(); } catch (e) {} }); wall(); }
    else if (Math.round(used) % 5 === 0) save();
  }
  function run() { if (timer || !kinds.size) return; last = Date.now(); timer = setInterval(tick, 1000); }
  function stopIfIdle() { if (!kinds.size && timer) { clearInterval(timer); timer = 0; save(); } }

  function blocked() { return guest() && used >= LIMIT; }
  function nudge() {
    if (!A() || A().user) return;
    A().open('up', { title: 'Halfway through your free time ✦',
      text: 'You’ve used 5 of your 10 free minutes. Make a free account so this conversation is saved and Skye remembers you. You can close this and keep talking.' });
  }
  function wall() {
    if (!A() || A().user) return;
    A().open('up', { title: 'Your 10 free minutes are up',
      text: 'Make a free account to keep talking with Skye and studying in the Shade School. It takes about 20 seconds, and your chats, your chart and your lessons get saved on any phone or computer.' });
  }
  window.SSGuest = {
    LIMIT, begin(k) { kinds.add(k || 'talk'); run(); }, end(k) { kinds.delete(k || 'talk'); stopIfIdle(); },
    blocked, wall, wallIfLocked() { if (A()) A().ready.then(() => { if (blocked()) wall(); }); },
    onLimit(f) { limitCbs.push(f); }, onWarn(f) { warnCbs.push(f); },
    nudge, get used() { return used; }, get left() { return Math.max(0, LIMIT - used); }
  };
  addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
})();
