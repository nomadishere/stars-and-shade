// Stars & Shade · free-minutes limit for people who aren't signed in.
// After 5 minutes of talking with Skye or studying in the Shade School (added up across visits on this device),
// a sign-up wall appears that can't be closed: make a free account (or sign in) to keep going.
// Needs js/account.js loaded first. Signed-in people are never counted or stopped.
(() => {
  const LIMIT = 300, WARN = 30, IDLE = 90, KEY = 'ss-guest-s';
  let used = 0, last = Date.now(), lastAct = Date.now(), timer = 0, fired = false, warned = false;
  const kinds = new Set(), limitCbs = [], warnCbs = [];
  try { used = Math.max(0, +localStorage.getItem(KEY) || 0); } catch (e) {}
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
    if (!warned && used >= LIMIT - WARN) { warned = true; warnCbs.forEach(f => { try { f(); } catch (e) {} }); }
    if (used >= LIMIT && !fired) { fired = true; save(); limitCbs.forEach(f => { try { f(); } catch (e) {} }); wall(); }
    else if (Math.round(used) % 5 === 0) save();
  }
  function run() { if (timer || !kinds.size) return; last = Date.now(); timer = setInterval(tick, 1000); }
  function stopIfIdle() { if (!kinds.size && timer) { clearInterval(timer); timer = 0; save(); } }

  function blocked() { return guest() && used >= LIMIT; }
  function wall() {
    if (!A() || A().user) return;
    A().open('up', { required: true, title: 'Your 5 free minutes are up',
      text: 'Make a free account to keep talking with Skye and studying in the Shade School. It takes about 20 seconds, and your chats, your chart and your lessons get saved on any phone or computer.' });
  }
  window.SSGuest = {
    LIMIT, begin(k) { kinds.add(k || 'talk'); run(); }, end(k) { kinds.delete(k || 'talk'); stopIfIdle(); },
    blocked, wall, wallIfLocked() { if (A()) A().ready.then(() => { if (blocked()) wall(); }); },
    onLimit(f) { limitCbs.push(f); }, onWarn(f) { warnCbs.push(f); },
    get used() { return used; }, get left() { return Math.max(0, LIMIT - used); }
  };
  addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
})();
