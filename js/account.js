// Stars & Shade accounts: sign in with email + password, so every Oracle chat, your chart and what she remembers
// about you are saved to your account and follow you to any phone or computer.
// Needs vendor/supabase. The key below is the public (publishable) key; row-level security keeps each account private.
(() => {
  const URL_ = 'https://yrneifslwwrussqcjytj.supabase.co', KEY = 'sb_publishable_K3WhGEXDwkcEapRYgEITUA_Opn7GpY3';
  const sb = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ss-auth' } });
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  let user = null, profile = null, ready, subs = [], req = null;   // req: set when the sheet is a required sign-up wall (no close button)

  async function loadProfile() {
    if (!user) { profile = null; return; }
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    profile = data || { id: user.id, name: (user.user_metadata || {}).name || '', notes: '', chart: null };
    if (!data) await sb.from('profiles').insert({ id: user.id, name: profile.name });
    // chart follows the account: account copy wins; a chart made before signing in gets saved to the account
    try {
      if (profile.chart && profile.chart.input) { localStorage.setItem('ss-chart', JSON.stringify(profile.chart)); dispatchEvent(new CustomEvent('ss-chart', { detail: profile.chart })); }
      else { const local = JSON.parse(localStorage.getItem('ss-chart') || 'null'); if (local && local.input && local.input.time) saveChart(local); }
    } catch (e) {}
  }
  function emit() { subs.forEach(f => { try { f(user, profile); } catch (e) {} }); }
  ready = (async () => { try { const { data } = await sb.auth.getSession(); user = data.session ? data.session.user : null; await loadProfile(); } catch (e) {} emit(); })();
  sb.auth.onAuthStateChange((ev, session) => { const u = session ? session.user : null; if ((u && u.id) === (user && user.id)) return; user = u; loadProfile().then(emit); });

  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
  const friendly = e => { const m = String((e && e.message) || e || ''); if (m === 'timeout' || /fetch|network|load failed/i.test(m)) return navigator.onLine === false ? 'You’re offline. Reconnect and try again.' : 'The connection is slow right now. Try again in a moment.'; return m; };
  async function signUp(name, email, password) {
    const r = await withTimeout(fetch(URL_ + '/functions/v1/signup', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ name, email, password }) }), 15000);
    const j = await r.json().catch(() => ({}));
    if (!r.ok && j.error !== 'exists') throw new Error(j.error || 'Couldn’t create the account. Try again.');
    if (j.error === 'exists') { try { return await signIn(email, password); } catch (e) { throw new Error('That email already has an account. Sign in with your password instead.'); } }
    return signIn(email, password);
  }
  async function signIn(email, password) {
    const { data, error } = await withTimeout(sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }), 15000);
    if (error) throw new Error(/invalid/i.test(error.message) ? 'Email or password doesn’t match.' : error.message);
    user = data.user; req = null; await loadProfile(); emit(); return user;
  }
  async function signOut() { await sb.auth.signOut(); user = null; profile = null; emit(); }

  async function log(role, text, convId, source) {
    if (!user || !text) return;
    try { await sb.from('messages').insert({ user_id: user.id, role, text: String(text).slice(0, 8000), conv_id: convId || null, source: source || 'oracle' }); } catch (e) {}
  }
  async function recent(n) {
    if (!user) return [];
    const { data } = await sb.from('messages').select('role,text,created_at,conv_id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(n || 60);
    return (data || []).reverse();
  }
  async function saveChart(saved) { if (!user || !saved) return; if (profile) profile.chart = saved; try { await sb.from('profiles').update({ chart: saved, updated_at: new Date().toISOString() }).eq('id', user.id); } catch (e) {} }
  async function remember(note) {
    if (!user) return 'Not signed in, so this could not be saved. Mention once, lightly, that signing in lets you remember things.';
    note = String(note || '').trim().slice(0, 500); if (!note) return 'Nothing to save.';
    const day = new Date().toISOString().slice(0, 10);
    const notes = ((profile && profile.notes) || '') + `\n- ${day}: ${note}`;
    const trimmed = notes.length > 12000 ? notes.slice(notes.length - 12000) : notes;
    if (profile) profile.notes = trimmed;
    try { await sb.from('profiles').update({ notes: trimmed, updated_at: new Date().toISOString() }).eq('id', user.id); } catch (e) { return 'Could not save right now.'; }
    return 'Saved to their memory.';
  }
  addEventListener('ss-chart', e => { if (user && e.detail && (!profile || JSON.stringify(profile.chart) !== JSON.stringify(e.detail))) saveChart(e.detail); });

  // What the Oracle remembers, sent quietly at the start of each chat
  async function memoryText() {
    if (!user) return null;
    const rows = await recent(60), parts = [];
    const name = profile && profile.name;
    parts.push(`[MEMORY] Background for this chat, not said out loud by the person. You are talking with ${name ? name : 'a returning person'}${name ? '' : ' (name unknown)'}, signed in to their Stars & Shade account.`);
    if (profile && profile.notes && profile.notes.trim()) parts.push('Things you saved about them in past chats:' + profile.notes);
    if (window.SSMaker) { const t = window.SSMaker.text(null, 'Their birth chart'); if (t) parts.push(t.replace(/ Read my Big Three.*$/, '')); }
    if (rows.length) { let tx = rows.map(r => `${r.role === 'me' ? (name || 'Them') : 'You'}: ${r.text}`).join('\n'); if (tx.length > 7000) tx = '…' + tx.slice(tx.length - 7000); parts.push('Your most recent conversation history with them (oldest first):\n' + tx); }
    parts.push('Use this naturally, like a friend who remembers. Don\'t recite it or list what you remember unless they ask. If they pick up where you left off, continue from there. When they share something worth remembering (plans, goals, people in their life, big feelings, what a reading meant to them), call the remember tool with a short note.');
    return parts.join('\n\n');
  }

  // ---- sign-in sheet (any page)
  const css = `#ssAcct{position:fixed;inset:0;z-index:5000;background:rgba(8,4,20,.75);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:16px 14px 40px;font:inherit;color:#f3efe6}
  #ssAcct[hidden]{display:none!important}
  #ssAcct .box{width:100%;max-width:420px;margin-top:8vh;padding:20px;border-radius:22px;background:linear-gradient(160deg,#2a0f3d,#150a26);border:1px solid rgba(255,111,181,.35);box-shadow:0 0 40px rgba(255,95,176,.25)}
  #ssAcct h3{margin:0 0 4px;font-size:22px}#ssAcct p{margin:4px 0 12px;opacity:.8;font-size:14.5px;line-height:1.4}
  #ssAcct label{display:block;font-size:13px;font-weight:600;margin:10px 0 0}
  #ssAcct input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:12px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:inherit;font:inherit;font-size:16px}
  #ssAcct .go{width:100%;margin-top:16px;padding:13px;border-radius:999px;border:0;background:linear-gradient(135deg,#ff6fb5,#b36bff);color:#fff;font:inherit;font-weight:700;font-size:16px}
  #ssAcct .sw{all:unset;cursor:pointer;display:block;text-align:center;margin-top:14px;font-size:14px;text-decoration:underline;opacity:.85}
  #ssAcct .x{all:unset;cursor:pointer;float:right;font-size:14px;opacity:.75;padding:2px 6px}
  #ssAcct .err{color:#ffb3d6;font-size:14px;min-height:1em;margin-top:10px}`;
  function open(mode, opts) {
    if (opts && opts.required) req = opts; if (user) req = null;
    if (!document.getElementById('ssAcctCss')) { const s = document.createElement('style'); s.id = 'ssAcctCss'; s.textContent = css; document.head.appendChild(s); }
    let d = document.getElementById('ssAcct'); if (!d) { d = document.createElement('div'); d.id = 'ssAcct'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Your Stars & Shade account'); document.body.appendChild(d); d.onclick = e => { if (e.target === d && !req) d.hidden = true; };
      addEventListener('keydown', e => { if (e.key === 'Escape' && !d.hidden && !req) d.hidden = true; }); }
    d.hidden = false;
    if (user) {
      d.innerHTML = `<div class="box"><button class="x" type="button" aria-label="Close">✕</button><h3>✦ ${esc((profile && profile.name) || 'Your account')}</h3><p>Signed in as ${esc(user.email)}. Your chats, your chart and what the Oracle remembers are saved to this account, on any device.</p>
        <button class="go" type="button" data-a="close">Keep going</button><button class="sw" type="button" data-a="out">Sign out</button></div>`;
      d.querySelector('[data-a=out]').onclick = async () => { await signOut(); d.hidden = true; };
      d.querySelector('[data-a=close]').onclick = d.querySelector('.x').onclick = () => { d.hidden = true; };
      return;
    }
    const up = mode !== 'in';
    d.innerHTML = `<div class="box">${req ? '' : '<button class="x" type="button" aria-label="Close">✕</button>'}<h3>${req && req.title ? esc(req.title) : up ? 'Save your sky' : 'Welcome back'}</h3>
      <p>${req && req.text && up ? esc(req.text) : up ? 'Make a free account so every chat, your chart and everything the Oracle learns about you is saved. Pick up right where you left off, on any phone or computer.' : 'Sign in to pick up where you left off.'}</p>
      ${up ? '<label>Your first name<input data-f="n" autocomplete="given-name"></label>' : ''}
      <label>Email<input data-f="e" type="email" autocomplete="email" inputmode="email"></label>
      <label>Password<input data-f="p" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'At least 6 characters' : ''}"></label>
      <div class="err"></div><button class="go" type="button">${up ? 'Create my account ✦' : 'Sign in ✦'}</button>
      <button class="sw" type="button">${up ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></div>`;
    const f = k => d.querySelector(`[data-f=${k}]`), err = t => { d.querySelector('.err').textContent = t; };
    const xb = d.querySelector('.x'); if (xb) xb.onclick = () => { d.hidden = true; };
    d.querySelector('.sw').onclick = () => open(up ? 'in' : 'up');
    const go = d.querySelector('.go');
    go.onclick = async () => {
      const e = f('e').value.trim(), p = f('p').value, n = up ? f('n').value.trim() : '';
      if (up && !n) return err('Add your first name so she knows what to call you.');
      if (!e || !p) return err('Add your email and password.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return err('That email doesn’t look right.');
      if (up && p.length < 6) return err('Pick a password with at least 6 characters.');
      go.disabled = true; go.textContent = 'One sec…'; err('');
      try { up ? await signUp(n, e, p) : await signIn(e, p); if (up) inviteStep(d); else d.hidden = true; }
      catch (x) { err(friendly(x) || 'Something went wrong. Try again.'); go.disabled = false; go.textContent = up ? 'Create my account ✦' : 'Sign in ✦'; }
    };
    d.querySelectorAll('input').forEach(i => i.addEventListener('keydown', ev => { if (ev.key === 'Enter') go.click(); }));
    setTimeout(() => { const first = d.querySelector('input'); if (first) first.focus(); }, 60);
  }

  // sign-up step 2: invite friends (skipped if they came from someone's invite link: they're already friends)
  function inviteStep(d) {
    let invited = false; try { invited = !!localStorage.getItem('ss-invite'); } catch (e) {}
    if (invited || /\/i\/(index\.html)?$/.test(location.pathname)) { d.hidden = true; return; }
    const base = new URL('..', (document.querySelector('script[src*="js/account.js"]') || {}).src || location.href).href;
    d.innerHTML = `<div class="box"><h3>You’re in ✦</h3><p>Astrology is better with your people. Invite friends, your partner, your family or your crew: when they make their free chart you’re instantly friends, with a pair reading and a fresh one every day.</p>
      <button class="go" type="button" data-a="inv">＋ Invite friends</button><div class="err"></div><button class="sw" type="button" data-a="later">Maybe later</button></div>`;
    d.querySelector('[data-a=later]').onclick = () => { d.hidden = true; };
    d.querySelector('[data-a=inv]').onclick = async ev => {
      const b = ev.currentTarget; b.disabled = true; b.textContent = 'One sec…';
      try {
        if (!window.SSSocial) await new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = base + 'js/social.js?v=28'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
        const me = await window.SSSocial.syncMe();
        b.disabled = false; b.textContent = '＋ Invite friends';
        if (!me) throw new Error('Couldn’t make your invite link. Try again from the menu: Friends & Groups.');
        const r = await window.SSSocial.shareInvite(me.invite_code, me.name, b);
        if (r !== 'cancel') { d.querySelector('[data-a=later]').textContent = 'Done'; }
      } catch (x) { b.disabled = false; b.textContent = '＋ Invite friends'; d.querySelector('.err').textContent = x.message; }
    };
  }

  // Shade School "learn your way" picks: own row only, never shared with friends
  async function saveWay(arr) { if (!user || !Array.isArray(arr)) return; if (profile) profile.learn_way = arr;
    try { await sb.from('profiles').update({ learn_way: arr, updated_at: new Date().toISOString() }).eq('id', user.id); } catch (e) {} }
  window.SSAcct = { sb, ready, open, signIn, signUp, signOut, log, recent, remember, memoryText, saveChart, saveWay,
    get user() { return user; }, get profile() { return profile; }, onChange(f) { subs.push(f); ready.then(() => f(user, profile)); } };
})();
