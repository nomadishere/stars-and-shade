// Stars & Shade · "Share my chart": an Instagram-story picture (1080×1920) of your wheel + Big Three, in the deck's style.
// Needs js/chart.js (SSChart), js/cards.js (CARDS), js/wheel.js (SSWheel). Birth date/time/place are NOT printed (privacy).
(() => {
  const src = document.currentScript && document.currentScript.src;
  const BASE = src ? new URL('..', src).href : new URL('../', location.href).href;
  const SITE = BASE.replace(/^https?:\/\//, '').replace(/\/$/, '');
  let fontData = null;
  async function astroFont() {
    if (fontData) return fontData;
    const b = await fetch(BASE + 'fonts/dejavu-astro.woff2').then(r => r.arrayBuffer());
    let bin = ''; const u = new Uint8Array(b); for (let i = 0; i < u.length; i += 8192) bin += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
    return (fontData = 'data:font/woff2;base64,' + btoa(bin));
  }
  const img = url => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
  function wrap(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', lines = [];
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line); lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh)); return lines.length;
  }

  async function make(saved) {
    const S = window.SSChart, byN = Object.fromEntries(window.CARDS.map(c => [c.n, c]));
    const ch = S.compute(saved.input);
    const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    try { await document.fonts.ready; } catch (e) {}
    const g = x.createRadialGradient(W / 2, 520, 50, W / 2, 900, 1300); g.addColorStop(0, '#4a1a63'); g.addColorStop(.45, '#1d0c31'); g.addColorStop(1, '#07050d');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { x.globalAlpha = Math.random() * .7 + .1; x.fillStyle = '#fff'; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, Math.random() * 1.8 + .3, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    try { const logo = await img(BASE + 'img/logo.png'); const lw = 420, lh = lw * logo.height / logo.width; x.drawImage(logo, (W - lw) / 2, 70, lw, lh); } catch (e) {}
    // wheel (SVG -> image, with the glyph font embedded so symbols render)
    let svg = window.SSWheel.svg(ch, {});
    const font = await astroFont().catch(() => null);
    if (font) svg = svg.replace('<defs>', `<defs><style>@font-face{font-family:'Astro';src:url(${font}) format('woff2');}text{font-family:'Figtree','Helvetica Neue',Arial,sans-serif}</style>`);
    const wImg = await img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    const ws = 940; x.drawImage(wImg, (W - ws) / 2, 300, ws, ws);
    // Big Three
    const big = [['SUN', ch.planets[0].lon, 'who I am'], ['MOON', ch.planets[1].lon, 'what I need'], ['RISING', ch.asc, 'how I walk in']];
    const top = 1290, cw = 316, gap = 20, left = (W - (cw * 3 + gap * 2)) / 2;
    big.forEach(([lab, lon, what], i) => {
      const card = byN[S.signN(lon)], bx = left + i * (cw + gap);
      x.fillStyle = 'rgba(30,14,50,.82)'; x.strokeStyle = 'rgba(242,196,102,.55)'; x.lineWidth = 2;
      x.beginPath(); x.roundRect(bx, top, cw, 330, 28); x.fill(); x.stroke();
      x.textAlign = 'center'; x.fillStyle = '#ff8fc8'; x.font = '800 26px Figtree, Helvetica, Arial, sans-serif'; x.fillText(lab, bx + cw / 2, top + 52);
      x.fillStyle = '#ffe3a3'; x.font = '800 46px Comfortaa, Figtree, Helvetica, Arial, sans-serif'; x.fillText(card.title, bx + cw / 2, top + 112);
      x.fillStyle = '#b9add0'; x.font = '600 22px Figtree, Helvetica, Arial, sans-serif'; x.fillText(what, bx + cw / 2, top + 148);
      x.fillStyle = '#f3ecf9'; x.font = 'italic 600 26px Figtree, Helvetica, Arial, sans-serif'; wrap(x, '“' + card.z + '”', bx + cw / 2, top + 200, cw - 36, 34);
      x.fillStyle = '#f2c466'; x.font = '800 22px Figtree, Helvetica, Arial, sans-serif'; x.fillText(card.m, bx + cw / 2, top + 304);
    });
    x.textAlign = 'center'; x.fillStyle = '#ffe3a3'; x.font = '800 44px Comfortaa, Figtree, Helvetica, Arial, sans-serif';
    x.fillText('Get your free chart', W / 2, 1735);
    x.fillStyle = '#7ff5e8'; x.font = '700 32px Figtree, Helvetica, Arial, sans-serif'; x.fillText(SITE, W / 2, 1790);
    return new Promise(ok => c.toBlob(ok, 'image/png'));
  }

  // make the picture ahead of time, so tapping Share opens the share sheet instantly (iPhones require that)
  let cache = { key: null, p: null };
  function prepare(saved) { saved = saved || (window.SSMaker && window.SSMaker.get()); if (!saved) return null;
    const key = JSON.stringify(saved.input); if (cache.key !== key) cache = { key, p: make(saved) }; return cache.p; }
  // share sheet on phones (Instagram, Messages…); download everywhere else
  async function share(saved, btn) {
    saved = saved || (window.SSMaker && window.SSMaker.get()); if (!saved) return false;
    const label = btn && btn.textContent; if (btn) { btn.disabled = true; btn.textContent = 'Making your image…'; }
    try {
      const blob = await prepare(saved), file = new File([blob], 'my-stars-and-shade-chart.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'My Stars & Shade chart', text: 'My chart, with a little shade ✦ Get yours free: ' + BASE }); }
        catch (e) { if (e && e.name !== 'AbortError') throw e; }
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      }
      return true;
    } catch (e) { console.error('share', e); alert('Couldn’t make the image just now. Try again in a sec.'); return false; }
    finally { if (btn) { btn.disabled = false; btn.textContent = label; } }
  }
  window.SSShare = { make, prepare, share };
})();
