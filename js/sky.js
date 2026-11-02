// Stars & Shade · the live sky ("what the planets are doing right now"), computed in the browser.
// Needs: vendor/astronomy, js/chart.js (SSChart). Free, no outside service, works for any number of people at once.
// SSSky.text(opts) -> words for Skye: today's planets (sign, degree, retrograde), the Moon's phase, what changes in the
// next ~6 weeks (sign changes, retrograde stations, new/full moons, eclipses) and, when a birth chart is given,
// today's transits to that chart (aspects + which of their Whole Sign houses each planet is moving through).
(function (root) {
  const A = root.Astronomy, S = () => root.SSChart;
  const norm = x => ((x % 360) + 360) % 360;
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const NAMES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  const ASPECTS = [[0, 'conjunct'], [60, 'sextile'], [90, 'square'], [120, 'trine'], [180, 'opposite']];
  const sign = lon => SIGNS[Math.floor(norm(lon) / 30)];
  const deg = lon => { const x = norm(lon) % 30; return `${Math.floor(x)}°${String(Math.floor((x % 1) * 60)).padStart(2, '0')}′`; };

  function lonOf(name, t) {
    if (name === 'Sun') return A.SunPosition(t).elon;
    if (name === 'Moon') return A.EclipticGeoMoon(t).lon;
    return A.Ecliptic(A.GeoVector(A.Body[name], t, true)).elon;
  }
  const speed = (name, t) => norm(lonOf(name, t.AddDays(0.5)) - lonOf(name, t.AddDays(-0.5)) + 180) - 180;   // degrees per day
  const meanNode = t => { const T = t.tt / 36525; return norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000); };

  // one day on the person's own calendar ('YYYY-MM-DD'), at noon local time, or right now
  function timeFor(date) {
    if (!date) return A.MakeTime(new Date());
    const [y, m, d] = String(date).split('-').map(Number);
    if (!y || !m || !d) return A.MakeTime(new Date());
    return A.MakeTime(new Date(y, m - 1, d, 12, 0));
  }
  const fmtDay = t => t.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  function positions(t) {
    return NAMES.map(name => { const lon = norm(lonOf(name, t)), v = speed(name, t);
      return { name, lon, sign: sign(lon), deg: deg(lon), retro: name !== 'Sun' && name !== 'Moon' && v < 0, speed: v }; });
  }

  function moonPhase(t) {
    const ph = A.MoonPhase(t), ill = A.Illumination(A.Body.Moon, t).phase_fraction;
    const label = ph < 10 || ph >= 350 ? 'New Moon' : ph < 80 ? 'Waxing Crescent' : ph < 100 ? 'First Quarter' : ph < 170 ? 'Waxing Gibbous'
      : ph < 190 ? 'Full Moon' : ph < 260 ? 'Waning Gibbous' : ph < 280 ? 'Last Quarter' : 'Waning Crescent';
    return `${label}, ${Math.round(ill * 100)}% lit`;
  }

  // what changes between t and t + days: sign changes, retrograde stations, new and full moons, eclipses
  function events(t, days) {
    const ev = [];
    for (const name of NAMES.slice(2)) {           // Sun and Moon sign changes are handled below (Moon too fast to list)
      let prevT = t, prevLon = lonOf(name, t), prevV = speed(name, t);
      for (let d = 1; d <= days; d++) {
        const nt = t.AddDays(d), lon = lonOf(name, nt), v = speed(name, nt);
        if (Math.floor(norm(lon) / 30) !== Math.floor(norm(prevLon) / 30)) {
          let a = prevT, b = nt; for (let i = 0; i < 18; i++) { const m = a.AddDays((b.ut - a.ut) / 2); if (Math.floor(norm(lonOf(name, m)) / 30) === Math.floor(norm(prevLon) / 30)) a = m; else b = m; }
          ev.push({ t: b, text: `${name} enters ${sign(lon)}${v < 0 ? ' (moving retrograde)' : ''}` });
        }
        if ((prevV < 0) !== (v < 0)) {
          let a = prevT, b = nt; for (let i = 0; i < 18; i++) { const m = a.AddDays((b.ut - a.ut) / 2); if ((speed(name, m) < 0) === (prevV < 0)) a = m; else b = m; }
          const at = norm(lonOf(name, b));
          ev.push({ t: b, text: `${name} stations ${v < 0 ? 'retrograde' : 'direct'} at ${deg(at)} ${sign(at)}` });
        }
        prevT = nt; prevLon = lon; prevV = v;
      }
    }
    // Sun sign changes
    let lon0 = lonOf('Sun', t);
    for (let k = 1; k <= 2; k++) { const target = norm((Math.floor(norm(lon0) / 30) + k) * 30); const hit = A.SearchSunLongitude(target, t, days); if (hit) ev.push({ t: hit, text: `Sun enters ${sign(target + 0.01)} (${sign(target + 0.01)} season begins)` }); }
    // New and full moons
    let q = A.SearchMoonQuarter(t);
    for (let i = 0; i < 12 && q.time.ut - t.ut <= days; i++) {
      if (q.quarter === 0 || q.quarter === 2) { const ml = norm(lonOf('Moon', q.time)); ev.push({ t: q.time, text: `${q.quarter === 0 ? 'New Moon' : 'Full Moon'} in ${sign(ml)} at ${deg(ml)}` }); }
      q = A.NextMoonQuarter(q);
    }
    // Eclipses
    try { const le = A.SearchLunarEclipse(t); if (le.peak.ut - t.ut <= days) ev.push({ t: le.peak, text: `${le.kind[0].toUpperCase() + le.kind.slice(1)} lunar eclipse in ${sign(lonOf('Moon', le.peak))}` }); } catch (e) {}
    try { const se = A.SearchGlobalSolarEclipse(t); if (se.peak.ut - t.ut <= days) ev.push({ t: se.peak, text: `${se.kind[0].toUpperCase() + se.kind.slice(1)} solar eclipse in ${sign(lonOf('Sun', se.peak))}` }); } catch (e) {}
    return ev.filter(e => e.t.ut >= t.ut).sort((a, b) => a.t.ut - b.t.ut);
  }

  // today's transits to a birth chart (output of SSChart.compute)
  function transits(pos, natal) {
    const points = natal.planets.map(p => ({ name: 'natal ' + p.name, lon: p.lon }));
    if (natal.asc != null) points.push({ name: 'natal Rising', lon: natal.asc }, { name: 'natal Midheaven', lon: natal.mc });
    const hits = [];
    for (const tp of pos) {
      if (tp.name === 'Moon') continue;                                    // the Moon changes aspects every few hours
      const orb = ['Sun', 'Mercury', 'Venus', 'Mars'].includes(tp.name) ? 2 : 3;
      for (const np of points) {
        const sep = norm(tp.lon - np.lon), d = Math.min(sep, 360 - sep);
        for (const [a, label] of ASPECTS) { const off = Math.abs(d - a); if (off <= orb) {
          // applying = getting closer (exact still ahead)
          const d2 = (() => { const s2 = norm(tp.lon + tp.speed * 0.5 - np.lon); return Math.abs(Math.min(s2, 360 - s2) - a); })();
          hits.push({ off, planet: tp.name, retro: tp.retro, aspect: label, point: np.name.replace('natal ', ''), applying: d2 < off, text: `transiting ${tp.name}${tp.retro ? ' (retrograde)' : ''} ${label} ${np.name} (${off.toFixed(1)}° ${d2 < off ? 'and tightening' : 'and separating'})` }); } }
      }
    }
    hits.sort((a, b) => a.off - b.off);
    let houses = '';
    if (natal.asc != null) {
      const first = Math.floor(norm(natal.asc) / 30);
      houses = pos.map(p => `${p.name} in their ${ORD[(Math.floor(p.lon / 30) - first + 12) % 12]}`).join(', ');
    }
    return { hits: hits.slice(0, 14).map(h => h.text), items: hits.slice(0, 14), houses };
  }

  // words for Skye. opts: { date: 'YYYY-MM-DD' (default now), chart: saved chart from SSMaker (optional), days: look-ahead (default 45) }
  function text(opts) {
    opts = opts || {};
    const t = timeFor(opts.date), pos = positions(t), days = Math.min(Math.max(+opts.days || 45, 7), 120);
    const isNow = !opts.date;
    const node = meanNode(t), retros = pos.filter(p => p.retro).map(p => p.name);
    const lines = [];
    lines.push(`[SKY] Live sky data calculated by the Stars & Shade site (tropical zodiac, accurate to about 1 arcminute) for ${isNow ? 'right now, ' + fmtDay(t) : fmtDay(t)}. Not said out loud by the person.`);
    lines.push('Planets: ' + pos.map(p => `${p.name} ${p.deg} ${p.sign}${p.retro ? ' retrograde' : ''}`).join('; ') + `; North Node ${deg(node)} ${sign(node)}, South Node ${deg(node + 180)} ${sign(node + 180)}.`);
    lines.push(`Moon phase: ${moonPhase(t)}. Retrograde right now: ${retros.length ? retros.join(', ') : 'nothing (no planets retrograde)'}.`);
    const ev = events(t, days);
    if (ev.length) lines.push(`Coming up in the next ${days} days: ` + ev.map(e => `${fmtDay(e.t)}: ${e.text}`).join('; ') + '.');
    const saved = opts.chart === undefined ? (root.SSMaker && root.SSMaker.get && root.SSMaker.get()) : opts.chart;
    if (saved && saved.input) {
      try {
        const natal = S().compute(saved.input), tr = transits(pos, natal);
        lines.push(`Transits to this person's birth chart: ${tr.hits.length ? tr.hits.join('; ') : 'no tight aspects to their planets right now'}.` + (tr.houses ? ` Whole Sign houses the planets are moving through in their chart: ${tr.houses}.` : ''));
      } catch (e) {}
    }
    lines.push('Use this when they ask what the planets are doing, about retrogrades, timing, launches or "why is this week like this". Trust these positions over anything you remember. Don\'t read the list back; pick what matters and say it like a friend, with the deck\'s zingers and mottos for any card you mention. For another date, call get_sky.');
    return lines.join('\n');
  }

  // today's hits on a chart, worded as questions to ask Skye (chart page links + chips in Skye's chat)
  function hitQ(h) { return `What does it mean for me that ${h.planet}${h.retro ? ' (retrograde)' : ''} is ${h.aspect === 'conjunct' ? 'sitting on' : h.aspect} my ${h.point} right now?`; }
  function questions(natal, n) { try { return transits(positions(timeFor()), natal).items.slice(0, n || 6).map(hitQ); } catch (e) { return []; } }
  root.SSSky = { text, positions, events, transits, moonPhase, timeFor, hitQ, questions };
})(typeof window !== 'undefined' ? window : globalThis);
