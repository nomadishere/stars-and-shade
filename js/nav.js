// Stars & Shade · one menu for the whole site. Puts "☉ My chart" + "☰" into any element with id="ssnav"
// (or a fixed spot top-left if a page has none), and a menu sheet with every part of the site.
(() => {
  const src = document.currentScript && document.currentScript.src;
  const BASE = src ? new URL('..', src).href : new URL('../', location.href).href;
  const here = location.href.replace(/[?#].*$/, '');
  const PAGES = [
    ['chart/', '☉', 'My Chart', 'Your wheel, every placement, and today’s sky on it'],
    ['friends/', '👯', 'Friends & Groups', 'Pair and group charts, a reading every day'],
    ['oracle/', '🎙', 'Talk to Skye', 'The Shade Oracle, by voice or text'],
    ['school/', '🎓', 'The Shade School', '12 classes, quizzes and a certificate'],
    ['learn/', '✦', 'The Nebula', 'Explore every card in 3D, play the games'],
    ['', '🃏', 'The Deck', 'All 44 cards, with sound']
  ];
  const css = `#ssnav{display:inline-flex;gap:6px;align-items:center}
  .ssn-p{display:inline-flex;align-items:center;gap:5px;height:38px;padding:0 12px;border-radius:999px;border:1px solid rgba(242,196,102,.45);background:rgba(18,10,32,.72);
    color:#f2c466;font:700 14px 'Figtree',system-ui,sans-serif;text-decoration:none;white-space:nowrap;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer}
  @media (max-width:399px){.ssn-p{padding:0 10px;font-size:13.5px}#ssnav{gap:5px}}
  .ssn-p.m{width:38px;padding:0;justify-content:center;font-size:18px}
  .ssn-p.sk{border-color:transparent;background:linear-gradient(135deg,#ff5fa8,#b44dff);color:#fff;box-shadow:0 0 14px rgba(255,95,168,.45)}
  #ssnFixed{position:fixed;z-index:25;top:calc(env(safe-area-inset-top,0px) + 12px);left:12px}
  #ssnMenu{position:fixed;inset:0;z-index:90;background:rgba(6,3,14,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;justify-content:flex-end;font:16px 'Figtree',system-ui,sans-serif;color:#f3ecf9}
  #ssnMenu[hidden]{display:none}
  #ssnMenu .b{width:min(340px,88vw);height:100%;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 18px) 16px 30px;background:linear-gradient(170deg,#2a0f3d,#120820);border-left:1px solid rgba(242,196,102,.3)}
  #ssnMenu .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  #ssnMenu .hd b{font:700 20px 'Comfortaa',system-ui,sans-serif;color:#f2c466}
  #ssnMenu .x{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:none;color:inherit;font-size:18px}
  #ssnMenu a,#ssnMenu button.it{display:flex;gap:12px;align-items:center;width:100%;text-align:left;padding:13px 12px;margin:6px 0;border-radius:16px;text-decoration:none;color:inherit;
    border:1px solid rgba(47,37,70,.9);background:rgba(255,255,255,.04);font:inherit}
  #ssnMenu a[aria-current=page]{border-color:#f2c466;background:rgba(242,196,102,.1)}
  #ssnMenu a.inv{border:0;background:linear-gradient(135deg,#ff5fa8,#b44dff);color:#fff;box-shadow:0 0 16px rgba(255,95,168,.4)}#ssnMenu a.inv .i,#ssnMenu a.inv small{color:#fff}
  #ssnMenu .i{flex:0 0 32px;font-size:22px;text-align:center;color:#f2c466;font-family:'Astro','Figtree',system-ui,sans-serif}
  #ssnMenu .t b{display:block;font-size:16px}#ssnMenu .t small{color:#b9add0;font-size:13px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  let host = document.getElementById('ssnav');
  if (!host) { host = document.createElement('div'); host.id = 'ssnFixed'; document.body.appendChild(host); const inner = document.createElement('span'); inner.id = 'ssnav'; host.appendChild(inner); host = inner; }
  const onChart = here === BASE + 'chart/' || here === BASE + 'chart/index.html';
  const onSkye = here === BASE + 'oracle/' || here === BASE + 'oracle/index.html';
  const narrow = innerWidth < 400;
  host.innerHTML = (onSkye ? '' : `<a class="ssn-p sk" id="ssnSkye" href="${BASE}oracle/" aria-label="Talk to Skye">🎙 ${narrow ? 'Skye' : 'Talk to Skye'}</a>`) + (onChart ? '' : `<a class="ssn-p" id="ssnChart" href="${BASE}chart/" aria-label="My chart">☉ ${narrow ? 'Chart' : 'My chart'}</a>`) + `<button class="ssn-p m" id="ssnBtn" type="button" aria-label="Menu" aria-haspopup="dialog">☰</button>`;
  const chartLink = document.getElementById('ssnChart');
  if (chartLink && typeof window.SSNavChart === 'function') chartLink.onclick = e => { if (window.SSNavChart() !== false) e.preventDefault(); };   // a page can show the chart in place (the Nebula)

  const menu = document.createElement('div'); menu.id = 'ssnMenu'; menu.hidden = true; menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-label', 'Stars & Shade menu');
  let tester = false; try { tester = localStorage.getItem('ss-tester') === '1'; } catch (e) {}
  menu.innerHTML = `<div class="b"><div class="hd"><b>Stars &amp; Shade</b><button class="x" type="button" aria-label="Close menu">✕</button></div>
    <a class="inv" href="${BASE}friends/?invite=1"><span class="i">＋</span><span class="t"><b>Invite friends</b><small>See your charts together</small></span></a>
    ${PAGES.map(([p, i, t, s]) => { const url = BASE + p, cur = here === url || here === url + 'index.html';
      return `<a href="${url}"${cur ? ' aria-current="page"' : ''}><span class="i">${i}</span><span class="t"><b>${t}</b><small>${s}</small></span></a>`; }).join('')}
    <div id="ssnAcct"></div>
    ${tester ? '<button class="it" type="button" data-fb><span class="i">💬</span><span class="t"><b>Tester notes</b><small>Tell Justin what you think</small></span></button>' : ''}</div>`;
  document.body.appendChild(menu);
  const close = () => { menu.hidden = true; };
  document.getElementById('ssnBtn').onclick = () => { menu.hidden = false; };
  menu.querySelector('.x').onclick = close;
  menu.onclick = e => { if (e.target === menu) close(); };
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  const fb = menu.querySelector('[data-fb]'); if (fb) fb.onclick = () => { close(); window.SSFeedback && window.SSFeedback.open(); };
  // account row: sign in / sign out, on every menu (loads the account code if this page doesn't have it yet)
  const acctBox = menu.querySelector('#ssnAcct');
  const load = u => new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = u; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
  let acctP = null;
  const acct = () => acctP || (acctP = (async () => { if (!window.SSAcct) { if (!window.supabase) await load(BASE + 'vendor/supabase/supabase-2.118.0.js'); await load(BASE + 'js/account.js?v=28'); } return window.SSAcct; })());
  function paintAcct(u, prof) {
    if (u) { const name = (prof && prof.name) || u.email || 'your account';
      acctBox.innerHTML = `<button class="it" type="button" data-out><span class="i">⎋</span><span class="t"><b>Sign out</b><small>Signed in as ${String(name).replace(/[&<>"]/g, '')}</small></span></button>`;
      acctBox.querySelector('[data-out]').onclick = async () => { const b = acctBox.querySelector('[data-out] small'); b.textContent = 'Signing out…'; try { await window.SSAcct.signOut(); } catch (e) {} close(); location.reload(); };
    } else {
      acctBox.innerHTML = `<button class="it" type="button" data-in><span class="i">✦</span><span class="t"><b>Sign in</b><small>Or make a free account so Skye remembers you</small></span></button>`;
      acctBox.querySelector('[data-in]').onclick = async () => { close(); const A = await acct().catch(() => null); if (A) A.open('in'); };
    }
  }
  paintAcct(null);
  const hook = () => { if (window.SSAcct && !hook.done) { hook.done = true; window.SSAcct.onChange((u, p) => paintAcct(u, p)); } };
  hook(); if (!hook.done) { let session = false; try { session = Object.keys(localStorage).some(k => k.startsWith('ss-auth')); } catch (e) {} if (session) acct().then(hook).catch(() => {}); }
  document.getElementById('ssnBtn').addEventListener('click', hook);
  window.SSNav = { open: () => { menu.hidden = false; }, close };
})();
