// Overlap audit for the Friends & Groups pages (signed in as a test account). Usage: node overlap-friends.js BASE EMAIL PASSWORD
const { chromium, devices } = require('playwright');
const [BASE, EMAIL, PASS] = [(process.argv[2] || 'http://localhost:8765').replace(/\/$/, ''), process.argv[3], process.argv[4]];
function audit() {
  const sel = 'a[href], button, input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.width < 4 || r.height < 4 || cs.visibility === 'hidden' || cs.display === 'none') return null;
    let o = 1; for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); o *= +s.opacity; if (s.display === 'none' || e.hidden) return null; }
    if (o < .15) return null;
    let L = r.left, T = r.top, Rr = r.right, B = r.bottom;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e);
      if (/(auto|scroll|hidden)/.test(s.overflow + s.overflowY + s.overflowX)) { const q = e.getBoundingClientRect(); L = Math.max(L, q.left); T = Math.max(T, q.top); Rr = Math.min(Rr, q.right); B = Math.min(B, q.bottom); } }
    L = Math.max(L, 0); T = Math.max(T, 0); Rr = Math.min(Rr, innerWidth); B = Math.min(B, innerHeight);
    if (Rr - L < 4 || B - T < 4) return null;
    return { left: L, top: T, right: Rr, bottom: B, width: Rr - L, height: B - T }; };
  const dlgs = [...document.querySelectorAll('[role=dialog], [aria-modal=true]')].filter(d => { const r = d.getBoundingClientRect(); return !d.hidden && getComputedStyle(d).display !== 'none' && r.width * r.height > innerWidth * innerHeight * .5; });
  const scope = dlgs.length ? dlgs[dlgs.length - 1] : document;
  const els = [...scope.querySelectorAll(sel)].map(el => ({ el, r: vis(el) })).filter(x => x.r);
  const name = el => (el.id ? '#' + el.id + ' ' : '') + ((el.innerText || el.getAttribute('aria-label') || el.placeholder || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 30));
  const out = [];
  for (const { el, r } of els) {
    const pts = [[.5, .5], [.2, .5], [.8, .5], [.5, .25], [.5, .75]].map(([fx, fy]) => [r.left + r.width * fx, r.top + r.height * fy]).filter(([x, y]) => x > 0 && y > 0 && x < innerWidth && y < innerHeight);
    for (const [x, y] of pts) { const top = document.elementFromPoint(x, y);
      if (top && top !== el && !el.contains(top) && !top.contains(el)) { out.push(`covered: "${name(el)}" is under "${name(top.closest(sel) || top)}"`); break; } }
  }
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    const a = els[i], b = els[j]; if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (w > 3 && h > 3) out.push(`overlap: "${name(a.el)}" and "${name(b.el)}" (${Math.round(w)}×${Math.round(h)}px)`);
  }
  return [...new Set(out)];
}
// audit the whole page by scrolling through it a screen at a time
async function auditAll(pg) { const H = await pg.evaluate(() => document.documentElement.scrollHeight), vh = await pg.evaluate(() => innerHeight), all = new Set();
  for (let y = 0; y < H; y += Math.floor(vh * .8)) { await pg.evaluate(y => scrollTo(0, y), y); await pg.waitForTimeout(150); (await pg.evaluate(audit)).forEach(x => all.add(x)); }
  return [...all]; }
const CHART = JSON.stringify({ input: { date: '1982-12-22', time: '05:00', lat: 39.1, lng: -94.58, tz: 'America/Chicago' }, place: 'Kansas City' });
(async () => {
  const br = await chromium.launch(); let bad = 0;
  for (const dev of ['iPhone SE', 'iPhone 13', 'iPhone 14 Pro Max']) {
    const ctx = await br.newContext({ ...devices[dev] }); await ctx.addInitScript(c => localStorage.setItem('ss-chart', c), CHART);
    const pg = await ctx.newPage(); await pg.goto(BASE + '/friends/'); await pg.waitForTimeout(1200);
    await pg.evaluate(async ([e, p]) => { await window.SSAcct.ready; if (!window.SSAcct.user) await window.SSAcct.signIn(e, p); }, [EMAIL, PASS]);
    const s = await pg.evaluate(async () => window.SSSocial.api.social());
    const scenes = [['/friends/', 'home'], ['/friends/?pair=' + s.friends[0].id, 'pair'], ...(s.groups[0] ? [['/friends/?group=' + s.groups[0].id, 'group']] : []), ['/friends/', 'new group sheet', async p => { await p.click('#newG'); await p.waitForTimeout(400); }], ['/friends/', 'menu', async p => { await p.click('#ssnBtn'); await p.waitForTimeout(400); }]];
    for (const [path, label, prep] of scenes) {
      await pg.goto(BASE + path); await pg.waitForTimeout(3500); if (prep) await prep(pg);
      const r = prep ? await pg.evaluate(audit) : await auditAll(pg);
      if (r.length) { bad += r.length; console.log(`✗ ${dev} · ${label}\n   ` + r.join('\n   ')); } else console.log(`✓ ${dev} · ${label}`);
    }
    await ctx.close();
  }
  await br.close(); console.log(bad ? `\n${bad} problem(s)` : '\nNo overlaps.'); process.exit(bad ? 1 : 0);
})();
