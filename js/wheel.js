// Stars & Shade · flat, easy-to-read chart wheel (SVG), in the deck's style. Needs js/chart.js (SSChart).
// SSWheel.svg(chart) -> SVG markup. Rising sits on the left like every classic chart; Whole Sign houses
// (one sign per house), so each house slice shows its number AND its sign by name. Planets show glyph, name and degree.
(function (root) {
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const SG = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  const PG = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
  const ELEM = ['#ff8a3d', '#6fe38a', '#4fe3e0', '#7b8bff'];          // fire, earth, air, water
  const norm = x => ((x % 360) + 360) % 360;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const degTxt = lon => { const x = norm(lon) % 30; return `${Math.floor(x)}°${String(Math.floor((x % 1) * 60)).padStart(2, '0')}′`; };

  function svg(ch, opt) {
    opt = opt || {};
    const C = 500, asc = ch.asc != null ? ch.asc : Math.floor(ch.planets[0].lon / 30) * 30;
    const ang = lon => (180 + (norm(lon) - asc)) * Math.PI / 180;            // Rising at 9 o'clock, signs run counter-clockwise
    const P = (lon, r) => [C + r * Math.cos(ang(lon)), C - r * Math.sin(ang(lon))];
    const f = n => n.toFixed(1);
    const R = { out: 494, sIn: 372, hIn: 300, pl: 236 };
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="Birth chart wheel" class="sswheel">
<defs><radialGradient id="wbg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#3a1450"/><stop offset=".7" stop-color="#1a0b2c"/><stop offset="1" stop-color="#0d0718"/></radialGradient>
<filter id="wgl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<circle cx="${C}" cy="${C}" r="${R.out}" fill="url(#wbg)" stroke="#f2c466" stroke-width="3"/>`;
    // sign + house slices (Whole Sign: each sign is one house)
    const first = Math.floor(norm(asc) / 30);
    for (let i = 0; i < 12; i++) {
      const lon0 = i * 30, sign = i, house = ((i - first + 12) % 12) + 1, col = ELEM[i % 4];
      const a = P(lon0, R.out), b = P(lon0, R.hIn);
      s += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#f2c466" stroke-opacity=".55" stroke-width="2"/>`;
      // sign glyph + name in the outer ring
      const g = P(lon0 + 15, R.out - 36), n = P(lon0 + 15, R.out - 90);
      s += `<text x="${f(g[0])}" y="${f(g[1])}" font-family="Astro" font-size="48" fill="${col}" text-anchor="middle" dominant-baseline="central" filter="url(#wgl)">${SG[sign]}</text>`;
      const th = (180 + (lon0 + 15 - asc)) % 360, thn = ((th % 360) + 360) % 360, rot = thn <= 180 ? 90 - thn : -90 - thn;   // names follow the ring, always reading left to right
      s += `<text transform="translate(${f(n[0])} ${f(n[1])}) rotate(${f(rot)})" font-size="${SIGNS[sign].length > 9 ? 25 : 29}" font-weight="800" fill="#ffe3a3" text-anchor="middle" dominant-baseline="central">${SIGNS[sign].toUpperCase()}</text>`;
      // house number in the middle ring
      const h = P(lon0 + 15, (R.sIn + R.hIn) / 2);
      s += `<text x="${f(h[0])}" y="${f(h[1]) + 1}" font-size="40" font-weight="800" fill="#ff8fc8" text-anchor="middle" dominant-baseline="central">${house}</text>`;
    }
    s += `<circle cx="${C}" cy="${C}" r="${R.sIn}" fill="none" stroke="#f2c466" stroke-opacity=".6" stroke-width="2"/>
<circle cx="${C}" cy="${C}" r="${R.hIn}" fill="rgba(10,5,22,.55)" stroke="#40e0d0" stroke-opacity=".55" stroke-width="2"/>`;
    // Rising / Midheaven axes
    if (ch.asc != null) {
      const ax = (lon, lab, op) => { const a = P(lon, R.hIn), b = P(lon + 180, R.hIn); const t = P(lon + (lab === 'AC' ? -7 : 7), R.hIn - 26);
        return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#f2c466" stroke-opacity="${op}" stroke-width="2.5" stroke-dasharray="${lab === 'MC' ? '8 7' : ''}"/>
<text x="${f(t[0])}" y="${f(t[1])}" font-size="26" font-weight="800" fill="#f2c466" text-anchor="middle" dominant-baseline="central">${lab}</text>`; };
      s += ax(ch.asc, 'AC', .9) + ax(ch.mc, 'MC', .6);
    }
    // planets: glyph + degree, in up to three lanes so a stellium never piles up; a tick marks the exact degree
    const pts = ch.planets.map(p => ({ name: p.name, lon: norm(p.lon), retro: p.retro })).sort((a, b) => a.lon - b.lon);
    const LANES = [R.pl, R.pl - 96, R.pl - 190], MIN = [16, 30, 75];
    const dist = (a, b) => { const d = Math.abs(norm(a - b)); return Math.min(d, 360 - d); };
    for (const p of pts) { let k = LANES.findIndex((_, i) => pts.filter(q => q.lane === i).every(q => dist(q.at, p.lon) >= MIN[i]));
      if (k < 0) { k = 0; } p.lane = k; p.at = p.lon; }
    for (let it = 0; it < 80; it++) { let moved = false;                       // last resort: nudge within a lane
      for (let i = 0; i < 3; i++) { const L = pts.filter(q => q.lane === i).sort((a, b) => a.at - b.at);
        for (let j = 0; j < L.length && L.length > 1; j++) { const a = L[j], b = L[(j + 1) % L.length]; const d = norm(b.at - a.at);
          if (d < MIN[i]) { const push = (MIN[i] - d) / 2 + .1; a.at = norm(a.at - push); b.at = norm(b.at + push); moved = true; } } }
      if (!moved) break; }
    for (const p of pts) {
      const r = LANES[p.lane], t1 = P(p.lon, R.hIn), t2 = P(p.lon, R.hIn - 16), c = P(p.at, r), cc = P(p.at, r + 31);
      s += `<line x1="${f(t1[0])}" y1="${f(t1[1])}" x2="${f(t2[0])}" y2="${f(t2[1])}" stroke="#fff" stroke-width="4"/>`;
      s += `<line x1="${f(t2[0])}" y1="${f(t2[1])}" x2="${f(cc[0])}" y2="${f(cc[1])}" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>`;
      s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="31" fill="#160a26" stroke="#f2c466" stroke-width="2.5"/>`;
      s += `<text x="${f(c[0])}" y="${f(c[1]) + 1}" font-family="Astro" font-size="38" fill="#fff6e6" text-anchor="middle" dominant-baseline="central">${PG[p.name]}</text>`;
      const d = P(p.at, r - 50);
      s += `<text x="${f(d[0])}" y="${f(d[1])}" font-size="22" font-weight="800" fill="#ffe3a3" text-anchor="middle" dominant-baseline="central">${Math.floor(p.lon % 30)}°${p.retro ? ' Rx' : ''}</text>`;
    }
    if (opt.title) s += `<text x="${C}" y="${C + 9}" font-size="24" font-weight="800" fill="#f2c466" fill-opacity=".8" text-anchor="middle">${esc(opt.title)}</text>`;
    return s + '</svg>';
  }
  // symbol key, so nobody has to know the glyphs
  const legend = () => '<div class="sswkey">' + Object.entries(PG).map(([n, g]) => `<span><b style="font-family:Astro">${g}</b> ${n}</span>`).join('') + '</div>';
  root.SSWheel = { svg, legend, SIGNS };
})(typeof window !== 'undefined' ? window : globalThis);
