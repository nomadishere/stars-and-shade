// Stars & Shade · birth chart engine (runs entirely in the browser, no outside chart site).
// Planet positions: Astronomy Engine (MIT, ±1 arcminute). Angles: standard spherical astronomy. Houses: Whole Sign
// (Placidus available as an option). Tropical zodiac, mean lunar node.
(function (root) {
  const A = root.Astronomy;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const norm = x => ((x % 360) + 360) % 360;
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const BODIES = [['013', 'Sun'], ['014', 'Moon'], ['015', 'Mercury'], ['016', 'Venus'], ['017', 'Mars'], ['018', 'Jupiter'], ['019', 'Saturn'], ['020', 'Uranus'], ['021', 'Neptune'], ['022', 'Pluto']];

  // local wall-clock time in an IANA zone -> UTC Date (handles DST and historic offsets via the browser's tz database)
  function zonedToUtc(y, mo, d, h, mi, tz) {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const offsetAt = ms => { const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms; };
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    let t = guess - offsetAt(guess); t = guess - offsetAt(t);
    return new Date(t);
  }

  function lonOf(name, t) {
    if (name === 'Sun') return A.SunPosition(t).elon;
    if (name === 'Moon') return A.EclipticGeoMoon(t).lon;
    return A.Ecliptic(A.GeoVector(A.Body[name], t, true)).elon;
  }

  function placidus(ramc, eps, phi) {
    const e = eps * D2R, f = phi * D2R;
    const lamFromRa = ra => norm(Math.atan2(Math.sin(ra * D2R), Math.cos(ra * D2R) * Math.cos(e)) * R2D);
    const cusp = (frac, upper) => {
      let ra = upper ? ramc + 90 * frac : ramc + 180 - 90 * frac;
      for (let i = 0; i < 40; i++) {
        const lam = lamFromRa(ra), dec = Math.asin(Math.sin(e) * Math.sin(lam * D2R));
        const x = -Math.tan(f) * Math.tan(dec); if (Math.abs(x) > 1) return null;
        const sda = Math.acos(x) * R2D, sna = 180 - sda;
        const next = upper ? ramc + sda * frac : ramc + 180 - sna * frac;
        if (Math.abs(norm(next - ra + 180) - 180) < 1e-7) { ra = next; break; } ra = next;
      }
      return lamFromRa(ra);
    };
    const c11 = cusp(1 / 3, true), c12 = cusp(2 / 3, true), c2 = cusp(2 / 3, false), c3 = cusp(1 / 3, false);
    return [c11, c12, c2, c3].some(v => v == null) ? null : { c11, c12, c2, c3 };
  }

  // input: { date: 'YYYY-MM-DD', time: 'HH:MM' or '' (unknown), lat, lng, tz }
  function compute(inp) {
    const [y, mo, d] = inp.date.split('-').map(Number);
    const known = !!inp.time; const [h, mi] = known ? inp.time.split(':').map(Number) : [12, 0];
    const utc = zonedToUtc(y, mo, d, h, mi, inp.tz), t = A.MakeTime(utc);
    const T = t.tt / 36525;
    const planets = BODIES.map(([n, name]) => {
      const lon = norm(lonOf(name, t)), later = norm(lonOf(name, t.AddDays(0.5)));
      const speed = norm(later - lon + 180) - 180;
      return { n, name, lon, retro: name !== 'Sun' && name !== 'Moon' && speed < 0 };
    });
    // Moon moves ~13°/day: with no birth time, say whether its sign could differ
    let moonSure = true;
    if (!known) { const lo = norm(lonOf('Moon', A.MakeTime(zonedToUtc(y, mo, d, 0, 0, inp.tz)))), hi = norm(lonOf('Moon', A.MakeTime(zonedToUtc(y, mo, d, 23, 59, inp.tz))));
      moonSure = Math.floor(lo / 30) === Math.floor(hi / 30); }
    const node = norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000);
    const out = { utc: utc.toISOString(), known, moonSure, planets, northNode: node, southNode: norm(node + 180) };
    if (known) {
      const eps = 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T;
      const ramc = norm(A.SiderealTime(t) * 15 + inp.lng), e = eps * D2R, f = inp.lat * D2R, r = ramc * D2R;
      const mc = norm(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e)) * R2D);
      let asc = norm(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(f) * Math.sin(e))) * R2D);
      if (norm(asc - mc) > 180) asc = norm(asc + 180);
      // Whole Sign houses (Mom's system, the default): the Rising sign is the whole 1st house, the next sign the 2nd, and so on.
      // Placidus is still here if anyone ever asks for it (inp.houses === 'placidus').
      const p = inp.houses === 'placidus' && Math.abs(inp.lat) < 66 ? placidus(ramc, eps, inp.lat) : null;
      const cusps = p ? [asc, p.c2, p.c3, norm(mc + 180), norm(p.c11 + 180), norm(p.c12 + 180), norm(asc + 180), norm(p.c2 + 180), norm(p.c3 + 180), mc, p.c11, p.c12]
                      : Array.from({ length: 12 }, (_, i) => norm(Math.floor(asc / 30) * 30 + 30 * i));
      const houseOf = lon => { for (let i = 0; i < 12; i++) { const a = cusps[i], b = cusps[(i + 1) % 12]; if (norm(lon - a) < norm(b - a)) return i + 1; } return 1; };
      planets.forEach(pl => { pl.house = houseOf(pl.lon); });
      const sun = planets[0].lon, moon = planets[1].lon, day = norm(sun - asc) >= 180;   // Sun above the horizon
      Object.assign(out, { asc, mc, cusps, houseSystem: p ? 'Placidus' : 'Whole Sign', fortune: norm(day ? asc + moon - sun : asc + sun - moon), dayChart: day,
        nodeHouse: houseOf(node), sNodeHouse: houseOf(norm(node + 180)) });
      out.fortuneHouse = houseOf(out.fortune);
    }
    return out;
  }

  const sign = lon => SIGNS[Math.floor(norm(lon) / 30)];
  const signN = lon => String(Math.floor(norm(lon) / 30) + 1).padStart(3, '0');      // card number of the sign
  const deg = lon => { const x = norm(lon) % 30; return `${Math.floor(x)}°${String(Math.floor((x % 1) * 60)).padStart(2, '0')}′`; };
  const houseN = h => String(22 + h).padStart(3, '0');                                // card number of the house

  root.SSChart = { compute, sign, signN, deg, houseN, SIGNS, zonedToUtc };
})(typeof window !== 'undefined' ? window : globalThis);
