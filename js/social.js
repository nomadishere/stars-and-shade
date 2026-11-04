// Stars & Shade · friends, follows, pairs and groups.
// Math (synastry, house overlays, composite charts, group elements, the free daily line) runs on the phone, free.
// Data goes through checked database functions (ss_*): friends only ever see placements, never birth date, time or place.
// Needs js/chart.js, js/sky.js, js/cards.js, js/account.js (SSAcct).
(function (root) {
  const norm = x => ((x % 360) + 360) % 360;
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const ELEM = ['Fire', 'Earth', 'Air', 'Water'];
  const PCARD = { Sun: '013', Moon: '014', Mercury: '015', Venus: '016', Mars: '017', Jupiter: '018', Saturn: '019', Uranus: '020', Neptune: '021', Pluto: '022', Rising: '035', Midheaven: '039' };
  const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  const card = n => (root.CARDS || []).find(c => c.n === n) || { m: '', z: '', title: '' };
  const nice = m => m ? m.charAt(0) + m.slice(1).toLowerCase() : '';
  const sgn = lon => Math.floor(norm(lon) / 30);

  // ---- placements: the only chart data friends can see
  function placementsFrom(ch) {
    if (!ch) return null;
    return { planets: ch.planets.map(p => ({ name: p.name, lon: +p.lon.toFixed(2), retro: !!p.retro })), asc: ch.asc != null ? +ch.asc.toFixed(2) : null,
      mc: ch.mc != null ? +ch.mc.toFixed(2) : null, nn: ch.northNode != null ? +ch.northNode.toFixed(2) : null };
  }
  // a wheel-ready chart from placements (Whole Sign houses)
  function asChart(pl) {
    const first = pl.asc != null ? sgn(pl.asc) : null;
    return { planets: pl.planets.map(p => ({ ...p, n: PCARD[p.name], house: first == null ? null : ((sgn(p.lon) - first + 12) % 12) + 1 })), asc: pl.asc, mc: pl.mc, northNode: pl.nn };
  }

  // ---- synastry: how two charts hit each other
  const ASP = [[0, 'conjunct', 'fuses with', 0], [60, 'sextile', 'nudges', 1], [90, 'square', 'pokes', -1], [120, 'trine', 'flows with', 1], [180, 'opposite', 'faces off with', -1]];
  const BIG = ['Sun', 'Moon', 'Venus', 'Mars', 'Rising'];
  function pts(pl) { const p = pl.planets.map(x => ({ name: x.name, lon: x.lon })); if (pl.asc != null) p.push({ name: 'Rising', lon: pl.asc }); return p; }
  function synastry(A, B) {
    const hits = [];
    for (const a of pts(A)) for (const b of pts(B)) {
      const d0 = norm(a.lon - b.lon), d = Math.min(d0, 360 - d0);
      for (const [ang, label, verb, tone] of ASP) {
        const orb = (BIG.includes(a.name) && BIG.includes(b.name) ? 7 : 5) - (ang === 60 ? 2 : 0), off = Math.abs(d - ang);
        if (off <= orb) { const w = (BIG.includes(a.name) ? 2 : 1) * (BIG.includes(b.name) ? 2 : 1) * (1 - off / (orb + 1));
          hits.push({ a: a.name, b: b.name, aspect: label, verb, tone: tone === 0 ? (['Saturn', 'Pluto', 'Mars'].some(n => n === a.name || n === b.name) ? -0.5 : 0.8) : tone, off, w }); }
      }
    }
    hits.sort((x, y) => y.w - x.w);
    const flow = hits.filter(h => h.tone > 0).reduce((s, h) => s + h.w * h.tone, 0), spice = hits.filter(h => h.tone < 0).reduce((s, h) => s - h.w * h.tone, 0);
    const harmony = Math.round(100 * (flow + 1) / (flow + spice + 2));           // 0..100: how easy it flows (spice isn't bad, it's heat)
    return { hits, top: hits.slice(0, 8), harmony, heat: Math.round(Math.min(100, spice * 6)) };
  }
  // A's planets in B's houses (Whole Sign)
  function overlays(A, B) {
    if (B.asc == null) return [];
    const first = sgn(B.asc);
    return A.planets.map(p => ({ planet: p.name, house: ((sgn(p.lon) - first + 12) % 12) + 1 }));
  }

  // ---- composite: the midpoint chart of 2+ people (the "us" chart)
  function circMean(lons) { let x = 0, y = 0; for (const l of lons) { x += Math.cos(l * Math.PI / 180); y += Math.sin(l * Math.PI / 180); } return norm(Math.atan2(y, x) * 180 / Math.PI); }
  function composite(list) {
    const names = list[0].planets.map(p => p.name);
    const planets = names.map(n => ({ name: n, lon: +circMean(list.map(pl => pl.planets.find(p => p.name === n).lon)).toFixed(2), retro: false }));
    const hasAsc = list.every(pl => pl.asc != null);
    const pl = { planets, asc: hasAsc ? circMean(list.map(p => p.asc)) : null, mc: hasAsc && list.every(p => p.mc != null) ? circMean(list.map(p => p.mc)) : null, nn: null };
    return pl;
  }
  // ---- group element balance (Sun, Moon, Rising count double)
  function elements(list) {
    const c = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    for (const pl of list) { for (const p of pl.planets) c[ELEM[sgn(p.lon) % 4]] += (p.name === 'Sun' || p.name === 'Moon') ? 2 : 1; if (pl.asc != null) c[ELEM[sgn(pl.asc) % 4]] += 2; }
    const tot = Object.values(c).reduce((a, b) => a + b, 0) || 1;
    const pct = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(100 * v / tot)]));
    const sorted = Object.entries(pct).sort((a, b) => b[1] - a[1]);
    return { pct, lead: sorted[0][0], low: sorted[3][0] };
  }
  const ELEMCARD = { Water: '041', Air: '042', Fire: '043', Earth: '044' };

  // ---- the free daily line: today's sky on the pair/group chart, in Mom's words (no AI, costs nothing)
  function dailyLine(comp, date) {
    const S = root.SSSky; if (!S) return '';
    const t = S.timeFor(date), pos = S.positions(t);
    let hit = null;
    try { hit = S.transits(pos, asChart(comp)).items.find(h => PCARD[h.point]); } catch (e) {}
    if (hit) {
      const tp = card(PCARD[hit.planet]), np = card(PCARD[hit.point]), verb = (ASP.find(a => a[1] === hit.aspect) || [])[2] || hit.aspect;
      return `${hit.planet}${hit.retro ? ' (retrograde)' : ''} ${verb} your shared ${hit.point} today: ${nice(tp.m)} meets ${nice(np.m)}. “${tp.z}”`;
    }
    const moon = pos.find(p => p.name === 'Moon'), mc = card(String(sgn(moon.lon) + 1).padStart(3, '0'));
    let house = '';
    if (comp.asc != null) house = ` in your shared ${ORD[(sgn(moon.lon) - sgn(comp.asc) + 12) % 12]} house (${nice(card(String(23 + (sgn(moon.lon) - sgn(comp.asc) + 12) % 12).padStart(3, '0')).m)})`;
    return `Moon in ${mc.title}${house}: ${nice(mc.m)}. “${mc.z}”`;
  }

  // plain-words summary for the AI reader (no birth data, only placements)
  function describe(people, comp) {
    const line = (who, pl) => `${who}: ` + pl.planets.map(p => `${p.name} ${SIGNS[sgn(p.lon)]}${p.retro ? ' Rx' : ''}`).join(', ') + (pl.asc != null ? `, Rising ${SIGNS[sgn(pl.asc)]}` : '');
    const out = people.map(p => line(p.name || '@' + p.handle, p.placements));
    out.push(line('Composite (shared chart)', comp));
    if (people.length === 2) out.push('Top synastry: ' + synastry(people[0].placements, people[1].placements).top.map(h => `${people[0].name}'s ${h.a} ${h.aspect} ${people[1].name}'s ${h.b}`).join('; '));
    const el = elements(people.map(p => p.placements));
    out.push(`Element balance: ${Object.entries(el.pct).map(([k, v]) => k + ' ' + v + '%').join(', ')}`);
    return out.join('\n');
  }

  // ---- data (all through checked functions)
  const A = () => root.SSAcct;
  const rpc = async (fn, args) => { const { data, error } = await A().sb.rpc(fn, args || {}); if (error) throw new Error(error.message.replace(/^.*?exception:?\s*/i, '')); return data; };
  const api = {
    me: (o) => rpc('ss_me', o || {}),
    social: () => rpc('ss_social'),
    search: q => rpc('ss_search', { p_q: q }),
    friend: (id, action) => rpc('ss_friend', { p_target: id, p_action: action }),
    follow: (id, on) => rpc('ss_follow', { p_target: id, p_on: on }),
    group: (action, o) => rpc('ss_group', Object.assign({ p_action: action }, o || {})),
    inviteInfo: code => rpc('ss_invite_info', { p_code: code }),
    acceptInvite: code => rpc('ss_accept_invite', { p_code: code }),
    async reading(kind, id, mode) {   // mode: 'short' | 'full' | 'voice'
      const s = (await A().sb.auth.getSession()).data.session;
      const r = await fetch('https://yrneifslwwrussqcjytj.supabase.co/functions/v1/reading', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: 'sb_publishable_K3WhGEXDwkcEapRYgEITUA_Opn7GpY3', Authorization: 'Bearer ' + (s && s.access_token) },
        body: JSON.stringify({ kind, id, mode, day: new Date().toLocaleDateString('en-CA'), sky: (() => { try { return root.SSSky.positions(root.SSSky.timeFor()).map(p => ({ name: p.name, lon: +p.lon.toFixed(2), retro: p.retro })); } catch (e) { return []; } })() }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Skye couldn’t write that right now.'); return j;
    }
  };

  // keep my card in sync with my chart (placements only)
  async function syncMe() {
    const acct = A(); if (!acct || !acct.user) return null;
    let pl = null; try { const saved = root.SSMaker ? root.SSMaker.get() : JSON.parse(localStorage.getItem('ss-chart') || 'null'); if (saved && saved.input && saved.input.time) pl = placementsFrom(root.SSChart.compute(saved.input)); } catch (e) {}
    try { return await api.me({ p_name: (acct.profile && acct.profile.name) || null, p_placements: pl }); } catch (e) { return null; }
  }
  // invite links: /i/?c=CODE stores the code; after sign-in we accept it
  const PKEY = 'ss-invite';
  async function acceptPending() {
    let code = null; try { code = localStorage.getItem(PKEY); } catch (e) {}
    if (!code || !A() || !A().user) return null;
    try { const r = await api.acceptInvite(code); localStorage.removeItem(PKEY); return r; } catch (e) { localStorage.removeItem(PKEY); return null; }
  }
  const base = () => { const s = document.querySelector('script[src*="js/social.js"]'); return s ? new URL('..', s.src).href : location.origin + '/stars-and-shade/'; };
  const inviteUrl = code => base() + 'i/?c=' + encodeURIComponent(code);
  async function shareInvite(code, name, btn) {
    const url = inviteUrl(code), text = `${name ? name + ' wants' : 'I want'} to see our charts together on Stars & Shade ✦ Make your free chart and we'll get our pair reading:`;
    try { if (navigator.share) { await navigator.share({ title: 'Stars & Shade', text, url }); return 'shared'; } } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
    try { await navigator.clipboard.writeText(text + ' ' + url); if (btn) { const t = btn.innerHTML; btn.innerHTML = '✓ Link copied. Paste it in a text'; setTimeout(() => btn.innerHTML = t, 2600); } return 'copied'; } catch (e) {}
    prompt('Copy your invite link:', url); return 'prompt';
  }
  if (typeof addEventListener === 'function') {
    addEventListener('ss-chart', () => { setTimeout(syncMe, 400); });
  }

  root.SSSocial = { placementsFrom, asChart, synastry, overlays, composite, elements, ELEMCARD, dailyLine, describe, api, syncMe, acceptPending, inviteUrl, shareInvite, PKEY, card, nice, SIGNS, PCARD, ORD };
})(typeof window !== 'undefined' ? window : globalThis);
