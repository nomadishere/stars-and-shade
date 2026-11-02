// Stars & Shade · My Chart: birth date + time + city -> the whole chart, calculated here (js/chart.js).
// Readings are built from Mom's cards: every placement = Planet motto + Sign motto + House motto, with the zingers.
const N = window.__nebula, C = window.CARDS, L = window.LEARN, B = window.BUILD, G = window.GLYPH, S = window.SSChart;
const byN = Object.fromEntries(C.map(c => [c.n, c]));
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const nice = m => m.charAt(0) + m.slice(1).toLowerCase();
const ord = h => B.ord[h - 1];
const KEY = 'ss-chart';
const box = $('chartBox');
let saved = null, chart = null, editing = false, place = null;
try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}

function load() { if (saved) { try { chart = S.compute(saved.input); } catch (e) { chart = null; } } }
load();
window.SSMyChart = () => (saved && chart ? { saved, chart } : null);

// ---------------------------------------------------------------- city search: Open-Meteo (free, no key), backup list built in
let timer = 0, seq = 0;
const search = q => window.SSMaker.search(q);   // shared city search (Open-Meteo + built-in backup list)

function form() {
  const i = saved ? saved.input : {}; place = saved ? { label: saved.place, lat: i.lat, lng: i.lng, tz: i.tz } : null;
  box.innerHTML = `<div class="kick">Your birth chart</div><h2>Make my chart</h2>
    <p class="muted" style="margin:6px 0 12px">When and where were you born, down to the minute? We calculate your whole chart right here: planets, signs, houses and your Rising.</p>
    <label class="fl">Birth date<input type="date" id="bDate" class="inp" value="${esc(i.date || '')}" max="${window.SSMaker.today()}"></label>
    <label class="fl">Birth time<input type="time" id="bTime" class="inp" value="${esc(i.time || '')}"></label>
    <p class="muted" style="font-size:12.5px;margin:-4px 0 12px">Your exact birth time matters: it sets your Rising sign and your houses. Check your birth certificate or ask family.</p>
    <label class="fl">Birth city<input type="text" id="bCity" class="inp" placeholder="Start typing your city" autocomplete="off" value="${esc(saved ? saved.place : '')}"></label>
    <div id="bList" class="clist" role="listbox"></div>
    <p class="fb" id="bErr"></p>
    <div class="row" style="justify-content:flex-start;margin-top:4px"><button class="btn sm" id="bGo" type="button">Make my chart ✦</button>${saved ? '<button class="ghost" id="bCancel" type="button">Cancel</button>' : ''}</div>`;
  $('bCity').oninput = () => { place = null; clearTimeout(timer); const q = $('bCity').value.trim(); if (q.length < 2) { $('bList').innerHTML = ''; return; }
    timer = setTimeout(async () => { const id = ++seq, res = await search(q); if (id !== seq || !res) return;
      $('bList').innerHTML = res.length ? res.map((r, k) => `<button type="button" data-k="${k}">${esc(r.label)}</button>`).join('') : '<div class="muted" style="padding:8px">No match yet. Keep typing, or try a bigger city nearby.</div>';
      $('bList').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { place = res[+b.dataset.k]; $('bCity').value = place.label; $('bList').innerHTML = ''; err(''); }); }, 280); };
  if ($('bCancel')) $('bCancel').onclick = () => { editing = false; render(); };
  $('bGo').onclick = async () => {
    const date = $('bDate').value, time = $('bTime').value;
    if (!date) return err('Add your birth date.');
    if (window.SSMaker.badDate(date)) return err('That birth date can’t be right. Check the year.');
    if (!time) return err('Add your birth time. It’s what makes your Rising sign and houses accurate.');
    if (!place) { const v = $('bCity').value.trim(); if (v.length >= 2) { const r = await search(v); if (r && r.length === 1) place = r[0]; } }
    if (!place) return err('Pick your birth city from the list.');
    saved = { input: { date, time, lat: place.lat, lng: place.lng, tz: place.tz }, place: place.label, made: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
    load(); editing = false; render(); show3D(true); N.burst($('chartBox')); N.toast('✦ Your chart is in the sky', 2400);
  };
  function err(t) { $('bErr').textContent = t; }
}

// ---------------------------------------------------------------- reading the chart with the deck
function placementCard(pl) {
  const P = byN[pl.n], Sg = byN[S.signN(pl.lon)], H = pl.house ? byN[S.houseN(pl.house)] : null;
  const what = B.what[pl.n], how = B.how[Sg.n], where = H ? B.where[H.n] : '';
  return { P, Sg, H, title: `${P.title} in ${Sg.title}${H ? ` · ${ord(pl.house)} House` : ''}`, deg: S.deg(pl.lon),
    mottos: `${nice(P.m)} + ${nice(Sg.m)}${H ? ' + ' + nice(H.m) : ''}`, read: `${what} ${how}${where ? ' ' + where : ''}.` };
}
function pointRow(n, lon, house, label) {
  const Sg = byN[S.signN(lon)], H = house ? byN[S.houseN(house)] : null, X = byN[n];
  return { P: X, Sg, H, title: `${label || X.title} in ${Sg.title}${H ? ` · ${ord(house)} House` : ''}`, deg: S.deg(lon), mottos: `${nice(X.m)} + ${nice(Sg.m)}${H ? ' + ' + nice(H.m) : ''}`,
    read: `${L[n].u}` };
}

function render() {
  if (!saved || !chart || editing || !saved.input.time) return form();   // birth time is required
  const ch = chart, sun = ch.planets[0], moon = ch.planets[1];
  const big = [
    ['013', 'Sun', 'who you are', byN[S.signN(sun.lon)]],
    ['014', 'Moon', 'what you need', byN[S.signN(moon.lon)]],
    ['035', 'Rising', 'how you walk in', ch.known ? byN[S.signN(ch.asc)] : null]
  ];
  const rows = ch.planets.map(placementCard);
  if (ch.known) { rows.unshift(pointRow('035', ch.asc, 0, 'Rising')); rows.push(pointRow('039', ch.mc, 0, 'Midheaven')); rows.push(pointRow('040', ch.fortune, ch.fortuneHouse)); }
  rows.push(pointRow('037', ch.northNode, ch.nodeHouse), pointRow('038', ch.southNode, ch.sNodeHouse));
  box.innerHTML = `<div class="kick">Your birth chart</div><h2>Your Big Three</h2>
    <p class="muted" style="margin:4px 0 12px">${esc(saved.place)} · ${esc(new Date(saved.input.date + 'T12:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }))}${saved.input.time ? ' · ' + esc(saved.input.time) : ' · time unknown'}</p>
    <div class="big3">${big.map(([n, lab, what, Sg]) => Sg ? `<button type="button" class="b3" data-open="${Sg.n}"><span class="g">${esc(G[n])}</span><b>${esc(lab)}</b><span class="sg"><span class="astro">${esc(G[Sg.n])}</span> ${esc(Sg.title)}</span><small>${esc(what)}</small><i>“${esc(Sg.z)}”</i></button>`
      : `<div class="b3 off"><span class="g">${esc(G[n])}</span><b>${esc(lab)}</b><small>Needs your birth time</small></div>`).join('')}</div>
    ${!ch.known ? '<p class="fb" style="margin-top:10px">No birth time, so Rising, Midheaven and houses are skipped' + (ch.moonSure ? '.' : ', and your Moon changed signs that day, so it might be the next sign over.') + '</p>' : ''}
    <div class="row" style="justify-content:flex-start;margin:14px 0 4px">
      <button class="btn sm" id="cSky" type="button">${N.hasNatal() ? '✦ Showing in the sky' : 'Show it in the sky ✦'}</button>
      <a class="ghost" href="../oracle/?chart=1" style="text-decoration:none">🎙 Have the Oracle read it</a></div>
    <h3>Every placement</h3>
    <div class="plist">${rows.map((r, k) => `<details class="pl"><summary><span class="astro g">${esc(G[r.P.n])}</span><span class="t">${esc(r.title)}</span><span class="d">${esc(r.deg)}</span></summary>
      <div class="pb"><div class="mm"><em>${esc(r.mottos)}</em></div><p>${esc(r.read)}</p><p class="z">“${esc(r.P.z)}” · “${esc(r.Sg.z)}”${r.H ? ` · “${esc(r.H.z)}”` : ''}</p>
      <div class="row" style="justify-content:flex-start">${[r.P, r.Sg, r.H].filter(Boolean).map(c => `<button type="button" class="ghost sm2" data-open="${c.n}">▶ ${esc(c.title)}</button>`).join('')}</div></div></details>`).join('')}</div>
    <p class="muted" style="font-size:12.5px;margin-top:12px">Tropical zodiac · ${ch.known ? esc(ch.houseSystem) + ' houses' : 'no houses without a birth time'}. Saved on this phone only.</p>
    <div class="row" style="justify-content:flex-start"><button class="ghost" id="cEdit" type="button">Edit birth details</button><button class="ghost" id="cDel" type="button">Delete my chart</button></div>`;
  box.querySelectorAll('[data-open]').forEach(b => b.onclick = () => N.openLesson(b.dataset.open));
  $('cSky').onclick = () => { show3D(!N.hasNatal()); render(); };
  $('cEdit').onclick = () => { editing = true; render(); };
  $('cDel').onclick = () => { const b = $('cDel'); if (!b.dataset.arm) { b.dataset.arm = 1; b.textContent = 'Tap again to delete'; return; }
    try { localStorage.removeItem(KEY); } catch (e) {} saved = chart = null; N.clearNatal(); render(); };
}

function show3D(on) {
  if (on && chart) { N.setNatal(chart); const ns = chart.planets.map(p => p.n).concat(chart.known ? ['035', '039'] : []); N.highlight(ns); N.goPreset('wide'); }
  else { N.clearNatal(); N.highlight(); }
}

// draw it whenever My Sky opens; put the chart in the sky on arrival if they made one before
const sky = $('skySheet');
new MutationObserver(() => { if (sky.classList.contains('open')) render(); }).observe(sky, { attributes: true, attributeFilter: ['class'] });
render();
if (chart) setTimeout(() => { if (N.tab() === 'explore') show3D(true); }, 6500);
