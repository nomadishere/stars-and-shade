// Stars & Shade · The Nebula
// A WebGL chart-wheel floating in a pink nebula: signs ring the outside, houses are the slices, planets orbit the Sun,
// points ride an outer orbit and the four elements glow in the far clouds. Everything you can tap opens Mom's card.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const C = window.CARDS, L = window.LEARN, D = window.DECODE, B = window.BUILD, TOUR = window.TOUR, G = window.GLYPH;
const EL = window.SIGN_EL, MODE = window.SIGN_MODE;
const byN = Object.fromEntries(C.map(c => [c.n, c]));
const $ = id => document.getElementById(id);
const V3 = THREE.Vector3;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const nice = m => m.charAt(0) + m.slice(1).toLowerCase();                     // "I ATTRACT" -> "I attract"
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const SECS = [['Zodiac', 'Zodiac Signs'], ['Planet', 'Planets'], ['House', 'Houses'], ['Misc', 'Points, Nodes & Elements']];
const isEl = n => +n >= 41;
function kicker(c) {
  if (c.sec === 'Zodiac') return `Zodiac sign · ${EL[c.n]} · ${MODE[c.n]}`;
  if (c.sec === 'Planet') return c.n === '022' ? 'Dwarf planet' : (c.n === '013' || c.n === '014') ? 'Luminary' : 'Planet';
  if (c.sec === 'House') return 'House';
  if (isEl(c.n)) return 'Element';
  return c.n === '036' ? 'Sky event' : 'Point';
}
const houseOrd = n => B.ord[+n - 23];

// ---------------------------------------------------------------- progress (per viewer, this browser)
const KEY = 'ss-nebula-learned';
let learned = new Set();
try { learned = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) {}
const saveLearned = () => { try { localStorage.setItem(KEY, JSON.stringify([...learned])); } catch (e) {} };

// ---------------------------------------------------------------- renderer
const canvas = $('gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); }
catch (e) {
  $('gate').querySelector('p').innerHTML = 'This browser can’t show the 3D nebula. <a href="../#learn">Open the deck and lessons instead</a>.';
  $('enter').remove(); throw e;
}
const small = Math.min(innerWidth, innerHeight) < 700;
const DPR = Math.min(devicePixelRatio || 1, small ? 1.6 : 2);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07050d);
scene.fog = new THREE.FogExp2(0x0a0612, 0.0016);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 3000);
camera.position.set(0, 30, 460);
const controls = new OrbitControls(camera, canvas);
Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, rotateSpeed: 0.55, zoomSpeed: 0.9, panSpeed: 0.7,
  minDistance: 4, maxDistance: 260, screenSpacePanning: true, enabled: false });
controls.target.set(0, 0, 0);
// one finger spins the chart in space; two fingers slide to move it and pinch to zoom
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
const world = new THREE.Group(); scene.add(world);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.42, 0.4, 0.32);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- textures (all drawn here, nothing to download)
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function cloudTex(seed, size = 256) {
  const r = rng(seed), oct = [[4, .5], [8, .26], [16, .15], [32, .09]];
  const grids = oct.map(([n]) => { const g = new Float32Array((n + 1) * (n + 1)); for (let i = 0; i < g.length; i++) g[i] = r(); return g; });
  const c = document.createElement('canvas'); c.width = c.height = size; const ctx = c.getContext('2d'); const img = ctx.createImageData(size, size);
  const sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size; let val = 0;
    oct.forEach(([n, a], k) => { const g = grids[k], fx = u * n, fy = v * n, ix = fx | 0, iy = fy | 0, tx = sm(fx - ix), ty = sm(fy - iy), w = n + 1;
      const a0 = g[iy * w + ix], a1 = g[iy * w + ix + 1], b0 = g[(iy + 1) * w + ix], b1 = g[(iy + 1) * w + ix + 1];
      val += a * ((a0 + (a1 - a0) * tx) + ((b0 + (b1 - b0) * tx) - (a0 + (a1 - a0) * tx)) * ty); });
    const dx = u - .5, dy = v - .5, d = Math.sqrt(dx * dx + dy * dy) * 2;
    const fall = Math.pow(Math.max(0, 1 - d), 1.7);
    const a = Math.min(1, Math.max(0, (val - .3) * 2.1)) * fall;
    const i = (y * size + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = a * 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function dotTex(size = 128, soft = 2) {
  const c = document.createElement('canvas'); c.width = c.height = size; const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2 / soft, 'rgba(255,255,255,.75)'); g.addColorStop(.5, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glyphTex(txt, { disk = true, col = '#ffd98a', ring = '#f2c466', fill = 'rgba(22,10,38,.82)' } = {}) {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const ctx = c.getContext('2d');
  if (disk) {
    ctx.shadowColor = 'rgba(242,196,102,.6)'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 92, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = ring; ctx.stroke(); ctx.shadowBlur = 0;
  }
  let fs = txt.length > 1 ? 92 : 118; ctx.font = `700 ${fs}px Astro`;
  const w = ctx.measureText(txt).width; if (w > 140) { fs *= 140 / w; ctx.font = `700 ${fs}px Astro`; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col;
  ctx.shadowColor = 'rgba(255,200,110,.6)'; ctx.shadowBlur = disk ? 3 : 8;
  ctx.fillText(txt, S / 2, S / 2 + fs * .04);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function labelTex(txt, col = '#f6eefb') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96; const ctx = c.getContext('2d');
  ctx.font = '600 46px Figtree, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.95)'; ctx.shadowBlur = 12; ctx.fillStyle = col; ctx.fillText(txt, 256, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// crisp, always-readable labels: real text laid over the 3D scene (fixed size on screen, never blurry)
const lblLayer = document.createElement('div'); lblLayer.id = 'lbls'; document.body.appendChild(lblLayer);
const _lv = new V3();
// never let labels pile on top of each other: the most important ones win, the rest fade out until you zoom in
const PRI = { Planet: 3, Misc: 2, Zodiac: 2, House: 1 };
// labels: 'soft' (default) = every name, faint from far away and brighter as you zoom in (what you focus on is brighter) · 'bright' · 'off'
let labelMode = 'soft'; try { labelMode = localStorage.getItem('ss-labels2') || 'soft'; } catch (e) {}
if (!['soft', 'bright', 'off'].includes(labelMode)) labelMode = 'soft';
let pinned = null;
const pinEl = document.createElement('div'); pinEl.id = 'pin'; pinEl.hidden = true; document.body.appendChild(pinEl);
function pin(n) {
  pinned = n; if (!n) { pinEl.hidden = true; return; }
  const c = byN[n], o = objs[n];
  pinEl.innerHTML = `<b>${o.el.textContent}</b><span>“${c.z}”</span><em>${c.m}</em><button type="button">▶ Play card</button>`;
  pinEl.querySelector('button').onclick = () => { const k = pinned; pin(null); openLesson(k); };
  pinEl.hidden = false;
}
function declutter() {
  if (pinned && objs[pinned]) { const o = objs[pinned]; if (o.show) { pinEl.style.transform = `translate(${o.sx.toFixed(1)}px,${(o.sy + 14).toFixed(1)}px) translate(-50%,0)`; pinEl.style.opacity = 1; } else pinEl.style.opacity = 0; }
  const D = camera.position.distanceTo(controls.target), W = 84 * fitF(), zf = Math.max(0, Math.min(1, (W - D) / (W * .6)));
  const list = Object.values(objs).filter(o => o.show && o.n !== pinned && labelMode !== 'off').sort((a, b) => (b.hot - a.hot) || (b.lvl - a.lvl) || ((PRI[b.kind] || 0) - (PRI[a.kind] || 0)));
  const placed = [];
  for (const o of list) {
    const w = o.el.textContent.length * (o.hot ? 8.4 : 7.4) + 16, h = o.hot ? 24 : 21;
    const r = { x0: o.sx - w / 2, x1: o.sx + w / 2, y0: o.sy - h / 2, y1: o.sy + h / 2 };
    const hit = placed.some(q => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0);
    const op = labelMode === 'bright' ? o.op : Math.min(1, o.op * (.34 + .66 * zf) + (o.hot ? .08 + .25 * zf : 0));
    const want = hit ? '0' : op.toFixed(2); if (o.el.style.opacity !== want) o.el.style.opacity = want;
    if (!hit) placed.push(r);
  }
  for (const n in objs) { const o = objs[n]; if ((!o.show || o.n === pinned || labelMode === 'off') && o.el.style.opacity !== '0') o.el.style.opacity = '0'; }
}
function setLabelMode(m) { labelMode = m; try { localStorage.setItem('ss-labels2', m); } catch (e) {} const b = $('lblBtn'); if (b) b.textContent = 'Labels: ' + { soft: 'Soft', bright: 'Bright', off: 'Off' }[m]; }
// ---------------------------------------------------------------- the nebula
const DOT = dotTex();
const PAL = [0xff4fa3, 0xff6fd0, 0xd53cff, 0x8a4dff, 0xff4fa3, 0x3d6bff, 0x2fd6c8, 0xff8a3d, 0xc23bd6];
const clouds = [];
function buildNebula() {
  const texs = [cloudTex(11), cloudTex(29), cloudTex(47)];
  const r = rng(7);
  const add = (pos, scale, color, op) => {
    const m = new THREE.SpriteMaterial({ map: texs[clouds.length % 3], color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, rotation: r() * 6.28 });
    const s = new THREE.Sprite(m); s.position.copy(pos); s.scale.setScalar(scale); s.userData.spin = (r() - .5) * .02; world.add(s); clouds.push(s);
  };
  // backdrop behind the wheel: a deep pink heart with violet and blue edges
  for (let i = 0; i < 46; i++) {
    const a = r() * 6.28, rad = 10 + r() * 120;
    add(new V3(Math.cos(a) * rad, Math.sin(a) * rad * .8, -40 - r() * 90), 50 + r() * 90, PAL[(r() * PAL.length) | 0], .10 + r() * .16);
  }
  // the corridor the camera flies through on the way in
  for (let i = 0; i < 44; i++) {
    const z = 40 + r() * 420, a = r() * 6.28, rad = 18 + r() * 70;
    add(new V3(Math.cos(a) * rad, Math.sin(a) * rad, z), 40 + r() * 70, PAL[(r() * PAL.length) | 0], .07 + r() * .12);
  }
  // a soft glow right behind the Sun
  add(new V3(0, 0, -6), 70, 0xff4fa3, .22);
  add(new V3(0, 0, -8), 34, 0xffb35c, .16);
}
let starMat;
function buildStars() {
  const N = small ? 4200 : 6500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), ph = new Float32Array(N);
  const r = rng(99), tints = [[1, 1, 1], [1, .8, .93], [.8, .86, 1], [1, .9, .75], [.85, 1, .98]];
  for (let i = 0; i < N; i++) {
    const near = i < N * .3, rad = near ? 40 + r() * 260 : 300 + r() * 900;
    const u = r() * 2 - 1, a = r() * 6.28, s = Math.sqrt(1 - u * u);
    pos.set([Math.cos(a) * s * rad, u * rad, Math.sin(a) * s * rad + (near ? 120 : 0)], i * 3);
    col.set(tints[(r() * tints.length) | 0], i * 3); size[i] = (near ? .9 : 1.6) * (.4 + Math.pow(r(), 3) * 2.4); ph[i] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  starMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: DPR } },
    vertexShader: `attribute float size; attribute float phase; attribute vec3 color; uniform float uTime; uniform float uPR; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
        vA = .55 + .45*sin(uTime*(1.2+phase*1.6) + phase*6.283); gl_PointSize = clamp(size*uPR*(260./-mv.z), 1., 40.); vC = color; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 p = gl_PointCoord-.5; float d = length(p); float a = smoothstep(.5,.0,d); a = a*a; gl_FragColor = vec4(vC, a*vA); }` });
  world.add(new THREE.Points(g, starMat));
}

// ---------------------------------------------------------------- the wheel
const R = { hIn: 18, hOut: 25, sIn: 27, sOut: 33, sign: 30, pts: 39 };
const angOf = i => Math.PI + (i + .5) * Math.PI / 6;           // Aries / 1st house just below the left horizon, counterclockwise
const atAng = (a, r, z = 0) => new V3(Math.cos(a) * r, Math.sin(a) * r, z);
const lineMat = (color, opacity) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
function circle(r, color, op, seg = 160) {
  const p = []; for (let i = 0; i < seg; i++) { const a = i / seg * Math.PI * 2; p.push(new V3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
  const l = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(p), lineMat(color, op)); world.add(l); return l;
}
function seg(a, b, color, op) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat(color, op)); world.add(l); return l; }
const wheelLines = [];
function buildWheel() {
  wheelLines.push(circle(R.hIn, 0xff6fd0, .32), circle(R.hOut, 0xff6fd0, .38), circle(R.sIn, 0x3fe0d0, .42), circle(R.sOut, 0x3fe0d0, .42), circle(R.pts, 0x9b6bff, .2));
  for (let i = 0; i < 12; i++) { const a = Math.PI + i * Math.PI / 6; wheelLines.push(seg(atAng(a, R.hIn), atAng(a, R.sOut), 0x3fe0d0, .22)); }
  wheelLines.push(seg(atAng(Math.PI, 44), atAng(0, 44), 0xf2c466, .28), seg(atAng(Math.PI / 2, 44), atAng(-Math.PI / 2, 44), 0xf2c466, .2));
}

// ---------------------------------------------------------------- tappable things
const objs = {}, hits = [];
const lvlTo = (o, v) => { o.lvlT = v; };
function makeNode(n, pos, { size = 3.2, disk = true, col, label = byN[n].title, labelOff = 2.6, hitR = 2.6, parent = world } = {}) {
  const g = new THREE.Group(); g.position.copy(pos); parent.add(g);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTex(G[n], { disk, col }), transparent: true, depthWrite: false }));
  sp.scale.setScalar(size); g.add(sp);
  const lb = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex(label), transparent: true, depthWrite: false, opacity: .9 }));
  lb.scale.set(size * 1.25, size * 1.25 * 96 / 512, 1); lb.position.y = -labelOff; g.add(lb); lb.visible = false;
  const el = document.createElement('div'); el.className = 'lbl ' + (byN[n].sec || '').toLowerCase(); el.textContent = label; lblLayer.appendChild(el);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: 0xf2c466, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  halo.scale.setScalar(size * 2.6); halo.position.z = -.05; g.add(halo);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(hitR, 10, 8), new THREE.MeshBasicMaterial()); hit.visible = false; hit.userData.n = n; g.add(hit); hits.push(hit);
  const o = { n, g, sp, lb, halo, size, lvl: 1, lvlT: 1, kind: byN[n].sec, focusDist: 11,
    pos: (v = new V3()) => g.getWorldPosition(v),
    el, base: label, setLabel(txt) { el.textContent = txt || label; },
    apply(t) { const l = this.lvl; sp.material.opacity = Math.min(1, .18 + l * .82); lb.material.opacity = Math.min(.95, l * .85);
      { const op = Math.min(1, l * 1.1); lb.getWorldPosition(_lv).project(camera); this.show = true;
        if (!(op < .05 || _lv.z > 1 || Math.abs(_lv.x) > 1.1 || Math.abs(_lv.y) > 1.1)) { this.sx = (_lv.x + 1) / 2 * innerWidth; this.sy = (1 - _lv.y) / 2 * innerHeight; this.op = op; this.hot = l > 1.2;
          el.style.transform = `translate(${this.sx.toFixed(1)}px,${this.sy.toFixed(1)}px) translate(-50%,-50%)`; el.classList.toggle('hot', this.hot); } else this.show = false; }
      sp.scale.setScalar(size * (.86 + .14 * Math.min(l, 1.8)));
      halo.material.opacity = (learned.has(n) ? .18 + .07 * Math.sin(t * 2 + +n) : 0) * Math.min(1, l) + (l > 1.2 ? .12 : 0); } };
  objs[n] = o; return o;
}
const PLANETS = {
  "013": { r: 0, s: 2.0, c1: 0xffa53a, c2: 0xfff1a8, b: 3 }, "014": { r: 4.4, s: .62, c1: 0xb9b4d6, c2: 0xffffff, b: 2 },
  "015": { r: 5.9, s: .5, c1: 0x8c7fa3, c2: 0xe2d4f2, b: 3 }, "016": { r: 7.3, s: .78, c1: 0xff8fc0, c2: 0xffe0ee, b: 2 },
  "017": { r: 8.7, s: .66, c1: 0xff4a2e, c2: 0xffb08a, b: 3 }, "018": { r: 10.5, s: 1.3, c1: 0xd99a5c, c2: 0xfff0d6, b: 11 },
  "019": { r: 12.3, s: 1.08, c1: 0xe8c27a, c2: 0xfff3c4, b: 8 }, "020": { r: 13.8, s: .84, c1: 0x3fd8d4, c2: 0xd0fffb, b: 3 },
  "021": { r: 15.0, s: .82, c1: 0x3f62ff, c2: 0xb3c8ff, b: 4 }, "022": { r: 16.2, s: .4, c1: 0x9f76b8, c2: 0xe9d2ff, b: 2 }
};
const sunU = { value: new V3() };
const planetMats = [];
let orbitK = 1;
function buildPlanets() {
  const r = rng(3);
  for (const n of Object.keys(PLANETS)) {
    const P = PLANETS[n], pivot = new THREE.Group(); world.add(pivot);
    P.pivot = pivot; P.a = r() * 6.28; P.w = n === '013' ? 0 : .22 / Math.pow(P.r / 4, 1.5);
    const holder = new THREE.Group(); holder.position.x = P.r; pivot.add(holder); P.holder = holder;
    const mat = new THREE.ShaderMaterial({ uniforms: { c1: { value: new THREE.Color(P.c1) }, c2: { value: new THREE.Color(P.c2) }, uB: { value: P.b }, uGlow: { value: 1 }, uSun: sunU, uIsSun: { value: n === '013' ? 1 : 0 }, uTime: { value: 0 } },
      vertexShader: `varying vec3 vN; varying vec3 vMV; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vMV = mv.xyz; vP = normalize(position); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 c1; uniform vec3 c2; uniform float uB; uniform float uGlow; uniform vec3 uSun; uniform float uIsSun; uniform float uTime; varying vec3 vN; varying vec3 vMV; varying vec3 vP;
        void main(){ float band = .5+.5*sin(vP.y*uB*1.7 + sin(vP.x*4.+uTime*.15)*.8 + uTime*.05);
          vec3 col = mix(c1, c2, band*.75);
          vec3 V = normalize(-vMV); float fres = pow(1.-max(dot(vN,V),0.), 2.4);
          float lit = uIsSun > .5 ? 1.25 : .16 + .95*max(dot(vN, normalize(uSun - vMV)), 0.);
          col = col*lit + mix(c1,c2,.5)*fres*(uIsSun>.5 ? 1.6 : .9);
          gl_FragColor = vec4(col*uGlow, 1.); }` });
    planetMats.push(mat);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(P.s, 48, 32), mat); holder.add(mesh);
    if (n === '019') { const ring = new THREE.Mesh(new THREE.RingGeometry(P.s * 1.35, P.s * 2.15, 64), new THREE.MeshBasicMaterial({ color: 0xf0d9a0, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      ring.rotation.set(1.2, .3, 0); holder.add(ring); }
    if (n === '013') { const cor = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: 0xffb35c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 }));
      cor.scale.setScalar(9); holder.add(cor); P.corona = cor; }
    if (P.r) { const orb = circle(P.r, 0x9b6bff, .14, 128); orb.userData.planet = n; }
    const o = makeNode(n, new V3(0, P.s + .95, 0), { size: n === '013' ? 1.9 : 1.45, disk: false, labelOff: 1.15, hitR: Math.max(1.3, P.s * 1.5), parent: holder });
    o.hitAt = holder; o.mesh = mesh; o.mat = mat; o.focusDist = Math.max(6, P.s * 6 + 3);
    o.hit = o.g.children.find(c => c.isMesh); o.hit.position.y = -(P.s + .95);   // centre the hit on the planet itself
    const base = o.apply; o.apply = function (t) { base.call(this, t); mat.uniforms.uGlow.value = .45 + .55 * Math.min(this.lvl, 1.6); };
    o.pos = (v = new V3()) => holder.getWorldPosition(v);
  }
}
const ELEM = { "043": { p: new V3(-52, 34, -8), c: 0xff8a3d, name: 'Fire' }, "042": { p: new V3(52, 34, -8), c: 0x4fe3e0, name: 'Air' },
  "041": { p: new V3(-52, -34, -8), c: 0x5b6bff, name: 'Water' }, "044": { p: new V3(52, -34, -8), c: 0x6fe38a, name: 'Earth' } };
const wedges = {};
function buildNodes() {
  C.filter(c => c.sec === 'Zodiac').forEach((c, i) => { const o = makeNode(c.n, atAng(angOf(i), R.sign), { size: 3.6, labelOff: 2.7 }); o.focusDist = 12; });
  C.filter(c => c.sec === 'House').forEach((c, i) => {
    const a0 = Math.PI + i * Math.PI / 6;
    const w = new THREE.Mesh(new THREE.RingGeometry(R.hIn, R.hOut, 10, 1, a0, Math.PI / 6),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff4fa3 : 0xd53cff, transparent: true, opacity: .06, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    world.add(w); w.userData.n = c.n; hits.push(w);
    const o = makeNode(c.n, atAng(angOf(i), (R.hIn + R.hOut) / 2, .05), { size: 2.5, disk: false, col: '#ffd0ea', label: `House ${+c.n - 22}`, labelOff: 1.6, hitR: .1 });
    o.wedge = w; o.focusDist = 13;
    const base = o.apply; o.apply = function (t) { base.call(this, t); w.material.opacity = .018 + .05 * Math.min(this.lvl, 1) + (this.lvl > 1.2 ? .2 : 0) + (learned.has(c.n) ? .04 : 0); };
    wedges[c.n] = w;
  });
  const PA = { "035": Math.PI, "039": Math.PI / 2, "037": Math.PI * .2, "038": Math.PI * 1.2, "040": Math.PI * 1.68, "036": Math.PI * .74 };
  for (const n of Object.keys(PA)) { const o = makeNode(n, atAng(PA[n], R.pts), { size: 3.0, labelOff: 2.4 }); o.focusDist = 11; }
  // the retrograde loop: a planet's path doubling back on itself
  { const c = atAng(PA['036'], R.pts), p = [];
    for (let i = 0; i <= 120; i++) { const t = i / 120 * Math.PI * 2; p.push(new V3(c.x + (t - Math.PI) * 1.1 - 2.4 * Math.sin(t), c.y + 3.4 + 1.5 * Math.cos(t), 0)); }   // forward, loop back, forward
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lineMat(0xf2c466, .35))); }
  for (const n of Object.keys(ELEM)) {
    const E = ELEM[n];
    const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: E.c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .5 }));
    cl.scale.setScalar(22); cl.position.copy(E.p); cl.position.z -= .5; world.add(cl);
    const o = makeNode(n, E.p, { size: 4.2, col: '#' + new THREE.Color(E.c).lerp(new THREE.Color(0xffffff), .35).getHexString(), labelOff: 3.2, hitR: 5 });
    o.cloud = cl; o.focusDist = 20;
    const base = o.apply; o.apply = function (t) { base.call(this, t); cl.material.opacity = .22 + .3 * Math.min(this.lvl, 1.6) + .06 * Math.sin(t * .8 + +n); };
  }
}

// ---------------------------------------------------------------- lines that teach: trines, crosses, the formula link, constellations
const fxLines = {};
function liveLine(ns, color, loop = false, op = .9) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ns.length + (loop ? 1 : 0)) * 3), 3));
  const l = new THREE.Line(geo, lineMat(color, 0)); l.userData = { ns, loop, op, t: 0 }; world.add(l); return l;
}
function buildFx() {
  for (const n of Object.keys(ELEM)) { const name = ELEM[n].name; fxLines['trine:' + name] = liveLine(Object.keys(EL).filter(k => EL[k] === name), ELEM[n].c, true); }
  const MC = { Cardinal: 0xff5fb0, Fixed: 0x9b6bff, Mutable: 0x3fe0d0 };
  for (const m of Object.keys(MC)) fxLines['cross:' + m] = liveLine(Object.keys(MODE).filter(k => MODE[k] === m), MC[m], true);
  fxLines.link = liveLine(['016', '008', '029'], 0xf2c466, false);
  for (const [sec] of SECS) fxLines['con:' + sec] = liveLine(C.filter(c => c.sec === sec).map(c => c.n), 0xf2c466, sec === 'Zodiac', .55);
}
let fxOn = new Set();
function setFx(keys) { fxOn = new Set(keys); }
const tmp = new V3();
function updateLines(dt) {
  for (const k in fxLines) {
    const l = fxLines[k], u = l.userData, on = fxOn.has(k) || (k.startsWith('con:') && sectionDone(k.slice(4)));
    u.t += ((on ? 1 : 0) - u.t) * Math.min(1, dt * 3); l.material.opacity = u.t * u.op; l.visible = u.t > .01;
    if (!l.visible) continue;
    const arr = l.geometry.attributes.position.array;
    u.ns.forEach((n, i) => { objs[n].pos(tmp); world.worldToLocal(tmp); arr.set([tmp.x, tmp.y, tmp.z + .1], i * 3); });
    if (u.loop) arr.set(arr.slice(0, 3), u.ns.length * 3);
    l.geometry.attributes.position.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- the person's own chart in the sky
// Zodiac longitude λ sits on the wheel at angle π + λ (Aries 0° at the left horizon, counterclockwise), same as the sign ring.
let natal = null; const natalLines = [];
const lonAng = lon => Math.PI + lon * Math.PI / 180;
const PA0 = {};
function setNatal(ch) {
  clearNatal(true);
  natal = { ang: {} };
  const SG = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'], sg = l => SG[Math.floor((((l % 360) + 360) % 360) / 30)];
  for (const pl of ch.planets) objs[pl.n].setLabel(`${byN[pl.n].title} · ${sg(pl.lon)}${pl.house ? ' · H' + pl.house : ''}`);
  if (ch.known) for (let i = 0; i < 12; i++) objs[String(23 + i).padStart(3, '0')].setLabel(`House ${i + 1} · ${sg(ch.cusps[i] + 1)}`);
  if (ch.known) { objs['035'].setLabel(`Rising · ${sg(ch.asc)}`); objs['039'].setLabel(`Midheaven · ${sg(ch.mc)}`); }
  for (const pl of ch.planets) { const P = PLANETS[pl.n]; let a = lonAng(pl.lon); a += Math.round((P.a - a) / (2 * Math.PI)) * 2 * Math.PI; natal.ang[pl.n] = a; }
  PLANETS['013'].holder.position.x = 2.6;                                    // the Sun steps off the centre to show its sign
  const place = (n, lon) => { PA0[n] = PA0[n] || objs[n].g.position.clone(); objs[n].g.position.copy(atAng(lonAng(lon), R.pts)); };
  place('037', ch.northNode); place('038', ch.southNode);
  if (ch.known) {
    place('035', ch.asc); place('039', ch.mc); place('040', ch.fortune);
    wheelLines[wheelLines.length - 2].visible = wheelLines[wheelLines.length - 1].visible = false;
    natalLines.push(seg(atAng(lonAng(ch.asc), 44), atAng(lonAng(ch.asc + 180), 44), 0xf2c466, .55), seg(atAng(lonAng(ch.mc), 44), atAng(lonAng(ch.mc + 180), 44), 0xf2c466, .4));
    for (let i = 0; i < 12; i++) {
      const a = ch.cusps[i], b = ch.cusps[(i + 1) % 12], len = (((b - a) % 360) + 360) % 360, o = objs[String(23 + i).padStart(3, '0')];
      o.wedge.geometry.dispose(); o.wedge.geometry = new THREE.RingGeometry(R.hIn, R.hOut, 16, 1, lonAng(a), len * Math.PI / 180);
      PA0[o.n] = PA0[o.n] || o.g.position.clone(); o.g.position.copy(atAng(lonAng(a + len / 2), (R.hIn + R.hOut) / 2, .05));
      natalLines.push(seg(atAng(lonAng(a), R.hIn), atAng(lonAng(a), R.sOut), 0xf2c466, .45));
    }
    wheelLines.slice(5, 17).forEach(l => { l.visible = false; });             // hide the equal-house spokes
  }
}
function clearNatal(quiet) {
  if (!natal && quiet) return;
  natal = null; PLANETS['013'].holder.position.x = 0; for (const n in objs) objs[n].setLabel();
  for (const n in PA0) { objs[n].g.position.copy(PA0[n]); delete PA0[n]; }
  natalLines.splice(0).forEach(l => { world.remove(l); l.geometry.dispose(); });
  wheelLines.forEach(l => { l.visible = true; });
  for (let i = 0; i < 12; i++) { const o = objs[String(23 + i).padStart(3, '0')]; o.wedge.geometry.dispose(); o.wedge.geometry = new THREE.RingGeometry(R.hIn, R.hOut, 10, 1, Math.PI + i * Math.PI / 6, Math.PI / 6); }
}

// ---------------------------------------------------------------- highlight + camera
function highlight(keys) {
  const ks = new Set(keys || []);
  for (const n in objs) lvlTo(objs[n], !ks.size ? 1 : (ks.has(n) || ks.has(objs[n].kind)) ? 1.8 : .2);
}
let fly = null;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function flyTo(pos, tgt, dur = 1.6) {
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), s: performance.now(), d: dur * 1000 };
  controls.enabled = false;
}
// phones are tall and narrow: pull every view back so the wheel fits the width
const fitF = () => Math.max(1, .95 / camera.aspect), focusF = () => Math.max(1, .72 / camera.aspect);
const sheetUp = () => document.querySelector('.sheet.open') ? 1 : 0;
const PRESET = {
  wide: () => [new V3(0, -4, 84), new V3(0, 0, 0)], signs: () => [new V3(0, -40, 44), new V3(0, -2, 0)],
  planets: () => [new V3(0, -12, 27), new V3(0, -1, 0)], houses: () => [new V3(8, -26, 34), new V3(0, -3, 0)],
  points: () => [new V3(0, -6, 96), new V3(0, 0, 0)], elements: () => [new V3(0, 0, 128), new V3(0, 0, -6)]
};
function goPreset(name, dur) {
  if (name === 'formula') return frame(['016', '008', '029'], dur);
  if (name === 'big3') return frame(['013', '014', '035'], dur);
  let [p, t] = PRESET[name](); p = t.clone().add(p.clone().sub(t).multiplyScalar(fitF())); const down = sheetUp() ? p.distanceTo(t) * .2 : 0;
  flyTo(p.add(new V3(0, -down, 0)), t.add(new V3(0, -down, 0)), dur);
}
function focusObj(n) {
  const o = objs[n], p = o.pos(new V3()), d = o.focusDist * focusF();
  const dir = camera.position.clone().sub(controls.target).normalize().lerp(new V3(0, -.22, 1).normalize(), .65).normalize();
  const down = new V3(0, -d * .34, 0);
  flyTo(p.clone().add(dir.multiplyScalar(d)).add(down), p.clone().add(down));
}
function frame(ns, dur) {
  const ps = ns.map(n => objs[n].pos(new V3())), c = ps.reduce((a, b) => a.add(b), new V3()).multiplyScalar(1 / ps.length);
  const rad = Math.max(...ps.map(p => p.distanceTo(c)));
  const d = (rad * 2.3 + 10) * focusF(), down = new V3(0, -d * .26, 0);
  flyTo(c.clone().add(new V3(0, -.3, 1).normalize().multiplyScalar(d)).add(down), c.clone().add(down), dur);
}
function tag(k, t) { $('tagk').textContent = k || ''; $('tagt').textContent = t || ''; $('tag').style.opacity = t ? 1 : 0; }

// ---------------------------------------------------------------- tapping in 3D
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
addEventListener('pointerdown', () => { if (actx && actx.state !== 'running' && soundOn) actx.resume().catch(() => {}); }, true);
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; if (fly && !introRunning) { fly = null; controls.enabled = true; } });
canvas.addEventListener('pointerup', e => {
  if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t; down = null;
  if (moved > 9 || dt > 500 || !started) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(hits, false)[0]; if (!hit) { pin(null); return; }
  onPick(hit.object.userData.n);
});
function onPick(n) {
  if (tab === 'build' && ['Planet', 'Zodiac', 'House'].includes(byN[n].sec)) { const k = { Planet: 'p', Zodiac: 's', House: 'h' }[byN[n].sec]; sel[k] = n; renderBuild(true); return; }
  if (pinned === n) { pin(null); openLesson(n); return; }
  pin(n);
}

// ---------------------------------------------------------------- sound: the ambient bed under the nebula; cards bring their own music
let actx = null, bedGain = null, soundOn = true;
async function startBed() {
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)(); bedGain = actx.createGain(); bedGain.gain.value = 0; bedGain.connect(actx.destination);
    const buf = await fetch('../audio/bed.wav').then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => actx.decodeAudioData(b, ok, no)));
    const src = actx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(bedGain); src.start();
    bedLevel();
  } catch (e) {}
}
function bedLevel() { if (!bedGain) return; const busy = [...document.querySelectorAll('video')].some(v => !v.paused && !v.muted) || window.__oracleLive; const v = soundOn && !busy ? .3 : 0; bedGain.gain.setTargetAtTime(v, actx.currentTime, .4); }
$('snd').onclick = () => { soundOn = !soundOn; $('snd').setAttribute('aria-pressed', soundOn); $('snd').textContent = soundOn ? '♪ On' : '♪ Off'; lvid.muted = !soundOn; if (actx) actx.resume(); bedLevel(); };
document.addEventListener('visibilitychange', () => { if (!actx) return; document.hidden ? actx.suspend() : actx.resume(); });

// ---------------------------------------------------------------- gyro: the whole sky leans a little as the phone tilts
let tiltX = 0, tiltY = 0;
function startGyro() {
  const on = () => addEventListener('deviceorientation', e => { if (e.beta == null) return; tiltX = Math.max(-1, Math.min(1, (e.beta - 45) / 45)) * .07; tiltY = Math.max(-1, Math.min(1, e.gamma / 45)) * .09; });
  try { if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().then(s => s === 'granted' && on()).catch(() => {}); else on(); } catch (e) {}
}

// ---------------------------------------------------------------- sheets + tabs
let tab = 'explore', started = false, introRunning = false;
const sheets = { lesson: $('lessonSheet'), tour: $('tourSheet'), build: $('buildSheet'), play: $('playSheet'), sky: $('skySheet') };
function openSheet(k) { for (const s in sheets) sheets[s].classList.toggle('open', s === k); $('explore').style.opacity = k ? 0 : 1; $('explore').style.pointerEvents = k ? 'none' : ''; }
function setTab(t) {
  stopChant(); pin(null); tab = t; document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
  closeVideo(); setFx([]); tag();
  if (t === 'explore') { const wasSheet = !!document.querySelector('.sheet.open'); openSheet(null); highlight(); if (wasSheet && started && !introRunning) goPreset('wide', 1.1); }   // closing a panel re-centres the sky
  if (t === 'tour') { openSheet('tour'); showChapter(chap); }
  if (t === 'school') { location.href = '../school/'; return; }
  if (t === 'build') { openSheet('build'); renderBuild(true); }
  if (t === 'play') { openSheet('play'); highlight(); goPreset('wide'); }
  if (t === 'sky') { openSheet('sky'); renderSky(); highlight([...learned]); goPreset('wide'); }
}
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
if (new URLSearchParams(location.search).get('sky')) setTimeout(() => setTab('sky'), 1800);   // arriving from a chart card elsewhere on the site
document.querySelectorAll('.sheet [data-close]').forEach(b => b.onclick = () => {
  if (b.closest('#lessonSheet') && returnTo && returnTo !== 'explore') { const r = returnTo; returnTo = null; setTab(r); return; }
  setTab('explore');
});
setLabelMode(labelMode);
if ($('lblBtn')) $('lblBtn').onclick = () => { setLabelMode({ soft: 'bright', bright: 'off', off: 'soft' }[labelMode]); toast(labelMode === 'soft' ? 'Soft labels · they brighten as you zoom in' : labelMode === 'bright' ? 'All labels bright' : 'Labels off · tap anything to see its name', 2400); };
$('chips').addEventListener('click', e => {
  const b = e.target.closest('[data-go]'); if (!b) return; const go = b.dataset.go;
  document.querySelectorAll('#chips button').forEach(x => x.classList.toggle('on', x === b));
  const map = { signs: ['Zodiac', 'The 12 signs', 'How energy moves'], planets: ['Planet', 'The 10 planets', 'What the energy is'], houses: ['House', 'The 12 houses', 'Where it plays out'],
    points: ['Misc', 'Points & nodes', 'The extras'], elements: ['Misc', 'The four elements', 'Fire · Earth · Air · Water'], wide: [null, '', ''] };
  const [hl, t, k] = map[go]; highlight(go === 'elements' ? ['041', '042', '043', '044'] : go === 'points' ? ['035', '036', '037', '038', '039', '040'] : hl ? [hl] : []);
  setFx(go === 'elements' ? ['trine:Fire', 'trine:Earth', 'trine:Air', 'trine:Water'] : []);
  tag(k, t); clearTimeout(tag.t); tag.t = setTimeout(() => tag(), 2600);
  goPreset(go);
});

// ---------------------------------------------------------------- lesson
const lvid = $('lvid');
let curLesson = null, returnTo = null;
lvid.addEventListener('play', bedLevel); lvid.addEventListener('pause', bedLevel);
function closeVideo() { lvid.pause(); lvid.removeAttribute('src'); lvid.load(); orbitK = 1; }
function openLesson(n, fly = true) {
  pin(null);
  const c = byN[n], l = L[n]; curLesson = n;
  if (tab !== 'explore' && !returnTo) returnTo = tab;
  $('lk').textContent = `${kicker(c)} · ${c.n}`; $('lt').textContent = c.title;
  $('lz').textContent = `“${c.z}”`; $('lm').textContent = c.m;
  $('lf').textContent = l.f; $('la').textContent = l.a; $('lu').textContent = l.u;
  const done = learned.has(n); $('lgot').classList.toggle('done', done); $('lgot').textContent = done ? '✓ Learned' : '✦ I’ve got this one';
  lvid.poster = `../p/${n}.jpg?v=${window.SS_VER||''}`; lvid.src = `../deck/${c.file}.mp4?v=${window.SS_VER||''}`; lvid.muted = !soundOn;
  playLesson();
  openSheet('lesson'); stopChant(); tag();
  highlight([n]); setFx(isEl(n) ? ['trine:' + c.title] : []);
  orbitK = 0;
  if (fly) focusObj(n);
  sheets.lesson.scrollTop = 0;
}
function playLesson() {
  lvid.muted = !soundOn; lvid.volume = 1;
  const p = lvid.play(); $('tapSnd').hidden = true;
  if (p) p.catch(() => { $('tapSnd').hidden = false; });          // iPhone said no to sound: ask for one tap, never go silent
}
$('tapSnd').onclick = () => { soundOn = true; $('snd').setAttribute('aria-pressed', true); $('snd').textContent = '♪ On'; playLesson(); };
lvid.addEventListener('click', () => { if (lvid.paused || lvid.muted) { soundOn = true; playLesson(); } });
const step = d => { const i = C.findIndex(c => c.n === curLesson); openLesson(C[(i + d + C.length) % C.length].n); };
$('lprev').onclick = () => step(-1); $('lnext').onclick = () => step(1);
$('lgot').onclick = () => { markLearned(curLesson); $('lgot').classList.add('done'); $('lgot').textContent = '✓ Learned'; burst($('lgot')); };

// ---------------------------------------------------------------- progress + celebrations
const sectionDone = sec => C.filter(c => c.sec === sec).every(c => learned.has(c.n));
function markLearned(n, quiet) {
  if (learned.has(n)) return; const before = SECS.filter(([s]) => sectionDone(s)).map(([s]) => s);
  learned.add(n); saveLearned(); refreshProg();
  const sec = byN[n].sec;
  if (sectionDone(sec) && !before.includes(sec)) toast(`✦ ${SECS.find(s => s[0] === sec)[1]} constellation complete!`, 3200);
  else if (!quiet) toast(`✦ ${byN[n].title} lit up in your sky`);
}
function refreshProg() { $('prog').textContent = `✦ ${learned.size}/44`; }
$('prog').onclick = () => setTab('sky');
function toast(t, ms = 1800) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), ms); }
function burst(el) {
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('i'); s.className = 'spark'; document.body.appendChild(s);
    const a = Math.random() * 6.28, d = 40 + Math.random() * 70, col = pick(['#f2c466', '#ff5fb0', '#3fe0d0', '#ffe3a3', '#9b6bff']);
    s.style.background = col; s.style.boxShadow = `0 0 10px ${col}`;
    s.animate([{ transform: `translate(${cx}px,${cy}px) scale(1)`, opacity: 1 }, { transform: `translate(${cx + Math.cos(a) * d}px,${cy + Math.sin(a) * d}px) scale(.2)`, opacity: 0 }],
      { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove();
    s.style.left = 0; s.style.top = 0;
  }
}

// ---------------------------------------------------------------- tour
let chap = 0, chantT = null;
function stopChant() { clearInterval(chantT); chantT = null; }
function tourFx(T) {
  stopChant(); tag(); highlight(T.hl);
  setFx(T.fx === 'trines' ? ['trine:Fire', 'trine:Earth', 'trine:Air', 'trine:Water'] : T.fx === 'crosses' ? ['cross:Cardinal', 'cross:Fixed', 'cross:Mutable'] : T.fx === 'formula' ? ['link'] : []);
  if (T.fx === 'formula') fxLines.link.userData.ns = ['016', '008', '029'];
  goPreset(T.cam, 1.8);
  if (T.fx === 'chant') { let k = 0; const signs = C.filter(c => c.sec === 'Zodiac');
    chantT = setInterval(() => { const c = signs[k % 12]; highlight([c.n]); tag(c.title, c.m); k++; }, 1100); }
}
function showChapter(i) {
  chap = Math.max(0, Math.min(TOUR.length - 1, i)); const T = TOUR[chap];
  $('tk').textContent = T.k; $('th').textContent = T.h; $('tp').innerHTML = T.p;
  $('tdots').innerHTML = TOUR.map((_, j) => `<i class="${j === chap ? 'on' : ''}"></i>`).join('');
  $('tprev').disabled = chap === 0; $('tnext').textContent = chap === TOUR.length - 1 ? 'Go play ★' : 'Next ›';
  stopChant(); tag(); highlight(T.hl);
  setFx(T.fx === 'trines' ? ['trine:Fire', 'trine:Earth', 'trine:Air', 'trine:Water'] : T.fx === 'crosses' ? ['cross:Cardinal', 'cross:Fixed', 'cross:Mutable'] : T.fx === 'formula' ? ['link'] : []);
  if (T.fx === 'formula') fxLines.link.userData.ns = ['016', '008', '029'];
  goPreset(T.cam, 1.8);
  if (T.fx === 'chant') { let k = 0; const signs = C.filter(c => c.sec === 'Zodiac');
    chantT = setInterval(() => { const c = signs[k % 12]; highlight([c.n]); tag(c.title, c.m); k++; }, 1100); }
}
$('tprev').onclick = () => showChapter(chap - 1);
$('tnext').onclick = () => chap === TOUR.length - 1 ? setTab('play') : showChapter(chap + 1);
{ let sx = null; const box = $('tourBox');
  box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) showChapter(chap + (dx < 0 ? 1 : -1)); }); }

// ---------------------------------------------------------------- builder
const sel = { p: '016', s: '008', h: '029' };
function strip(id, list, k, lab) {
  $(id).innerHTML = list.map(c => `<button type="button" data-n="${c.n}" aria-pressed="${sel[k] === c.n}"><b>${esc(G[c.n])}</b>${esc(lab(c))}</button>`).join('');
  $(id).onclick = e => { const b = e.target.closest('button'); if (!b) return; sel[k] = b.dataset.n; renderBuild(true); };
}
function renderBuild(flyCam) {
  strip('rp', C.filter(c => c.sec === 'Planet'), 'p', c => c.title);
  strip('rs', C.filter(c => c.sec === 'Zodiac'), 's', c => c.title);
  strip('rh', C.filter(c => c.sec === 'House'), 'h', c => houseOrd(c.n));
  for (const id of ['rp', 'rs', 'rh']) { const b = $(id).querySelector('[aria-pressed="true"]'); if (b) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }
  const P = byN[sel.p], S = byN[sel.s], H = byN[sel.h];
  $('reading').innerHTML = `<div class="eq">${esc(P.title)} in ${esc(S.title)} in the ${houseOrd(H.n)} House</div>
    <div class="mm"><em>${nice(P.m)}</em> + <em>${nice(S.m)}</em> + <em>${nice(H.m)}</em></div>
    <div class="rd">${esc(B.what[P.n])} ${esc(B.how[S.n])} ${esc(B.where[H.n])}.</div>
    <div class="zz">The shade: “${esc(P.z)}” “${esc(S.z)}” “${esc(H.z)}”</div>`;
  highlight([sel.p, sel.s, sel.h]); fxLines.link.userData.ns = [sel.p, sel.s, sel.h]; setFx(['link']);
  if (flyCam) frame([sel.p, sel.s, sel.h], 1.4);
}
$('dice').onclick = () => {
  let k = 0; const T = setInterval(() => {
    sel.p = pick(C.filter(c => c.sec === 'Planet')).n; sel.s = pick(C.filter(c => c.sec === 'Zodiac')).n; sel.h = pick(C.filter(c => c.sec === 'House')).n;
    renderBuild(false); if (++k > 7) { clearInterval(T); renderBuild(true); burst($('reading')); }
  }, 110);
};

// ---------------------------------------------------------------- my sky
function renderSky() {
  $('skyLine').textContent = learned.size ? `You’ve lit ${learned.size} of 44 stars. Every card you learn glows in the nebula, and each finished section draws its constellation.`
    : 'Your sky is still dark. Learn a card (or win a game) and it lights up here and in the nebula.';
  $('bars').innerHTML = SECS.map(([s, lab]) => { const all = C.filter(c => c.sec === s), k = all.filter(c => learned.has(c.n)).length;
    return `<div class="b"><span>${esc(lab)} · ${k}/${all.length}${k === all.length ? ' ✦' : ''}</span><div><i style="width:${k / all.length * 100}%"></i></div></div>`; }).join('');
  $('stars').innerHTML = C.map(c => `<button type="button" data-n="${c.n}" class="${learned.has(c.n) ? 'lit' : ''}" aria-label="${esc(c.title)}${learned.has(c.n) ? ', learned' : ''}">${esc(G[c.n])}</button>`).join('');
}
$('stars').onclick = e => { const b = e.target.closest('button'); if (b) { returnTo = 'sky'; openLesson(b.dataset.n); } };
$('reset').onclick = () => { const b = $('reset'); if (!b.dataset.arm) { b.dataset.arm = 1; b.textContent = 'Tap again to clear my sky'; setTimeout(() => { delete b.dataset.arm; b.textContent = 'Start my sky over'; }, 3000); return; }
  learned.clear(); saveLearned(); refreshProg(); renderSky(); highlight([]); delete b.dataset.arm; b.textContent = 'Start my sky over'; };

// ---------------------------------------------------------------- games
const stage = $('stage'), body = $('gameBody');
let score = 0;
const setScore = (s, t) => { score = s; $('gs').textContent = t != null ? t : `✦ ${s}`; };
const setProg = f => { $('gp').style.width = `${Math.round(f * 100)}%`; };
function openGame(name) {
  stage.classList.add('open'); openSheet(null); $('explore').style.opacity = 0; setScore(0); setProg(0);
  ({ swipe: gSwipe, match: gMatch, decode: gDecode, flash: gFlash, ws: gWs })[name]();
}
function closeGame() { stage.classList.remove('open'); body.innerHTML = ''; setTab('play'); }
$('gclose').onclick = closeGame;
document.querySelectorAll('[data-game]').forEach(b => b.onclick = () => openGame(b.dataset.game));
function endScreen(title, line, again) {
  setProg(1);
  body.innerHTML = `<div style="text-align:center;display:grid;gap:14px;justify-items:center"><div style="font:700 64px var(--astro);color:var(--gold);text-shadow:0 0 30px rgba(242,196,102,.6)">✦</div>
    <h2 style="margin:0;font:700 30px var(--display);color:var(--gold)">${esc(title)}</h2><p style="margin:0;max-width:32ch">${line}</p>
    <div class="row"><button class="btn sm" id="again" type="button">Play again</button><button class="ghost" id="back" type="button">More games</button></div></div>`;
  $('again').onclick = again; $('back').onclick = closeGame; burst($('again'));
}
const verdict = (s, t) => s / t >= .9 ? 'Certified astrologer energy.' : s / t >= .7 ? 'Okay, you clearly paid attention.' : s / t >= .4 ? 'Not bad. The stars believe in you.' : 'Mercury must be retrograde. Run it back.';

// swipe the shade: is this zinger theirs?
function gSwipe() {
  $('gh').textContent = 'Swipe the shade';
  const R = 12, deck = shuffle(C).slice(0, R); let i = 0, s = 0;
  const round = () => {
    if (i >= R) return endScreen(`${s} of ${R}`, `${verdict(s, R)} Every zinger you nailed lit up in your sky.`, gSwipe);
    setProg(i / R);
    const c = deck[i], truth = Math.random() < .5, pool = C.filter(d => d.sec === c.sec && d.n !== c.n), shown = truth ? c : pick(pool);
    body.innerHTML = `<div class="swq">Who said it?</div>
      <div class="swipe"><div class="scard" id="sc"><span class="stamp y">YES</span><span class="stamp n">NOPE</span>
        <div class="zq">“${esc(c.z)}”</div><div class="is">Is this<b><span class="astro">${esc(G[shown.n])}</span> ${esc(shown.title)}?</b></div></div></div>
      <div class="swb"><button class="round n" id="sn" type="button" aria-label="Nope">✕</button><button class="round y" id="sy" type="button" aria-label="Yes">✓</button></div>
      <div class="fb" id="fb">Swipe right for yes, left for nope.</div>`;
    const sc = $('sc'); let x0 = null, dx = 0, done = false;
    const decide = yes => {
      if (done) return; done = true; const ok = yes === truth;
      sc.style.transform = `translateX(${yes ? 420 : -420}px) rotate(${yes ? 24 : -24}deg)`; sc.style.opacity = 0;
      if (ok) { s++; setScore(s); markLearned(c.n, true); }
      $('fb').innerHTML = (ok ? '<b>Yes!</b> ' : '<b>Nope.</b> ') + `That’s <b>${esc(c.title)}</b>: “${esc(c.z)}” <span class="astro">${esc(c.m)}</span>`;
      i++; setTimeout(round, 1500);
    };
    sc.addEventListener('pointerdown', e => { x0 = e.clientX; sc.setPointerCapture(e.pointerId); sc.style.transition = 'none'; });
    sc.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; sc.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      sc.querySelector('.y').style.opacity = Math.max(0, dx / 90); sc.querySelector('.n').style.opacity = Math.max(0, -dx / 90); });
    const up = () => { if (x0 == null) return; x0 = null; sc.style.transition = ''; if (Math.abs(dx) > 90) decide(dx > 0); else { sc.style.transform = ''; sc.querySelectorAll('.stamp').forEach(s => s.style.opacity = 0); } dx = 0; };
    sc.addEventListener('pointerup', up); sc.addEventListener('pointercancel', up);
    $('sy').onclick = () => decide(true); $('sn').onclick = () => decide(false);
  };
  round();
}

// match the motto: drag (or tap) each motto onto its card
function gMatch() {
  $('gh').textContent = 'Match the motto';
  const pools = shuffle([['Zodiac'], ['Planet'], ['House'], ['Points']]).slice(0, 3);
  let r = 0, s = 0, miss = 0;
  const round = () => {
    if (r >= 3) return endScreen(`${s} matched`, `${miss ? `${miss} wrong guess${miss > 1 ? 'es' : ''} along the way. ` : 'Not a single wrong guess. '}${verdict(Math.max(0, s - miss), 12)}`, gMatch);
    setProg(r / 3);
    const sec = pools[r][0], src = sec === 'Points' ? C.filter(c => +c.n >= 35 && +c.n <= 40) : C.filter(c => c.sec === sec);
    const set = shuffle(src).slice(0, 4); let left = 4, selChip = null;
    body.innerHTML = `<div class="swq">Round ${r + 1} of 3 · ${sec === 'Points' ? 'Points & nodes' : SECS.find(x => x[0] === sec)[1]}</div>
      <div class="targets">${set.map(c => `<div class="tgt" data-n="${c.n}"><b>${esc(G[c.n])}</b><span>${esc(c.title)}</span><div class="m"></div></div>`).join('')}</div>
      <div class="chipsM">${shuffle(set).map(c => `<div class="mchip" data-n="${c.n}" role="button" tabindex="0">${esc(c.m)}</div>`).join('')}</div>
      <div class="fb">Drag a motto onto its card. Or tap a motto, then tap the card.</div>`;
    const tryDrop = (chip, tgt) => {
      if (!tgt || tgt.classList.contains('ok')) return false;
      if (chip.dataset.n === tgt.dataset.n) {
        tgt.classList.add('ok'); tgt.querySelector('.m').textContent = byN[tgt.dataset.n].m; chip.remove(); s++; setScore(s); markLearned(tgt.dataset.n, true); burst(tgt);
        if (--left === 0) { r++; setTimeout(round, 900); } return true;
      }
      miss++; tgt.classList.remove('shake'); void tgt.offsetWidth; tgt.classList.add('shake'); return false;
    };
    body.querySelectorAll('.mchip').forEach(chip => {
      let ghost = null, moved = false, sx = 0, sy = 0;
      chip.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; moved = false; chip.setPointerCapture(e.pointerId); });
      chip.addEventListener('pointermove', e => {
        if (!chip.hasPointerCapture(e.pointerId)) return;
        if (!ghost && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) { moved = true; ghost = chip.cloneNode(true); ghost.classList.add('drag'); document.body.appendChild(ghost); chip.classList.add('ghosted'); }
        if (ghost) { ghost.style.left = `${e.clientX - ghost.offsetWidth / 2}px`; ghost.style.top = `${e.clientY - 34}px`;
          const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tgt'); body.querySelectorAll('.tgt').forEach(x => x.classList.toggle('hot', x === t)); }
      });
      const end = e => {
        if (ghost) { const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tgt'); ghost.remove(); ghost = null; chip.classList.remove('ghosted');
          body.querySelectorAll('.tgt').forEach(x => x.classList.remove('hot')); if (t && !tryDrop(chip, t)) { chip.classList.remove('shake'); void chip.offsetWidth; chip.classList.add('shake'); } }
        else if (!moved) { body.querySelectorAll('.mchip').forEach(x => x.style.outline = ''); selChip = chip; chip.style.outline = '3px solid #fff'; }
      };
      chip.addEventListener('pointerup', end); chip.addEventListener('pointercancel', () => { if (ghost) { ghost.remove(); ghost = null; chip.classList.remove('ghosted'); } });
    });
    body.querySelectorAll('.tgt').forEach(t => t.addEventListener('click', () => { if (selChip && selChip.isConnected) { const ok = tryDrop(selChip, t); if (ok) selChip = null; } }));
  };
  round();
}

// decode a chart: planet + sign + house
function gDecode() {
  $('gh').textContent = 'Decode a chart';
  const qs = shuffle(D); let i = 0, s = 0;
  const q = () => {
    if (i >= qs.length) return endScreen(`${s} of ${qs.length}`, `${verdict(s, qs.length)} You just read ${qs.length} placements. That’s real chart reading.`, gDecode);
    setProg(i / qs.length);
    const d = qs[i], P = byN[d.p], S = byN[d.s], H = byN[d.h], opts = shuffle([d.ok, ...d.no]);
    body.innerHTML = `<div class="dq"><div class="gl">${esc(G[d.p])}${esc(G[d.s])}<span style="font-size:24px">${houseOrd(d.h)}</span></div>
      <div class="eq">${esc(P.title)} in ${esc(S.title)} in the ${houseOrd(d.h)} House</div>
      <div class="mm">${nice(P.m)} + ${nice(S.m)} + ${nice(H.m)}</div></div>
      <div class="choices">${opts.map(o => `<button type="button">${esc(o)}</button>`).join('')}</div><div class="fb" id="fb"></div>`;
    body.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
      if (body.querySelector('.choices .ok')) return; const ok = b.textContent === d.ok;
      body.querySelectorAll('.choices button').forEach(x => { if (x.textContent === d.ok) x.classList.add('ok'); });
      if (!ok) b.classList.add('no'); else { s++; setScore(s); [d.p, d.s, d.h].forEach(n => markLearned(n, true)); burst(b); }
      $('fb').innerHTML = ok ? '<b>Exactly.</b> What + how + where. You’re reading charts.' : '<b>Close.</b> Read the mottos as one sentence and it clicks.';
      i++; setTimeout(q, 1700);
    });
  };
  q();
}

// flashcards
function gFlash() {
  $('gh').textContent = 'Flashcards';
  body.innerHTML = `<div class="row"><select id="fs" aria-label="Deck"><option value="all">All 44</option>${SECS.map(([s, l]) => `<option value="${s}">${esc(l)}</option>`).join('')}</select>
    <select id="fm" aria-label="Show first"><option value="name">Name first</option><option value="zinger">Zinger first</option></select></div><div id="fcHost" style="display:grid;gap:14px;justify-items:center"></div>`;
  let deck = [], i = 0;
  const build = () => { const v = $('fs').value; deck = shuffle(v === 'all' ? C : C.filter(c => c.sec === v)); i = 0; show(); };
  const show = () => {
    const host = $('fcHost'); setProg(i / deck.length); setScore(0, `${i}/${deck.length}`);
    if (i >= deck.length) { host.innerHTML = `<p style="text-align:center">You flipped through all ${deck.length}. ✦</p><button class="btn sm" id="fa" type="button">Shuffle again</button>`; $('fa').onclick = build; return; }
    const c = deck[i], zf = $('fm').value === 'zinger';
    const face = `<div class="gl">${esc(G[c.n])}</div><div class="nm">${esc(c.title)}</div>`, zing = `<div class="zq">“${esc(c.z)}”</div>`, mot = `<span class="motto">${esc(c.m)}</span>`;
    host.innerHTML = `<button class="flip" id="fc" type="button" aria-label="Flashcard, tap to flip"><div class="in">
      <div class="f">${zf ? zing : face}<div class="tip">Tap to flip</div></div><div class="b">${zf ? face : zing}${mot}</div></div></button>
      <div class="row"><button class="ghost" id="fr" type="button">Again later</button><button class="btn sm" id="fg" type="button">Got it ✦</button></div>`;
    $('fc').onclick = () => $('fc').classList.toggle('on');
    $('fg').onclick = () => { markLearned(c.n, true); i++; show(); };
    $('fr').onclick = () => { deck.splice(i, 1); deck.push(c); show(); };
  };
  $('fs').onchange = build; $('fm').onchange = show; build();
}

// worksheet: fill in the mottos
function gWs() {
  $('gh').textContent = 'Worksheet';
  body.innerHTML = `<div class="row"><select id="wsSec" aria-label="Section">${SECS.map(([s, l]) => `<option value="${s}">${esc(l)}</option>`).join('')}</select>
    <button class="btn sm" id="wc" type="button">Check</button><button class="ghost" id="wr" type="button">Answers</button><button class="ghost" id="wp" type="button">Print</button></div>
    <p class="fb" id="wsScore" style="margin:0"></p><ol id="wsList"></ol>`;
  const norm = s => s.toUpperCase().replace(/[^A-Z]/g, '').replace(/^I/, '');
  const build = () => { const list = C.filter(c => c.sec === $('wsSec').value);
    $('wsList').innerHTML = list.map(c => `<li data-n="${c.n}"><span class="gl">${esc(G[c.n])}</span><span class="nm">${esc(c.title)}</span><input aria-label="${esc(c.title)} motto" placeholder="${isEl(c.n) ? 'its 3 signs' : 'I …'}" autocomplete="off" autocapitalize="characters"></li>`).join('');
    $('wsScore').textContent = ''; setProg(0); setScore(0, ''); };
  $('wsSec').onchange = build;
  $('wc').onclick = () => { let k = 0; const lis = [...$('wsList').children];
    lis.forEach(li => { const c = byN[li.dataset.n], v = li.querySelector('input').value; if (!v.trim()) { li.className = ''; return; }
      const ok = isEl(c.n) ? c.m.split(' · ').every(s => v.toUpperCase().includes(s)) : norm(v) === norm(c.m);
      li.className = ok ? 'ok' : 'no'; if (ok) { k++; markLearned(c.n, true); } });
    $('wsScore').innerHTML = `<b>${k} of ${lis.length}</b> right. ${k === lis.length ? 'Flawless. ✦' : 'Fix the pink ones and check again.'}`; setProg(k / lis.length); setScore(k, `${k}/${lis.length}`); };
  $('wr').onclick = () => [...$('wsList').children].forEach(li => { li.querySelector('input').value = byN[li.dataset.n].m; li.className = ''; });
  $('wp').onclick = () => { try { window.print(); } catch (e) {} };
  build();
}

// ---------------------------------------------------------------- loop
let last = performance.now(), running = true;
const sunView = new V3();
function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
  if (fly) {
    const k = Math.min(1, (now - fly.s) / fly.d), e = ease(k);
    camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e);
    if (k >= 1) { fly = null; controls.enabled = started; if (introRunning) introDone(); }
  }
  controls.update();
  world.rotation.x += (tiltX - world.rotation.x) * .06; world.rotation.y += (tiltY + Math.sin(t * .05) * .04 - world.rotation.y) * .06;
  orbitK += ((curLesson && sheets.lesson.classList.contains('open') ? 0 : 1) - orbitK) * Math.min(1, dt * 2);
  for (const n in PLANETS) { const P = PLANETS[n]; if (natal) { P.a += (natal.ang[n] - P.a) * Math.min(1, dt * 2.5); } else P.a += P.w * dt * orbitK; P.pivot.rotation.z = P.a; }
  if (PLANETS['013'].corona) PLANETS['013'].corona.material.opacity = .65 + .15 * Math.sin(t * 1.3);
  for (const n in objs) { const o = objs[n]; o.lvl += (o.lvlT - o.lvl) * Math.min(1, dt * 5); o.apply(t); }
  declutter();
  for (const s of clouds) s.material.rotation += s.userData.spin * dt;
  starMat.uniforms.uTime.value = t; planetMats.forEach(m => { m.uniforms.uTime.value = t; });
  camera.updateMatrixWorld(); sunView.set(0, 0, 0); world.localToWorld(sunView).applyMatrix4(camera.matrixWorldInverse); sunU.value.copy(sunView);
  updateLines(dt);
  composer.render();
}
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(loop); } });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight); bloom.resolution.set(innerWidth / 2, innerHeight / 2);
});

// ---------------------------------------------------------------- boot
const bar = $('loadbar').firstElementChild;
async function boot() {
  bar.style.width = '15%';
  await Promise.race([Promise.all([document.fonts.load('700 100px Astro'), document.fonts.load('600 46px Figtree'), document.fonts.load('700 30px Comfortaa')]), new Promise(r => setTimeout(r, 3500))]).catch(() => {});
  bar.style.width = '40%'; await new Promise(r => setTimeout(r, 16));
  buildNebula(); bar.style.width = '65%'; await new Promise(r => setTimeout(r, 16));
  buildStars(); buildWheel(); buildPlanets(); buildNodes(); buildFx(); refreshProg();
  bar.style.width = '100%';
  requestAnimationFrame(loop);
  const b = $('enter'); b.disabled = false; b.textContent = 'Enter the nebula ✦';
  if (new URLSearchParams(location.search).has('skip')) enter();
}
function enter() {
  if (started) return; started = true;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}   // iOS 17+: play even with the silent switch on
  startBed(); startGyro();
  try { lvid.src = `../deck/${C[0].file}.mp4?v=${window.SS_VER||''}`; lvid.muted = false; const u = lvid.play(); if (u) u.then(() => { lvid.pause(); lvid.currentTime = 0; }).catch(() => {}); } catch (e) {}
  $('gate').classList.add('gone');
  introRunning = true; let [p, t] = PRESET.wide(); p = t.clone().add(p.clone().sub(t).multiplyScalar(fitF())); flyTo(p, t, new URLSearchParams(location.search).has('skip') ? .05 : 5.5);
}
function introDone() {
  introRunning = false; controls.enabled = true; document.body.classList.add('ui-on');
  setTimeout(() => { $('hint').style.opacity = 0; }, 7000);
  const q = new URLSearchParams(location.search);
  if (q.get('card') && byN[q.get('card')]) openLesson(q.get('card'));
  else if (q.get('tab')) setTab(q.get('tab'));
}
$('enter').onclick = enter;
boot();
window.__nebula = { openLesson, setTab, openGame, objs, camera, controls,
  highlight, setFx, goPreset, focusObj, frame, tag, toast, burst, markLearned, openSheet, bedLevel, tourFx, stopChant,
  setLink: ns => { fxLines.link.userData.ns = ns; }, setNatal, clearNatal, hasNatal: () => !!natal, isLearned: n => learned.has(n), soundOn: () => soundOn, tab: () => tab };
