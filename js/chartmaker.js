// Stars & Shade · Free chart maker, usable on any page (home, Oracle, classroom, Nebula).
// Needs: vendor/astronomy, js/chart.js (SSChart), js/cards.js (CARDS). Saves to localStorage 'ss-chart',
// the same chart the Nebula's My Sky shows. Birth time is always required.
(() => {
  const BASE = (document.currentScript && document.currentScript.src) ? new URL('..', document.currentScript.src).href : new URL('./', location.href).href;
  const KEY = 'ss-chart';
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  const nice = m => m ? m.charAt(0) + m.slice(1).toLowerCase() : '';
  const card = n => (window.CARDS || []).find(c => c.n === n) || {};
  const signCard = lon => card(window.SSChart.signN(lon));
  const houseCard = h => h ? card(window.SSChart.houseN(h)) : null;

  function get() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.input && s.input.time ? s : null; } catch (e) { return null; } }
  function compute(saved) { try { return window.SSChart.compute(saved.input); } catch (e) { return null; } }

  // ---- city search: Open-Meteo (free, no key), built-in backup list
  let cities = null;
  async function search(q) {
    q = String(q || '').trim(); if (q.length < 2) return [];
    const name = q.split(',')[0].trim(), rest = q.split(',').slice(1).join(' ').toLowerCase().trim();
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`);
      if (!r.ok) throw 0; const j = await r.json();
      let res = (j.results || []).filter(x => x.timezone).map(x => ({ label: [x.name, x.admin1, x.country].filter(Boolean).join(', '), lat: x.latitude, lng: x.longitude, tz: x.timezone, cc: x.country_code || '' }));
      if (rest) { const hit = res.filter(x => rest.split(/\s+/).every(w => (x.label + ' ' + x.cc).toLowerCase().includes(w))); if (hit.length) res = hit.concat(res.filter(x => !hit.includes(x))); }
      if (res.length) return res.slice(0, 8);
      throw 0;
    } catch (e) {
      if (!cities) cities = await fetch(BASE + 'js/cities-fallback.json').then(r => r.json()).catch(() => []);
      const k = name.toLowerCase();
      return cities.filter(c => c[0].toLowerCase().startsWith(k)).slice(0, 8).map(c => ({ label: [c[0], c[1], c[2]].filter(Boolean).join(', '), lat: c[3], lng: c[4], tz: c[5] }));
    }
  }

  function save(date, time, place) {
    const saved = { input: { date, time, lat: place.lat, lng: place.lng, tz: place.tz }, place: place.label, made: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
    try { dispatchEvent(new CustomEvent('ss-chart', { detail: saved })); } catch (e) {}
    return saved;
  }

  // ---- the chart as words, for the Oracle
  function text(saved, opener) {
    saved = saved || get(); if (!saved) return null; const S = window.SSChart, c = compute(saved); if (!c) return null;
    const o = h => ORD[h - 1];
    const pl = c.planets.map(p => `${p.name} in ${S.sign(p.lon)} ${S.deg(p.lon)}${p.house ? ' in the ' + o(p.house) + ' house' : ''}${p.retro ? ' (retrograde)' : ''}`);
    const extra = [`Rising (Ascendant) ${S.sign(c.asc)} ${S.deg(c.asc)}`, `Midheaven ${S.sign(c.mc)} ${S.deg(c.mc)}`, `Lot of Fortune ${S.sign(c.fortune)} in the ${o(c.fortuneHouse)} house`, `North Node ${S.sign(c.northNode)} in the ${o(c.nodeHouse)} house`, `South Node ${S.sign(c.southNode)} in the ${o(c.sNodeHouse)} house`];
    const head = opener || '[CHART] Here is my birth chart, calculated on the Stars & Shade site';
    return `${head} (born ${saved.input.date} at ${saved.input.time} in ${saved.place}; tropical, ${c.houseSystem} houses): ${extra.concat(pl).join('; ')}. Read my Big Three first (Sun, Moon, Rising) using the deck's zingers and mottos, keep it short and real, then ask what I want to dig into next.`;
  }

  // ---- normalize what the Oracle heard
  function normDate(d) { d = String(d || '').trim(); let m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = d.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/); if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
    const t = Date.parse(d + ' 12:00'); if (!isNaN(t)) { const x = new Date(t); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; } return null; }
  function normTime(t) { t = String(t || '').trim().toLowerCase().replace(/\./g, ''); const m = t.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a|p)?$/); if (!m) return null;
    let h = +m[1], mi = +(m[2] || 0); const ap = m[3]; if (ap) { if (h === 12) h = 0; if (ap[0] === 'p') h += 12; } if (h > 23 || mi > 59) return null; return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`; }

  // the Oracle's make_birth_chart tool lands here
  async function fromTool(p) {
    p = p || {}; const date = normDate(p.birth_date), time = normTime(p.birth_time);
    if (!date) return { ok: false, text: 'The birth date was not clear. Ask for it again (month, day and year).' };
    if (date > new Date().toISOString().slice(0, 10) || date < '1800-01-01') return { ok: false, text: 'That birth date is not possible. Ask for it again.' };
    if (!time) return { ok: false, text: 'Birth time is missing or unclear. The chart needs the exact birth time; ask for it (they can check the birth certificate or ask family). Do not guess.' };
    const res = await search(p.birth_city);
    if (!res.length) return { ok: false, text: `Could not find the city "${p.birth_city}". Ask for a nearby bigger city, or the city with its state or country.` };
    const saved = save(date, time, res[0]);
    return { ok: true, saved, text: text(saved, `Chart made and saved for them. Birth chart`) + ' Do not read this list out loud; read it like a friend.' };
  }

  // ---- styles (scoped)
  const css = `.ssm{--ssm-pink:#ff6fb5;font:inherit;color:inherit;text-align:left}
  .ssm h3{margin:0 0 4px;font-size:20px}.ssm .ssm-k{font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.7;margin-bottom:4px}
  .ssm p{margin:4px 0 10px}.ssm .ssm-m{opacity:.75;font-size:14px}
  .ssm label{display:block;font-size:13px;font-weight:600;margin:10px 0 0}
  .ssm input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:12px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:inherit;font:inherit;font-size:16px;-webkit-appearance:none;appearance:none;min-height:46px}
  .ssm input::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.7}
  .ssm .ssm-list{display:flex;flex-direction:column;gap:4px;margin-top:6px}
  .ssm .ssm-list button{text-align:left;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:inherit;font:inherit;font-size:14px}
  .ssm .ssm-err{color:#ffb3d6;font-size:14px;min-height:1em;margin:8px 0 0}
  .ssm .ssm-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
  .ssm .ssm-btn{padding:12px 18px;border-radius:999px;border:0;background:linear-gradient(135deg,#ff6fb5,#b36bff);color:#fff;font:inherit;font-weight:700;font-size:15px;text-decoration:none;display:inline-block}
  .ssm .ssm-gh{padding:11px 15px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:transparent;color:inherit;font:inherit;font-size:14px;text-decoration:none;display:inline-block}
  .ssm .ssm-b3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 2px}
  .ssm .ssm-c{border-radius:14px;padding:10px 9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14)}
  .ssm .ssm-c b{display:block;font-size:12px;opacity:.75;font-weight:600}.ssm .ssm-c span{display:block;font-size:17px;font-weight:800;margin:2px 0}
  .ssm .ssm-c i{display:block;font-size:12.5px;opacity:.85;line-height:1.3}.ssm .ssm-c em{display:block;font-style:normal;font-size:11px;letter-spacing:.08em;margin-top:5px;color:var(--ssm-pink)}
  @media (max-width:360px){.ssm .ssm-b3{grid-template-columns:1fr}}`;
  function style() { if (document.getElementById('ssm-css')) return; const s = document.createElement('style'); s.id = 'ssm-css'; s.textContent = css; document.head.appendChild(s); }

  // Big Three summary card (also used inside the Oracle chat)
  function big3(saved) {
    const c = compute(saved); if (!c) return '';
    const S = window.SSChart, sun = c.planets[0], moon = c.planets[1];
    const rows = [['Sun', sun.lon, sun.house], ['Moon', moon.lon, moon.house], ['Rising', c.asc, 0]];
    return `<div class="ssm-b3">${rows.map(([lab, lon, h]) => { const sg = signCard(lon), hc = houseCard(h);
      return `<div class="ssm-c"><b>${lab}</b><span>${esc(S.sign(lon))}</span><i>“${esc(sg.z || '')}”</i><em>${esc((sg.m || '') + (hc ? ' · ' + ORD[h - 1] + ' house' : ''))}</em></div>`; }).join('')}</div>`;
  }

  // mount(el, { oracle: fn(saved) | false, sky: bool, title, onMade(saved) })
  function mount(el, opt) {
    style(); opt = opt || {}; el.classList.add('ssm');
    let editing = false;
    const draw = () => { const s = get(); if (s && !editing) summary(s); else form(s); };
    function summary(s) {
      const when = new Date(s.input.date + 'T12:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      el.innerHTML = `<div class="ssm-k">Your free birth chart</div><h3>Your Big Three</h3><p class="ssm-m">${esc(s.place)} · ${esc(when)} · ${esc(s.input.time)}</p>${big3(s)}
        <div class="ssm-row">${opt.oracle === false ? '' : `<a class="ssm-btn" data-a="oracle" href="${BASE}oracle/?chart=1">🎙 Have the Oracle read it</a>`}
        ${opt.sky === false ? '' : `<a class="ssm-gh" href="${BASE}learn/?sky=1">See it in the 3D sky ✦</a>`}
        <button class="ssm-gh" type="button" data-a="edit">Edit</button></div>
        <p class="ssm-m" style="font-size:12px;margin-top:10px">Calculated right here (tropical zodiac, Placidus houses). Saved on this device only.</p>`;
      el.querySelector('[data-a=edit]').onclick = () => { editing = true; draw(); };
      const o = el.querySelector('[data-a=oracle]'); if (o && typeof opt.oracle === 'function') o.onclick = e => { e.preventDefault(); opt.oracle(s); };
    }
    function form(s) {
      const i = s ? s.input : {}; let place = s ? { label: s.place, lat: i.lat, lng: i.lng, tz: i.tz } : null, timer = 0, seq = 0;
      el.innerHTML = `<div class="ssm-k">Free birth chart</div><h3>${esc(opt.title || 'Make your chart')}</h3>
        <p class="ssm-m">Your whole sky at the minute you were born: planets, signs, houses and your Rising. Free, calculated right here.</p>
        <label>Birth date<input type="date" data-f="d" value="${esc(i.date || '')}" max="${new Date().toISOString().slice(0, 10)}"></label>
        <label>Birth time<input type="time" data-f="t" value="${esc(i.time || '')}"></label>
        <p class="ssm-m" style="font-size:12.5px;margin-top:6px">The exact time matters: it sets your Rising and your houses. Check your birth certificate or ask family.</p>
        <label>Birth city<input type="text" data-f="c" placeholder="Start typing your city" autocomplete="off" value="${esc(s ? s.place : '')}"></label>
        <div class="ssm-list" role="listbox"></div><p class="ssm-err"></p>
        <div class="ssm-row"><button class="ssm-btn" type="button" data-a="go">Make my chart ✦</button>${s ? '<button class="ssm-gh" type="button" data-a="x">Cancel</button>' : ''}</div>`;
      const q = k => el.querySelector(`[data-f=${k}]`), list = el.querySelector('.ssm-list'), err = t => { el.querySelector('.ssm-err').textContent = t; };
      q('c').oninput = () => { place = null; clearTimeout(timer); const v = q('c').value.trim(); if (v.length < 2) { list.innerHTML = ''; return; }
        timer = setTimeout(async () => { const id = ++seq, res = await search(v); if (id !== seq) return;
          list.innerHTML = res.length ? res.map((r, k) => `<button type="button" data-k="${k}">${esc(r.label)}</button>`).join('') : '<div class="ssm-m" style="padding:6px 2px">No match yet. Keep typing, or try a bigger city nearby.</div>';
          list.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { place = res[+b.dataset.k]; q('c').value = place.label; list.innerHTML = ''; err(''); }); }, 280); };
      const x = el.querySelector('[data-a=x]'); if (x) x.onclick = () => { editing = false; draw(); };
      el.querySelector('[data-a=go]').onclick = async () => {
        const d = q('d').value, t = q('t').value;
        if (!d) return err('Add your birth date.');
        if (!t) return err('Add your birth time. It’s what makes your Rising sign and houses accurate.');
        if (!place) { const v = q('c').value.trim(); if (v.length >= 2) { const res = await search(v); if (res.length === 1) place = res[0]; } }
        if (!place) return err('Pick your birth city from the list.');
        const saved = save(d, t, place); editing = false; draw(); if (opt.onMade) opt.onMade(saved);
      };
    }
    addEventListener('ss-chart', () => { if (!editing) draw(); });
    draw();
    return { redraw: draw };
  }

  window.SSMaker = { get, search, save, text, fromTool, mount, big3, style, normDate, normTime };
})();
