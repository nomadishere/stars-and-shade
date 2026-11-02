// Stars & Shade · tester feedback button. Only shows for people who opened the tester link (/test/), so the public never sees it.
// Notes go straight to the Supabase "feedback" table (insert-only; only Justin can read them).
(() => {
  let on = false;
  try { if (/[?&]tester=1/.test(location.search)) localStorage.setItem('ss-tester', '1'); on = localStorage.getItem('ss-tester') === '1'; } catch (e) {}
  if (!on) return;
  const URL_ = 'https://yrneifslwwrussqcjytj.supabase.co/rest/v1/feedback', KEY = 'sb_publishable_K3WhGEXDwkcEapRYgEITUA_Opn7GpY3';
  const css = `#ssFbBtn{position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 86px);z-index:70;padding:9px 13px;border-radius:999px;border:1px solid rgba(64,224,208,.6);
    background:rgba(10,6,22,.82);color:#7ff5e8;font:600 13px system-ui,sans-serif;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 0 16px rgba(64,224,208,.25)}
  #ssFb{position:fixed;inset:0;z-index:80;background:rgba(8,4,20,.72);display:flex;align-items:flex-end;justify-content:center;font:15px system-ui,sans-serif;color:#f3efe6}
  #ssFb[hidden]{display:none}
  #ssFb .b{width:100%;max-width:460px;margin:0 8px calc(env(safe-area-inset-bottom,0px) + 8px);padding:18px;border-radius:20px;background:linear-gradient(160deg,#2a0f3d,#150a26);border:1px solid rgba(255,111,181,.4)}
  #ssFb h3{margin:0 0 6px;font-size:19px}#ssFb p{margin:0 0 10px;opacity:.8;font-size:14px}
  #ssFb .m{display:flex;gap:6px;margin:6px 0 10px}#ssFb .m button{flex:1;padding:9px 4px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:inherit;font:inherit;font-size:13px}
  #ssFb .m button[aria-pressed=true]{border-color:#40e0d0;background:rgba(64,224,208,.18)}
  #ssFb textarea,#ssFb input{display:block;width:100%;box-sizing:border-box;margin:6px 0;padding:11px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:inherit;font:inherit;font-size:16px}
  #ssFb textarea{min-height:96px;resize:vertical}
  #ssFb .row{display:flex;gap:8px;margin-top:8px}#ssFb .go{flex:1;padding:12px;border-radius:999px;border:0;background:linear-gradient(135deg,#ff6fb5,#b36bff);color:#fff;font:700 15px system-ui,sans-serif}
  #ssFb .x{padding:12px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:none;color:inherit;font:inherit}
  #ssFb .s{min-height:1.2em;margin-top:8px;font-size:14px;color:#7ff5e8}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const btn = document.createElement('button'); btn.id = 'ssFbBtn'; btn.type = 'button'; btn.textContent = '✦ Tester notes'; document.body.appendChild(btn);
  const box = document.createElement('div'); box.id = 'ssFb'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Send a tester note');
  box.innerHTML = `<div class="b"><h3>Tell Justin what you think</h3><p>Anything goes: bugs, confusing bits, what you loved. It saves which page you're on.</p>
    <div class="m"><button type="button" data-m="love">💗 Love it</button><button type="button" data-m="ok">👍 Good</button><button type="button" data-m="meh">😐 Meh</button><button type="button" data-m="broken">🛠 Broken</button></div>
    <textarea id="ssFbMsg" placeholder="What happened? What would make it better?"></textarea>
    <input id="ssFbName" placeholder="Your name (so Justin knows who)" autocomplete="name">
    <div class="row"><button type="button" class="x">Close</button><button type="button" class="go">Send</button></div><div class="s" aria-live="polite"></div></div>`;
  document.body.appendChild(box);
  let mood = null; const $ = s => box.querySelector(s);
  try { $('#ssFbName').value = localStorage.getItem('ss-tester-name') || ''; } catch (e) {}
  box.querySelectorAll('.m button').forEach(b => b.onclick = () => { mood = b.dataset.m; box.querySelectorAll('.m button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  btn.onclick = () => { box.hidden = false; $('.s').textContent = ''; setTimeout(() => $('#ssFbMsg').focus(), 50); };
  $('.x').onclick = () => { box.hidden = true; };
  box.onclick = e => { if (e.target === box) box.hidden = true; };
  $('.go').onclick = async () => {
    const message = $('#ssFbMsg').value.trim(), name = $('#ssFbName').value.trim().slice(0, 80);
    if (!message) { $('.s').textContent = 'Type a quick note first.'; return; }
    try { localStorage.setItem('ss-tester-name', name); } catch (e) {}
    $('.go').disabled = true; $('.s').textContent = 'Sending…';
    try {
      const r = await fetch(URL_, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ name: name || null, page: (location.pathname + location.search).slice(0, 300), mood, message: message.slice(0, 3000), device: navigator.userAgent.slice(0, 400) }) });
      if (!r.ok) throw new Error(r.status);
      $('.s').textContent = 'Sent. Thank you! 💗'; $('#ssFbMsg').value = ''; mood = null; box.querySelectorAll('.m button').forEach(x => x.setAttribute('aria-pressed', false));
      setTimeout(() => { box.hidden = true; }, 1200);
    } catch (e) { $('.s').textContent = 'That didn’t send. Check your connection and try again.'; }
    $('.go').disabled = false;
  };
})();
