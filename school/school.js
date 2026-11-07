// Stars & Shade · The Shade School
// A guided course through the deck, one step at a time: cards (her video, zinger, motto, lesson), practice, and a quiz you pass
// to unlock the next level. Progress is saved in this browser so people can leave and pick up where they left off.
// Optional: The Shade Oracle (ElevenLabs voice agent) teaches each step out loud.
// Runs on its own classroom page (school/). The 3D hooks are no-ops here; learned cards are shared with the Nebula's My Sky.
const noop = () => {};
const N = window.__nebula || {
  highlight: noop, setFx: noop, goPreset: noop, focusObj: noop, frame: noop, tag: noop, tourFx: noop, stopChant: noop, setLink: noop, bedLevel: noop,
  soundOn: () => true,
  markLearned(n) { try { const k = 'ss-nebula-learned', s = new Set(JSON.parse(localStorage.getItem(k) || '[]')); s.add(n); localStorage.setItem(k, JSON.stringify([...s])); } catch (e) {} },
  toast(t, ms = 1800) { const el = document.getElementById('toast'); if (!el) return; el.textContent = t; el.classList.add('on'); clearTimeout(this._t); this._t = setTimeout(() => el.classList.remove('on'), ms); },
  burst(el) { if (!el) return; const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 18; i++) { const s = document.createElement('i'); s.className = 'spark'; document.body.appendChild(s);
      const a = Math.random() * 6.28, d = 40 + Math.random() * 70, col = ['#f2c466', '#ff5fb0', '#3fe0d0', '#ffe3a3', '#9b6bff'][i % 5];
      s.style.background = col; s.style.boxShadow = `0 0 10px ${col}`;
      s.animate([{ transform: `translate(${cx}px,${cy}px)`, opacity: 1 }, { transform: `translate(${cx + Math.cos(a) * d}px,${cy + Math.sin(a) * d}px) scale(.2)`, opacity: 0 }], { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove(); } }
};
{ const _b = N.burst; N.burst = el => (document.body.classList.contains('lw-calm') ? null : _b.call(N, el)); }
const C = window.CARDS, L = window.LEARN, D = window.DECODE, B = window.BUILD, TOUR = window.TOUR, G = window.GLYPH;
const EL = window.SIGN_EL, MODE = window.SIGN_MODE;
const byN = Object.fromEntries(C.map(c => [c.n, c]));
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const nice = m => m.charAt(0) + m.slice(1).toLowerCase();
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i).padStart(3, '0'));
const isEl = n => +n >= 41;
const area = n => L[n].f.split(' · ').pop();
const houseOrd = n => B.ord[+n - 23];

// ---------------------------------------------------------------- the course
const T = i => ({ t: 'tour', i });
const cards = ns => ns.map(n => ({ t: 'card', n }));
const COURSE = [
  { id: 'L1', title: 'Welcome to the deck', sub: 'How a chart and a card work', steps: [T(0),
      { t: 'text', k: 'Every card has three parts', h: 'Title, zinger, motto', p: '<b>The title</b> is the who or what. <b>The zinger</b> is the shade: how that energy would roast itself if it were being honest. <b>The “I” motto</b> is its one job. Memorize the mottos and you can read a chart. Here’s one.' },
      { t: 'card', n: '005' }, T(1), T(2), T(3), { t: 'quiz', basics: true }] },
  { id: 'L2', title: 'The Signs, part 1', sub: 'Aries · Taurus · Gemini · Cancer', steps: [...cards(range(1, 4)), { t: 'match', ns: range(1, 4) }, { t: 'quiz', ns: range(1, 4) }] },
  { id: 'L3', title: 'The Signs, part 2', sub: 'Leo · Virgo · Libra · Scorpio', steps: [...cards(range(5, 8)), { t: 'match', ns: range(5, 8) }, { t: 'quiz', ns: range(5, 8) }] },
  { id: 'L4', title: 'The Signs, part 3', sub: 'Sagittarius · Capricorn · Aquarius · Pisces', steps: [...cards(range(9, 12)), { t: 'match', ns: range(9, 12) }, T(10), { t: 'quiz', ns: range(9, 12), plus: range(1, 8) }] },
  { id: 'L5', title: 'Elements & modes', sub: 'Fire · Earth · Air · Water', steps: [T(6), ...cards(['043', '044', '042', '041']), T(7), { t: 'quiz', ns: ['041', '042', '043', '044'], elements: true }] },
  { id: 'L6', title: 'The Planets, part 1', sub: 'Sun · Moon · Mercury · Venus · Mars', steps: [...cards(range(13, 17)), { t: 'match', ns: range(13, 16) }, { t: 'quiz', ns: range(13, 17) }] },
  { id: 'L7', title: 'The Planets, part 2', sub: 'Jupiter · Saturn · Uranus · Neptune · Pluto', steps: [...cards(range(18, 22)), { t: 'match', ns: range(18, 21) }, { t: 'quiz', ns: range(18, 22), plus: range(13, 17) }] },
  { id: 'L8', title: 'The Houses, part 1', sub: 'Houses 1 to 6', steps: [...cards(range(23, 28)), { t: 'match', ns: shuffle(range(23, 28)).slice(0, 4) }, { t: 'quiz', ns: range(23, 28) }] },
  { id: 'L9', title: 'The Houses, part 2', sub: 'Houses 7 to 12', steps: [...cards(range(29, 34)), { t: 'match', ns: shuffle(range(29, 34)).slice(0, 4) }, { t: 'quiz', ns: range(29, 34), plus: range(23, 28) }] },
  { id: 'L10', title: 'Points & nodes', sub: 'Rising · Retrograde · Nodes · Midheaven · Fortune', steps: [T(8), ...cards(range(35, 40)), { t: 'match', ns: ['035', '037', '038', '039'] }, { t: 'quiz', ns: range(35, 40) }] },
  { id: 'L11', title: 'Reading a chart', sub: 'Put it all together', steps: [T(4), T(5), { t: 'build' }, { t: 'decode' }, { t: 'mychart' }, T(9)] },
  { id: 'L12', title: 'Final exam', sub: 'Pass it, get certified', steps: [{ t: 'quiz', final: true }, { t: 'cert' }] }
];
const TOTAL = COURSE.reduce((a, l) => a + l.steps.length, 0);

// ---------------------------------------------------------------- saved progress (this browser)
const KEY = 'ss-school-v1';
let S = { lv: {}, name: '' };
try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const lv = id => (S.lv[id] = S.lv[id] || { step: 0, done: false });
const unlocked = i => i === 0 || has('focus') || (S.lv[COURSE[i - 1].id] || {}).done;
const doneSteps = () => COURSE.reduce((a, l) => a + (S.lv[l.id]?.done ? l.steps.length : Math.min(S.lv[l.id]?.step || 0, l.steps.length)), 0);
// ---------------------------------------------------------------- learn your way (how this person's brain likes to learn)
// Saved on this phone and, when signed in, on their own account row (never shown to friends). Nothing picked = the School as it always was.
const WAYS = [
  { k: 'read', e: '📖', t: 'Reading is hard for me', s: 'Like dyslexia. Bigger, easier text, and everything gets read out loud.',
    skye: 'Reading is hard for me, so say what is on screen out loud in short, simple sentences.' },
  { k: 'focus', e: '⚡', t: 'My mind jumps around', s: 'Like ADHD. Tiny lessons, quick wins, games early, skip ahead anytime.',
    skye: 'My mind jumps around, so keep it very short and punchy, one idea at a time.' },
  { k: 'calm', e: '🧩', t: 'I’m on the spectrum', s: 'Plain words, the same routine every class, what’s coming next, calm sound and motion.',
    skye: 'I am on the spectrum, so be literal and clear, explain any joke in plain words, and keep the same routine with no surprises.' },
  { k: 'test', e: '😮‍💨', t: 'Tests stress me out', s: 'No timers, no failing, hints, unlimited tries. Practice is how you pass.',
    skye: 'Tests stress me out, so keep quizzes low pressure, never talk about passing or failing, and reassure me.' },
  { k: 'memory', e: '🧠', t: 'Things don’t stick in my memory', s: 'A funny picture for every card, plus quick reviews of the ones you already learned.',
    skye: 'Things do not stick in my memory easily, so give me one vivid, funny picture to hang each card on and repeat the motto.' }
];
const WAY_KEY = 'ss-learn-way';
let WAY = null; try { WAY = JSON.parse(localStorage.getItem(WAY_KEY) || 'null'); } catch (e) {}
const has = k => Array.isArray(WAY) && WAY.includes(k);
function applyWay() { WAYS.forEach(w => document.body.classList.toggle('lw-' + w.k, has(w.k))); }
function setWay(arr) { WAY = arr; try { localStorage.setItem(WAY_KEY, JSON.stringify(arr)); } catch (e) {} applyWay(); try { window.SSAcct && window.SSAcct.saveWay && window.SSAcct.saveWay(arr); } catch (e) {} }
const wayNote = () => { const w = WAYS.filter(x => has(x.k)); return w.length ? ` (How I learn: ${w.map(x => x.skye).join(' ')})` : ''; };
applyWay();
if (window.SSAcct) window.SSAcct.onChange((u, p) => { if (!u || !p) return;
  if (Array.isArray(p.learn_way)) { const same = JSON.stringify(p.learn_way) === JSON.stringify(WAY); WAY = p.learn_way; try { localStorage.setItem(WAY_KEY, JSON.stringify(WAY)); } catch (e) {} applyWay(); if (!same && (view === 'map' || view === 'way')) show(); }
  else if (Array.isArray(WAY)) { try { window.SSAcct.saveWay(WAY); } catch (e) {} } });
// read-aloud with the phone's own free voice (when Skye's voice lessons are off)
const TTS = { on: true, gen: 0,
  stop() { this.gen++; try { speechSynthesis.cancel(); } catch (e) {} },
  read(parts) { if (!has('read') || !this.on || !window.speechSynthesis || (typeof guide !== 'undefined' && guide.on)) return; this.stop(); const my = this.gen;
    const list = parts.map(t => String(t || '').replace(/\s+/g, ' ').trim()).filter(Boolean); let i = 0;
    const next = () => { if (my !== this.gen || i >= list.length) return; const u = new SpeechSynthesisUtterance(list[i++]); u.rate = .95; u.onend = u.onerror = next; try { speechSynthesis.speak(u); } catch (e) {} };
    next(); },
  readStep() { const q = sel => [...body.querySelectorAll(sel)].map(e => e.textContent);
    this.read(q('.plan, h2, .zing, .motto, .plain, #scBody > p, .reading, .choices button, .mt span, .mc, .fb')); } };
// 12-minute stretch nudge for jumpy minds
let focusT0 = Date.now();
const nudge = () => { if (has('focus') && Date.now() - focusT0 > 12 * 60000) { focusT0 = Date.now(); N.toast('✦ 12 minutes in. Stretch, sip water. Your spot’s saved.', 4200); } };

const currentLevel = () => { const i = COURSE.findIndex((l, k) => unlocked(k) && !S.lv[l.id]?.done); return i < 0 ? COURSE.length - 1 : i; };

// ---------------------------------------------------------------- quiz questions, built from Mom's cards
function qs(step) {
  if (step.basics) return shuffle([
    { q: 'On every card, what is the zinger?', ok: 'The shade: how that energy would roast itself', no: ['The date range', 'The planet that rules it', 'A compliment'] },
    { q: 'Planets tell you…', ok: 'WHAT: the energy', no: ['HOW: the style', 'WHERE: the area of life', 'WHEN: the timing'] },
    { q: 'Signs tell you…', ok: 'HOW: the style', no: ['WHAT: the energy', 'WHERE: the area of life', 'WHO: your soulmate'] },
    { q: 'Houses tell you…', ok: 'WHERE: the area of life', no: ['WHAT: the energy', 'HOW: the style', 'WHY: the reason'] },
    { q: 'Your birth chart is…', ok: 'A snapshot of the sky the minute you were born', no: ['A rulebook for your life', 'Your horoscope for the week', 'A list of compatible signs'] }
  ]);
  const pool = n => C.filter(c => c.sec === byN[n].sec && !(isEl(c.n) !== isEl(n)));
  const opts = (right, wrongs) => ({ ok: right, no: shuffle([...new Set(wrongs.filter(w => w !== right))]).slice(0, 3) });
  const make = (n, kind) => {
    const c = byN[n], p = pool(n).filter(x => x.n !== n);
    if (kind === 'zinger') return { q: `Who says: “${c.z}”`, ...opts(c.title, p.map(x => x.title)), n };
    if (kind === 'motto') return isEl(n) ? { q: `Which three signs are ${c.title}?`, ...opts(c.m, p.map(x => x.m)), n } : { q: `What’s ${c.title}’s motto?`, ...opts(c.m, p.map(x => x.m)), n };
    if (kind === 'element') return { q: `What element is ${c.title}?`, ...opts(EL[n], ['Fire', 'Earth', 'Air', 'Water']), n };
    if (kind === 'mode') return { q: `${c.title} is a … sign`, ...opts(MODE[n], ['Cardinal (starts things)', 'Fixed (keeps things going)', 'Mutable (adapts)'].map(x => x.split(' ')[0]).concat(['Cardinal', 'Fixed', 'Mutable'])), n };
    if (kind === 'area') return { q: `${c.title} is about…`, ...opts(area(n), p.map(x => area(x.n))), n };
  };
  if (step.final) {
    const all = shuffle(C).slice(0, 12);
    return all.map(c => make(c.n, c.sec === 'Zodiac' ? pick(['zinger', 'motto', 'element']) : c.sec === 'House' || c.sec === 'Planet' ? pick(['zinger', 'motto', 'area']) : pick(['zinger', 'motto'])));
  }
  if (step.elements) return shuffle([make(pick(['043', '044', '042', '041']), 'zinger'), make(pick(['043', '044', '042', '041']), 'motto'),
    make(pick(range(1, 12)), 'element'), make(pick(range(1, 12)), 'element'), make(pick(range(1, 12)), 'mode')]);
  const ns = shuffle(step.ns), out = [];
  ns.forEach((n, i) => out.push(make(n, i % 2 ? 'motto' : 'zinger')));
  const extra = byN[ns[0]].sec === 'Zodiac' ? 'element' : byN[ns[0]].sec === 'Misc' ? 'zinger' : 'area';
  while (out.length < 5) out.push(make(pick(step.plus || step.ns), out.length % 2 ? extra : 'motto'));
  return shuffle(out).slice(0, 5);
}

// ---------------------------------------------------------------- UI
const sheet = $('schoolSheet'), body = $('scBody'), svid = $('svid');
let view = 'map', L_i = 0, st = 0, quiz = null;

function show() { if (view === 'way') renderWay(); else if (view === 'map') renderMap(); else renderStep(); }
function leave() { svid.pause(); guide.stop(); N.stopChant(); TTS.stop(); }

function renderWay(back) {
  view = 'way'; svid.pause(); TTS.stop(); $('scTop').hidden = true; $('scFoot').hidden = true;
  let pickd = new Set((WAY || []).filter(k => k !== 'none'));
  body.innerHTML = `<div class="kick">Before class · Learn your way</div><h2>How does your brain like to learn?</h2>
    <p class="muted" style="margin:6px 0 14px">Every brain’s a different sky. Tick all that fit, or none. The School changes how it teaches you. Only you see this, and you can change it anytime.</p>
    <div class="ways">${WAYS.map(w => `<button type="button" class="way" data-k="${w.k}" aria-pressed="${pickd.has(w.k)}"><span class="we" aria-hidden="true">${w.e}</span><span class="wt"><b>${esc(w.t)}</b><small>${esc(w.s)}</small></span><span class="wc" aria-hidden="true"></span></button>`).join('')}</div>
    <button class="btn" id="wayGo" type="button" style="width:100%;margin-top:14px">Let’s go ✦</button>
    <button class="ghost" id="wayNone" type="button" style="width:100%;margin-top:10px">None of these. Just teach me</button>`;
  body.querySelectorAll('.way').forEach(b => b.onclick = () => { const k = b.dataset.k; pickd.has(k) ? pickd.delete(k) : pickd.add(k); b.setAttribute('aria-pressed', pickd.has(k)); });
  const done = arr => { setWay(arr); N.toast(arr.length && arr[0] !== 'none' ? '✦ Got it. Class is set up your way.' : '✦ Classic class it is.', 2400); renderMap(); };
  $('wayGo').onclick = () => done(pickd.size ? [...pickd] : ['none']);
  $('wayNone').onclick = () => done(['none']);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderMap() {
  document.body.classList.remove('inq');
  if (WAY == null) return renderWay();
  view = 'map'; TTS.stop(); svid.pause(); $('scTop').hidden = true; $('scFoot').hidden = true;
  const pct = Math.round(doneSteps() / TOTAL * 100), cur = currentLevel(), allDone = COURSE.every(l => S.lv[l.id]?.done);
  N.highlight(); N.setFx([]); N.goPreset('wide');
  body.innerHTML = `<div class="kick">Syllabus · The Shade School</div><h2>Learn the whole deck</h2>
    <p class="muted" style="margin:6px 0 12px">12 classes, one step at a time. ${has('focus') ? 'Jump into any class you want.' : has('test') ? 'Practice each class to unlock the next. No failing, ever.' : 'Pass each pop quiz to unlock the next class.'} Your spot is saved, so come back anytime.</p>
    <button type="button" class="waychip" id="wayChip"><span>${WAY.filter(k => k !== 'none').length ? 'Learning your way: ' + WAYS.filter(w => has(w.k)).map(w => w.e).join(' ') : 'Learning: the classic way'}</span><b>Change</b></button>
    <div class="scbar"><i style="width:${pct}%"></i></div><div class="muted" style="font-size:13px;margin:6px 0 14px">${pct}% complete</div>
    <button class="btn" id="scGo" type="button" style="width:100%">${allDone ? '✦ See my certificate' : doneSteps() ? `Continue · Level ${cur + 1}` : 'Start the course ✦'}</button>
    <ol class="levels">${COURSE.map((l, i) => { const s = S.lv[l.id] || {}, ok = unlocked(i);
      return `<li><button type="button" data-i="${i}" class="${s.done ? 'done' : ok ? 'open' : 'lock'}" ${ok ? '' : 'disabled'}>
        <span class="num">${s.done ? '✓' : ok ? i + 1 : '🔒'}</span><span class="t"><b>${esc(l.title)}</b><small>${esc(l.sub)}</small></span>
        <span class="pr">${s.done ? 'Done' : ok && s.step ? `${s.step}/${l.steps.length}` : ''}</span></button></li>`; }).join('')}</ol>`;
  $('wayChip').onclick = () => renderWay();
  $('scGo').onclick = () => allDone ? openLevel(COURSE.length - 1, COURSE[COURSE.length - 1].steps.length - 1) : openLevel(cur);
  body.querySelectorAll('[data-i]').forEach(b => b.onclick = () => openLevel(+b.dataset.i));
  (window.__nebula ? (sheet.scrollTop = 0) : window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function openLevel(i, at) {
  L_i = i; const s = lv(COURSE[i].id); st = at != null ? at : (s.done ? 0 : Math.min(s.step, COURSE[i].steps.length - 1)); view = 'step'; renderStep();
}

function go(d) {
  const lvl = COURSE[L_i], s = lv(lvl.id), step = lvl.steps[st];
  if (d > 0 && step.t === 'card') { N.markLearned(step.n, true); if (has('focus')) N.toast(pick(['✦ +1 card. Nice.', '✦ Got it. Next!', '✦ Another one down.', '✦ Look at you go.']), 1400); }
  if (d > 0) nudge(); TTS.stop();
  st += d;
  if (st >= lvl.steps.length) { finishLevel(); return; }
  if (st < 0) { st = 0; }
  s.step = Math.max(s.step, st); save(); renderStep();
}

function finishLevel() {
  const lvl = COURSE[L_i]; lv(lvl.id).done = true; lv(lvl.id).step = lvl.steps.length; save();
  N.toast(`✦ Level ${L_i + 1} complete!`, 2600);
  guide.say(`[SCHOOL] I just finished level ${L_i + 1}, "${lvl.title}". Celebrate me in one or two sentences, then say what's next: ${COURSE[L_i + 1] ? `level ${L_i + 2}, "${COURSE[L_i + 1].title}"` : 'nothing, I finished the whole course'}.`);
  if (L_i + 1 < COURSE.length) { body.innerHTML = `<div style="text-align:center;display:grid;gap:12px;justify-items:center;padding:10px 0">
      <div class="big">✦</div><h2>Level ${L_i + 1} done</h2><p class="muted" style="margin:0">${esc(lvl.title)} is in the bag. Up next: <b>${esc(COURSE[L_i + 1].title)}</b>.</p>
      <div class="row"><button class="btn sm" id="scNextL" type="button">Next level ›</button><button class="ghost" id="scMap" type="button">Course map</button></div></div>`;
    $('scFoot').hidden = true; $('scNextL').onclick = () => openLevel(L_i + 1); $('scMap').onclick = renderMap; N.burst($('scNextL'));
  } else renderMap();
}

function head() {
  const lvl = COURSE[L_i]; $('scTop').hidden = false; $('scFoot').hidden = false;
  $('scLvl').textContent = `Class ${L_i + 1} of 12 · ${lvl.title}`; $('scCount').textContent = `Step ${st + 1} of ${lvl.steps.length}`;
  $('scProg').style.width = `${(st + 1) / lvl.steps.length * 100}%`;
  $('ttsBtn').hidden = !has('read') || !window.speechSynthesis; $('ttsBtn').textContent = TTS.on ? '🔊 Reading aloud' : '🔈 Read aloud: off'; $('ttsBtn').setAttribute('aria-pressed', TTS.on);
  $('scBack').disabled = st === 0; $('scNext').disabled = false; $('scNext').textContent = st === lvl.steps.length - 1 ? 'Finish level ✦' : 'Next ›';
}

function renderStep() {
  const lvl = COURSE[L_i], step = lvl.steps[st]; document.body.classList.toggle('inq', step.t === 'quiz'); head(); svid.pause(); $('scVid').hidden = true; N.stopChant(); N.tag();
  if (step.t === 'tour') { const t = TOUR[step.i]; body.innerHTML = `${boardArt(t)}<div class="kick">${esc(lvl.title)}</div><h2>${esc(t.h)}</h2><p style="margin-top:10px">${t.p}</p>`;
    N.tourFx(t); guide.say(`[SCHOOL] Level ${L_i + 1}, "${lvl.title}". On screen: "${t.h}": ${t.p.replace(/<[^>]+>/g, '')} Teach this to me out loud in 2 to 4 short sentences in your voice. Then tell me to tap Next.`); }
  else if (step.t === 'text') { body.innerHTML = `<div class="kick">${esc(step.k)}</div><h2>${esc(step.h)}</h2><p style="margin-top:10px">${step.p}</p>`;
    N.goPreset('wide'); N.highlight(); N.setFx([]); guide.say(`[SCHOOL] Level ${L_i + 1}. On screen: ${step.h}. ${step.p.replace(/<[^>]+>/g, '')} Explain this in 2 or 3 short sentences, then tell me to tap Next.`); }
  else if (step.t === 'card') renderCard(step.n);
  else if (step.t === 'match') renderMatch(step.ns);
  else if (step.t === 'quiz') renderQuiz(step);
  else if (step.t === 'build') renderBuild();
  else if (step.t === 'decode') renderDecode();
  else if (step.t === 'mychart') renderMyChart();
  else if (step.t === 'cert') renderCert();
  if (st === 0 && L_i > 0 && has('memory')) reviewStrip();
  if (st === 0 && has('calm')) body.insertAdjacentHTML('afterbegin', planHTML(lvl));
  TTS.readStep();
  (window.__nebula ? (sheet.scrollTop = 0) : window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// "what's coming" for calm, predictable classes
function planHTML(lvl) {
  const n = { card: 0, match: 0, quiz: 0, other: 0 }; lvl.steps.forEach(x => n[x.t in n ? x.t : 'other']++);
  const bits = [n.other && `${n.other} short lesson${n.other > 1 ? 's' : ''}`, n.card && `${n.card} card${n.card > 1 ? 's' : ''}`, n.match && 'a matching game', n.quiz && (has('test') ? 'a practice round' : 'a short quiz')].filter(Boolean);
  return `<div class="plan"><b>What’s in this class:</b> ${bits.join(', then ')}. Same steps every time: read, tap Next, and you can always go Back.</div>`;
}
// quick "remember these?" flips of cards from earlier classes
function reviewStrip() {
  const earlier = COURSE.slice(0, L_i).flatMap(l => l.steps.filter(x => x.t === 'card').map(x => x.n));
  const ns = shuffle([...new Set(earlier)]).slice(0, 3); if (!ns.length) return;
  body.insertAdjacentHTML('afterbegin', `<div class="review"><div class="yk">🧠 Remember these? Tap to check</div><div class="rv">${ns.map(n => `<button type="button" class="rvc" data-n="${n}"><b>${esc(byN[n].title)}</b><span>?</span></button>`).join('')}</div></div>`);
  body.querySelectorAll('.rvc').forEach(b => b.onclick = () => { const c = byN[b.dataset.n], h = (S.hooks || {})[c.n]; b.classList.add('flip');
    b.querySelector('span').innerHTML = `${esc(c.m)}${h ? `<small>${esc(h)}</small>` : ''}`; TTS.read([c.title, c.m, h]); });
}

// your own chart, made right on the chalkboard (birth time required)
function renderMyChart() {
  body.innerHTML = '<div class="kick">Your turn</div><h2>Read your own chart</h2><p style="margin:8px 0 12px">Everything you just learned, on the sky you were born under.</p><div id="scMaker"></div>';
  window.SSMaker.mount($('scMaker'), { oracle: s => guide.readChart(s), title: 'Make your free chart', onMade: s => { if (guide.on) guide.readChart(s); renderMyChart(); } });
  { const s1 = window.SSMaker.get(); if (s1 && window.SSWheel) { try { const w = document.createElement('div');
      w.innerHTML = `<div class="ywheel big">${window.SSWheel.svg(window.SSChart.compute(s1.input), {})}</div>${window.SSWheel.legend()}<div class="ssm-row" style="justify-content:center;margin:8px 0 14px"><button class="btn sm" type="button" data-share>📸 Share my chart</button><a class="ghost" href="../chart/">Full chart page</a></div>`;
      $('scMaker').before(w); w.querySelector('[data-share]').onclick = e => window.SSShare.share(s1, e.currentTarget); window.SSShare.prepare(s1); } catch (e) {} } }
  const s0 = window.SSMaker.get();
  guide.say(s0 ? `[SCHOOL] Your-chart step. ${window.SSMaker.text(s0, 'My birth chart')}` : '[SCHOOL] Your-chart step: on screen is a form to make my free birth chart. In one or two sentences tell me to fill in my birth date, exact birth time and city (or just tell you out loud), and that you will read my Big Three.');
}
function openMaker() {
  let d = $('makerDlg'); if (!d) { d = document.createElement('div'); d.id = 'makerDlg'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Free birth chart'); addEventListener('keydown', e => { if (e.key === 'Escape' && !d.hidden) d.hidden = true; }); d.innerHTML = '<div class="mk"><button class="ghost sm2" type="button" data-x>✕ Close</button><div id="mkBox"></div></div>'; document.body.appendChild(d);
    d.querySelector('[data-x]').onclick = () => d.hidden = true; d.onclick = e => { if (e.target === d) d.hidden = true; };
    window.SSMaker.mount(d.querySelector('#mkBox'), { oracle: s => { d.hidden = true; guide.readChart(s); }, onMade: s => { if (guide.on) guide.readChart(s); } }); }
  d.hidden = false; setTimeout(() => { const f = d.querySelector('input, button'); if (f) f.focus(); }, 50);
}
if ($('mkBtn')) $('mkBtn').onclick = openMaker;

// chalk drawings for the lecture steps
function boardArt(t) {
  const row = ns => `<div class="art">${ns.map(n => `<span><b>${esc(G[n])}</b><small>${esc(byN[n].title)}</small></span>`).join('')}</div>`;
  if (t.fx === 'formula') return `<div class="art eqn"><span><b>${G['016']}</b><small>Venus · WHAT</small></span><i>+</i><span><b>${G['008']}</b><small>Scorpio · HOW</small></span><i>+</i><span><b>7</b><small>7th House · WHERE</small></span></div>`;
  if (t.fx === 'trines') return row(['043', '044', '042', '041']);
  if (t.fx === 'chant' || t.cam === 'signs') return `<div class="art wheel">${range(1, 12).map(n => `<b>${G[n]}</b>`).join('')}</div>`;
  if (t.cam === 'planets') return `<div class="art wheel">${range(13, 22).map(n => `<b>${G[n]}</b>`).join('')}</div>`;
  if (t.cam === 'houses') return `<div class="art wheel">${range(1, 12).map(n => `<b>${n}</b>`).join('')}</div>`;
  if (t.cam === 'big3') return row(['013', '014', '035']);
  if (t.cam === 'points') return row(['035', '039', '037', '038']);
  return `<div class="art"><span><b>✦</b></span></div>`;
}

// "in your chart": what this card means for you, with a small wheel that lights it up (only if you've made a chart)
const cap = m => m.charAt(0) + m.slice(1).toLowerCase();
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
function youNote(n) {
  const saved = window.SSMaker && window.SSMaker.get(); if (!saved || !window.SSWheel) return '';
  let ch; try { ch = window.SSChart.compute(saved.input); } catch (e) { return ''; }
  const S = window.SSChart, c = byN[n], first = Math.floor(ch.asc / 30), houseOfSign = i => ((i - first + 12) % 12) + 1, signIdx = lon => Math.floor((((lon % 360) + 360) % 360) / 30);
  const inSign = i => ch.planets.filter(p => signIdx(p.lon) === i).map(p => p.name);
  let txt = '', opt = {};
  if (c.sec === 'Zodiac') { const i = +n - 1, ps = inSign(i); opt.hlSign = i;
    txt = `${c.title} is your <b>${ORD[houseOfSign(i) - 1]} house</b>${ps.length ? `, and you have <b>${ps.join(', ')}</b> in ${c.title}` : ', with no planets in it'}${signIdx(ch.asc) === i ? '. It’s also your <b>Rising sign</b>' : ''}.`; }
  else if (c.sec === 'Planet') { const p = ch.planets.find(q => q.n === n); if (!p) return ''; opt.hlPlanet = p.name; opt.hlSign = signIdx(p.lon);
    txt = `Your ${p.name} is in <b>${S.sign(p.lon)}</b> in your <b>${ORD[p.house - 1]} house</b>${p.retro ? ' (retrograde)' : ''}: ${cap(c.m)} + ${cap(byN[S.signN(p.lon)].m)} + ${cap(byN[S.houseN(p.house)].m)}.`; }
  else if (c.sec === 'House') { const h = +n - 22, i = (first + h - 1) % 12, ps = inSign(i); opt.hlSign = i;
    txt = `Your ${ORD[h - 1]} house is <b>${byN[String(i + 1).padStart(3, '0')].title}</b>${ps.length ? `, with <b>${ps.join(', ')}</b> in it` : ', with no planets in it'}.`; }
  else if (n === '035') { opt.hlSign = signIdx(ch.asc); txt = `Your Rising sign is <b>${S.sign(ch.asc)}</b>.`; }
  else if (n === '039') { opt.hlSign = signIdx(ch.mc); txt = `Your Midheaven is in <b>${S.sign(ch.mc)}</b>, in your ${ORD[houseOfSign(signIdx(ch.mc)) - 1]} house.`; }
  else if (n === '037' || n === '038') { const lon = n === '037' ? ch.northNode : ch.southNode; opt.hlSign = signIdx(lon); txt = `Your ${c.title} is in <b>${S.sign(lon)}</b>, in your ${ORD[houseOfSign(signIdx(lon)) - 1]} house.`; }
  else if (n === '040') { opt.hlSign = signIdx(ch.fortune); txt = `Your Lot of Fortune is in <b>${S.sign(ch.fortune)}</b>, in your ${ORD[ch.fortuneHouse - 1]} house.`; }
  else if (n === '036') { const r = ch.planets.filter(p => p.retro).map(p => p.name); txt = r.length ? `You were born with <b>${r.join(', ')}</b> retrograde.` : 'No planets were retrograde when you were born.'; }
  else if (c.sec === 'Misc') { const el = { '043': [0, 4, 8], '044': [1, 5, 9], '042': [2, 6, 10], '041': [3, 7, 11] }[n]; if (!el) return '';
    const ps = ch.planets.filter(p => el.includes(signIdx(p.lon))).map(p => p.name); txt = ps.length ? `You have <b>${ps.length}</b> planet${ps.length > 1 ? 's' : ''} in ${c.title} signs: ${ps.join(', ')}.` : `You have no planets in ${c.title} signs.`; }
  if (!txt) return '';
  const wheel = opt.hlSign != null || opt.hlPlanet ? `<div class="ywheel">${window.SSWheel.svg(ch, opt)}</div>` : '';
  return `<div class="you"><div class="yk">✦ In your chart</div><p>${txt}</p>${wheel}</div>`;
}

function hookBox(n) {
  const c = byN[n], h = (S.hooks || {})[n] || '';
  return `<div class="hook"><div class="yk">🧠 Make it stick</div><p>Say it out loud three times: “${esc(c.z)}” <b>${esc(c.m)}</b>.</p>
    <p>Now picture something funny for ${esc(c.title)}. The sillier the better (think: Jupiter as a loud big spender at the casino in a Hawaiian shirt).</p>
    <input id="hookIn" class="inp" maxlength="140" placeholder="My funny picture for ${esc(c.title)}…" value="${esc(h)}" aria-label="Your funny picture for ${esc(c.title)}"></div>`;
}

function renderCard(n) {
  const c = byN[n], l = L[n];
  $('scVid').hidden = false; svid.poster = `../p/${n}.jpg?v=${window.SS_VER||''}`; svid.src = `../deck/${c.file}.mp4?v=${window.SS_VER||''}`; svid.muted = !N.soundOn() || guide.on; svid.play().catch(() => { svid.muted = true; svid.play().catch(() => {}); });
  body.innerHTML = `<div class="kick">${esc(c.sec === 'Misc' ? (isEl(n) ? 'Element' : 'Point') : c.sec === 'Zodiac' ? 'Zodiac sign' : c.sec)} · card ${+n}</div><h2>${esc(c.title)}</h2>
    <div class="zing">“${esc(c.z)}”</div><span class="motto">${esc(c.m)}</span>${has('calm') ? `<p class="plain">In plain words: ${isEl(n) ? `the ${esc(c.title)} signs are ${esc(c.m.split(' · ').map(nice).join(', '))}` : `${esc(c.title)}’s one job is “${esc(nice(c.m))}”`}. The line in quotes is a joke about how ${esc(c.title)} acts. It isn’t mean, it’s a loving roast.</p>` : ''}<div class="facts">${esc(l.f)}</div>
    ${has('memory') ? hookBox(n) : ''}
    ${has('focus') ? `<details class="more"><summary>More about ${esc(c.title)} ›</summary><h3>What it is</h3><p>${esc(l.a)}</p><h3>Use it</h3><p>${esc(l.u)}</p>${youNote(n)}</details>` : `<h3>What it is</h3><p>${esc(l.a)}</p><h3>Use it</h3><p>${esc(l.u)}</p>${youNote(n)}`}`;
  if (has('memory')) { const hi = $('hookIn'); hi.oninput = () => { S.hooks = S.hooks || {}; S.hooks[n] = hi.value.slice(0, 140); save(); }; }
  if (has('calm')) svid.muted = true;
  N.highlight([n]); N.setFx(isEl(n) ? ['trine:' + c.title] : []); N.focusObj(n);
  guide.say(`[SCHOOL] Level ${L_i + 1}, "${COURSE[L_i].title}". Card on screen: ${c.title}. Its zinger is "${c.z}" and its motto is "${c.m}". Facts: ${l.f}. ${l.a} Teach me this card out loud in 2 to 4 short sentences, making the motto the star (say it word for word); mention the zinger once at most, lightly, then ask me one quick question to check I got it.`);
}

function renderMatch(ns) {
  const set = ns.map(n => byN[n]); let left = set.length, selected = null;
  $('scNext').disabled = true;
  body.innerHTML = `<div class="kick">Homework</div><h2>Match the motto</h2><p class="muted" style="margin:6px 0 12px">Tap a motto, then tap its card.</p>
    <div class="mtg">${set.map(c => `<button type="button" class="mt" data-n="${c.n}"><b>${esc(G[c.n])}</b><span>${esc(c.title)}</span><i></i></button>`).join('')}</div>
    <div class="mch">${shuffle(set).map(c => `<button type="button" class="mc" data-n="${c.n}">${esc(c.m)}</button>`).join('')}</div><p class="fb" id="mfb"></p>`;
  N.highlight(ns); N.frame(ns, 1.4);
  body.querySelectorAll('.mc').forEach(b => b.onclick = () => { body.querySelectorAll('.mc').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); selected = b; });
  body.querySelectorAll('.mt').forEach(t => t.onclick = () => {
    if (!selected || t.classList.contains('ok')) return;
    if (selected.dataset.n === t.dataset.n) { t.classList.add('ok'); t.querySelector('i').textContent = byN[t.dataset.n].m; selected.remove(); selected = null; N.burst(t);
      if (--left === 0) { $('mfb').innerHTML = '<b>All matched.</b> Tap Next.'; $('scNext').disabled = false; } }
    else { t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); $('mfb').textContent = 'Not that one. Try again.'; }
  });
  guide.say(`[SCHOOL] Practice time: I'm matching these mottos to their cards on screen: ${set.map(c => `${c.title} (${c.m})`).join(', ')}. Give me one short line of encouragement, don't give the answers.`);
}

function renderQuiz(step) {
  if (has('test')) return renderPractice(step);
  const list = qs(step), need = Math.ceil(list.length * .8); let i = 0, score = 0;
  $('scNext').disabled = true; N.goPreset('wide'); N.highlight(step.ns || []); N.setFx([]);
  guide.say(`[SCHOOL] Quiz time for level ${L_i + 1}${step.final ? ', the final exam' : ''}. ${list.length} questions on screen, I need ${need} right to pass. Hype me up in one sentence. Don't read the questions; I'll answer on screen.`);
  const ask = () => {
    if (i >= list.length) return end();
    const q = list[i], opts = shuffle([q.ok, ...q.no]);
    body.innerHTML = `<div class="kick">${step.final ? 'Final exam' : 'Pop quiz'} · ${i + 1} of ${list.length} · need ${need} to pass</div><h2 class="qh">${esc(q.q)}</h2>
      <div class="choices">${opts.map(o => `<button type="button">${esc(o)}</button>`).join('')}</div><p class="fb" id="qfb"></p>`;
    TTS.readStep();
    body.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
      if (body.querySelector('.choices .ok')) return; const ok = b.textContent === q.ok;
      body.querySelectorAll('.choices button').forEach(x => { if (x.textContent === q.ok) x.classList.add('ok'); });
      if (ok) { score++; N.burst(b); if (q.n) N.markLearned(q.n, true); } else b.classList.add('no');
      const c = q.n && byN[q.n]; $('qfb').innerHTML = (ok ? '<b>Yes.</b> ' : '<b>Nope.</b> ') + (c ? `${esc(c.title)}: “${esc(c.z)}” <span class="astro">${esc(c.m)}</span>` : '');
      i++; setTimeout(ask, ok ? 1100 : 2000);
    });
  };
  const end = () => {
    const pass = score >= need, s = lv(COURSE[L_i].id); s.best = Math.max(s.best || 0, score); save();
    guide.say(`[SCHOOL] I got ${score} out of ${list.length} on the ${step.final ? 'final exam' : `level ${L_i + 1} quiz`}, so I ${pass ? 'passed' : 'did not pass yet (need ' + need + ')'}. React in one or two sentences, in character.`);
    body.innerHTML = `<div style="text-align:center;display:grid;gap:10px;justify-items:center;padding:8px 0"><div class="big">${pass ? '✦' : '☽'}</div>
      <h2>${score} of ${list.length}</h2><p class="muted" style="margin:0">${pass ? (step.final ? 'You passed the final. You’re certified.' : 'Passed. Next level unlocked.') : `You need ${need} to pass. Mercury must be retrograde. Run it back.`}</p>
      <div class="row">${pass ? '' : '<button class="btn sm" id="qAgain" type="button">Try again</button>'}<button class="ghost" id="qRev" type="button">Review the cards</button></div></div>`;
    if (pass) { $('scNext').disabled = false; N.burst($('scNext')); } else $('qAgain').onclick = () => renderQuiz(step);
    $('qRev').onclick = () => { st = Math.max(0, COURSE[L_i].steps.findIndex(x => x.t === 'card')); renderStep(); };
  };
  ask();
}

// no-fail practice round: unlimited tries, hints, always finishes
function renderPractice(step) {
  const list = qs(step); let i = 0, first = 0;
  $('scNext').disabled = true; N.goPreset('wide'); N.highlight(step.ns || []); N.setFx([]);
  guide.say(`[SCHOOL] Practice round for level ${L_i + 1}. ${list.length} questions on screen, unlimited tries, hints allowed, nothing to fail. Say one calm, warm sentence. Don't read the questions.`);
  const ask = () => {
    if (i >= list.length) return end();
    const q = list[i], opts = shuffle([q.ok, ...q.no]); let tries = 0;
    body.innerHTML = `<div class="kick">Practice · ${i + 1} of ${list.length} · no timer, no failing</div><h2 class="qh">${esc(q.q)}</h2>
      <div class="choices">${opts.map(o => `<button type="button">${esc(o)}</button>`).join('')}</div>
      <div class="row" style="justify-content:flex-start;margin-top:10px"><button class="ghost" id="qHint" type="button">💡 Hint</button></div><p class="fb" id="qfb"></p>`;
    $('qHint').onclick = () => { const wrong = [...body.querySelectorAll('.choices button')].filter(x => x.textContent !== q.ok && !x.disabled); shuffle(wrong).slice(0, Math.max(0, wrong.length - 1)).forEach(x => { x.disabled = true; x.style.opacity = .3; }); $('qHint').disabled = true; $('qfb').textContent = 'Two left. You’ve got this.'; TTS.read(['Two left. You’ve got this.']); };
    body.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
      if (body.querySelector('.choices .ok') || b.disabled) return; tries++;
      if (b.textContent === q.ok) { b.classList.add('ok'); if (tries === 1) first++; N.burst(b); if (q.n) N.markLearned(q.n, true);
        const c = q.n && byN[q.n], h = c && (S.hooks || {})[c.n]; $('qfb').innerHTML = '<b>Yes.</b> ' + (c ? `${esc(c.title)}: “${esc(c.z)}” <span class="astro">${esc(c.m)}</span>${h ? ` · ${esc(h)}` : ''}` : '');
        i++; setTimeout(ask, 1500); }
      else { b.classList.add('no'); b.disabled = true; $('qfb').textContent = 'Not that one. Take your time and try another.'; TTS.read(['Not that one. Try another.']); }
    });
    TTS.readStep();
  };
  const end = () => {
    const s = lv(COURSE[L_i].id); s.best = Math.max(s.best || 0, list.length); save();
    guide.say(`[SCHOOL] I finished the practice round for level ${L_i + 1}. ${first} of ${list.length} right on the first try. Celebrate me warmly in one sentence, no talk of passing or failing.`);
    body.innerHTML = `<div style="text-align:center;display:grid;gap:10px;justify-items:center;padding:8px 0"><div class="big">✦</div>
      <h2>Practice done</h2><p class="muted" style="margin:0">${first} of ${list.length} on the first try. Every try counts. ${step.final ? 'You’re certified.' : 'Next class unlocked.'}</p>
      <div class="row"><button class="ghost" id="qAgain" type="button">Practice again</button><button class="ghost" id="qRev" type="button">Review the cards</button></div></div>`;
    $('scNext').disabled = false; N.burst($('scNext')); TTS.readStep();
    $('qAgain').onclick = () => renderPractice(step);
    $('qRev').onclick = () => { st = Math.max(0, COURSE[L_i].steps.findIndex(x => x.t === 'card')); renderStep(); };
  };
  ask();
}

function renderBuild() {
  let rolled = false; $('scNext').disabled = true;
  body.innerHTML = `<div class="kick">Your turn</div><h2>Build a reading</h2><p class="muted" style="margin:6px 0 10px">Roll a planet, a sign and a house, and read the mottos as one sentence. Roll at least once.</p>
    <div id="sbr" class="reading"></div><div class="row" style="margin-top:12px"><button class="btn sm" id="sbRoll" type="button">🎲 Roll a chart</button></div>`;
  $('sbRoll').onclick = () => {
    const P = pick(C.filter(c => c.sec === 'Planet')), Sg = pick(C.filter(c => c.sec === 'Zodiac')), H = pick(C.filter(c => c.sec === 'House'));
    $('sbr').innerHTML = `<div class="eq">${esc(P.title)} in ${esc(Sg.title)} in the ${houseOrd(H.n)} House</div><div class="mm"><em>${nice(P.m)}</em> + <em>${nice(Sg.m)}</em> + <em>${nice(H.m)}</em></div>
      <div>${esc(B.what[P.n])} ${esc(B.how[Sg.n])} ${esc(B.where[H.n])}.</div>`;
    N.highlight([P.n, Sg.n, H.n]); N.setLink([P.n, Sg.n, H.n]); N.setFx(['link']); N.frame([P.n, Sg.n, H.n], 1.2);
    if (!rolled) { rolled = true; $('scNext').disabled = false; }
    guide.say(`[SCHOOL] I rolled ${P.title} in ${Sg.title} in the ${houseOrd(H.n)} House. Read it for me out loud in 2 or 3 sentences by chaining the mottos ${P.m}, ${Sg.m}, ${H.m} word for word. Mottos only, no zingers. Make it funny and real.`);
  };
}

function renderDecode() {
  const list = shuffle(D).slice(0, 4); let i = 0, score = 0; $('scNext').disabled = true;
  const ask = () => {
    if (i >= list.length) { body.innerHTML = `<div style="text-align:center;display:grid;gap:10px;justify-items:center"><div class="big">⊗</div><h2>${score} of ${list.length}</h2><p class="muted" style="margin:0">You just read real placements. That’s chart reading.</p></div>`; $('scNext').disabled = false; return; }
    const d = list[i], P = byN[d.p], Sg = byN[d.s], H = byN[d.h], opts = shuffle([d.ok, ...d.no]);
    body.innerHTML = `<div class="kick">Decode ${i + 1} of ${list.length}</div><h2 class="qh">${esc(P.title)} in ${esc(Sg.title)} in the ${houseOrd(d.h)} House</h2>
      <div class="muted" style="margin:-4px 0 10px">${nice(P.m)} + ${nice(Sg.m)} + ${nice(H.m)}</div><div class="choices">${opts.map(o => `<button type="button">${esc(o)}</button>`).join('')}</div><p class="fb" id="dfb"></p>`;
    N.highlight([d.p, d.s, d.h]); N.setLink([d.p, d.s, d.h]); N.setFx(['link']);
    body.querySelectorAll('.choices button').forEach(b => b.onclick = () => {
      if (body.querySelector('.choices .ok')) return; const ok = b.textContent === d.ok;
      body.querySelectorAll('.choices button').forEach(x => { if (x.textContent === d.ok) x.classList.add('ok'); }); if (!ok) b.classList.add('no'); else { score++; N.burst(b); }
      i++; setTimeout(ask, 1600);
    });
  };
  guide.say('[SCHOOL] Decode practice: I am reading four real placements on screen and picking what each means. One short line of hype, no answers.');
  ask();
}

function renderCert() {
  const done = COURSE.slice(0, -1).every(l => S.lv[l.id]?.done) && (S.lv.L12?.best || 0) >= 10;
  if (!done) { body.innerHTML = '<h2>Almost there</h2><p class="muted">Finish every level and pass the final exam to get your certificate.</p>'; return; }
  $('scNext').textContent = 'Finish ✦';
  body.innerHTML = `<div class="kick">You did it</div><h2>Get your certificate</h2><p class="muted" style="margin:6px 0 10px">Type your name the way you want it on the certificate.</p>
    <input id="cName" class="inp" placeholder="Your name" value="${esc(S.name || '')}" maxlength="40" autocomplete="name">
    <div class="row" style="margin-top:12px"><button class="btn sm" id="cMake" type="button">Make my certificate ✦</button></div><div id="cOut" style="margin-top:12px"></div>`;
  $('cMake').onclick = async () => {
    S.name = $('cName').value.trim() || 'A Stars & Shade astrologer'; save();
    const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; const x = cv.getContext('2d');
    const g = x.createRadialGradient(540, 420, 60, 540, 600, 900); g.addColorStop(0, '#5a1650'); g.addColorStop(.55, '#1d0b33'); g.addColorStop(1, '#07050d');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
    for (let k = 0; k < 260; k++) { x.globalAlpha = Math.random() * .7; x.fillStyle = '#fff'; x.beginPath(); x.arc(Math.random() * 1080, Math.random() * 1350, Math.random() * 1.8, 0, 6.28); x.fill(); }
    x.globalAlpha = 1; x.strokeStyle = '#f2c466'; x.lineWidth = 4; x.strokeRect(50, 50, 980, 1250); x.strokeStyle = 'rgba(242,196,102,.4)'; x.lineWidth = 2; x.strokeRect(70, 70, 940, 1210);
    const logo = new Image(); logo.src = '../img/logo.png'; await new Promise(r => { logo.onload = r; logo.onerror = r; });
    if (logo.width) x.drawImage(logo, 240, 130, 600, 600 * logo.height / logo.width);
    x.textAlign = 'center'; x.fillStyle = '#c2b3d6'; x.font = '600 34px Figtree, sans-serif'; x.fillText('THE SHADE SCHOOL', 540, 520);
    x.fillStyle = '#f6eefb'; x.font = '500 40px Figtree, sans-serif'; x.fillText('This certifies that', 540, 640);
    x.fillStyle = '#f2c466'; x.shadowColor = 'rgba(242,196,102,.6)'; x.shadowBlur = 24; let fs = 92; x.font = `700 ${fs}px Comfortaa, sans-serif`;
    while (x.measureText(S.name).width > 900 && fs > 40) { fs -= 4; x.font = `700 ${fs}px Comfortaa, sans-serif`; } x.fillText(S.name, 540, 770); x.shadowBlur = 0;
    x.fillStyle = '#f6eefb'; x.font = '500 40px Figtree, sans-serif'; x.fillText('learned all 44 cards of the', 540, 880); x.fillText('Stars & Shade astrology deck.', 540, 935);
    x.fillStyle = '#ff5fb0'; x.font = '700 44px Astro, sans-serif'; x.fillText('♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓', 540, 1060);
    x.fillStyle = '#c2b3d6'; x.font = '500 30px Figtree, sans-serif'; x.fillText(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), 540, 1170);
    x.fillText('Not dramatic, just certified.', 540, 1220);
    cv.toBlob(blob => {
      const url = URL.createObjectURL(blob), file = new File([blob], 'stars-and-shade-certificate.png', { type: 'image/png' });
      $('cOut').innerHTML = `<img src="${url}" alt="Your Stars & Shade certificate" style="width:100%;border-radius:16px;border:1px solid var(--line)"><div class="row" style="margin-top:10px"><a class="btn sm" href="${url}" download="stars-and-shade-certificate.png">Save it</a>${navigator.canShare && navigator.canShare({ files: [file] }) ? '<button class="ghost" id="cShare" type="button">Share</button>' : ''}</div>`;
      const sh = $('cShare'); if (sh) sh.onclick = () => navigator.share({ files: [file], title: 'Certified by The Shade School' }).catch(() => {});
      N.burst($('cOut'));
    }, 'image/png');
  };
}

$('ttsBtn').onclick = () => { TTS.on = !TTS.on; try { localStorage.setItem('ss-tts', TTS.on ? '1' : '0'); } catch (e) {} head(); TTS.on ? TTS.readStep() : TTS.stop(); };
try { TTS.on = localStorage.getItem('ss-tts') !== '0'; } catch (e) {}
svid.onclick = () => { svid.muted = !svid.muted; N.toast(svid.muted ? 'Sound off' : '♪ Sound on', 1000); };
$('scBack').onclick = () => go(-1);
$('scNext').onclick = () => go(1);
$('scMapBtn').onclick = renderMap;

// ---------------------------------------------------------------- the Oracle as your teacher (voice)
const AGENT = 'agent_8901m69xdcabeqet6b778kyp70mh';
const guide = {
  on: false, conv: null, lastPrompt: '',
  load() { if (window.ElevenLabsClient || this._loading) return this._loading; this._loading = new Promise((ok, no) => { const s = document.createElement('script'); s.src = '../vendor/elevenlabs/client-1.32.1.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); return this._loading; },
  async start(preferWs) {
    TTS.stop(); this.connecting = true; this.setUI('Connecting… wait for the chime');
    try {
      await this.load();
      try { if (navigator.audioSession) navigator.audioSession.type = 'auto'; } catch (e) {}
      const C2 = window.ElevenLabsClient.Conversation, base = {
        libsampleratePath: new URL('../vendor/elevenlabs/libsamplerate-2.1.2.worklet.js', location.href).href,
        onMessage: m => { if ((m.role || m.source) !== 'user') $('gCap').textContent = m.message.replace(/\[[^\]]{1,30}\]\s*/g, ''); },
        onModeChange: ({ mode }) => { this.setUI(mode === 'speaking' ? 'She’s teaching…' : '✦ Your turn. Talk back anytime'); document.body.classList.toggle('speaking', mode === 'speaking'); document.body.classList.toggle('listening', mode !== 'speaking'); },
        onDisconnect: () => { if (!this.on || this.stopping) return;
          const quick = Date.now() - (this.at || 0) < 6000; this.on = false; this.conv = null; window.__oracleLive = false;
          this.retries = (this.retries || 0) + 1;
          if (this.retries <= 4) { this.setUI('Reconnecting… one sec'); this.start(quick || this.via === 'ws'); }   // keep class going: session cap or a dropped line
          else { this.paint(true); this.setUI('Voice dropped. Tap to turn voice lessons back on.'); } },
        onError: () => {},
        clientTools: { make_birth_chart: async p => { const r = await window.SSMaker.fromTool(p); if (r.ok) N.toast && N.toast('✦ Your chart is saved', 2400); return r.text; },
          remember: async p => window.SSAcct ? window.SSAcct.remember(p && p.note) : 'Not saved.',
          get_sky: async p => { try { return window.SSSky.text({ date: p && p.date || undefined, days: p && p.days_ahead }); } catch (e) { return 'Sky data unavailable right now.'; } } }
      };
      let attempt = 0;
      const tryOne = type => { const id = ++attempt; let dead = false;
        const o = Object.assign({}, base, { agentId: AGENT, connectionType: type,
          onDisconnect: () => { if (id === attempt && !dead) base.onDisconnect(); },
          onMessage: m => { if (id === attempt) base.onMessage(m); }, onModeChange: x => { if (id === attempt) base.onModeChange(x); } });
        const go = C2.startSession(o).then(c => { if (dead) { c.endSession().catch(() => {}); throw new Error('late'); } return c; });
        return Promise.race([go, new Promise((_, no) => setTimeout(() => { dead = true; no(new Error('timeout')); }, type === 'websocket' ? 90000 : 7000))]); };
      if (preferWs) { this.conv = await tryOne('websocket'); this.via = 'ws'; }
      else { try { this.conv = await tryOne('webrtc'); this.via = 'rtc'; } catch (e) { this.conv = await tryOne('websocket'); this.via = 'ws'; } }   // call-style first (no crackle), plain stream as backup
      this.at = Date.now(); setTimeout(() => { if (this.conv) this.retries = 0; }, 20000);
      this.connecting = false; this.on = true; window.__oracleLive = true; this.chime(); N.bedLevel(); svid.muted = true; this.paint();
      if (this.lastPrompt) this.conv.sendUserMessage(this.lastPrompt);
    } catch (e) { this.connecting = false; this.on = false; this.conv = null; const mic = e && /NotAllowed|Permission|denied|NotFound/i.test((e.name || '') + ' ' + (e.message || e)), why = String(e && e.closeReason || '') + ' ' + String(e && (e.message || e)), out = /quota|credit|exceeds your/i.test(why), busy = !out && e && /limit|concurren|capacity|busy|too many|429/i.test(why); this.setUI(out ? 'Skye’s used up her talk-time for now. Let Justin know so he can top her up. You can keep going on your own.' : busy ? 'Skye’s teaching a full house right now. Keep going on your own and tap voice lessons again in a minute.' : mic ? 'Skye can’t hear you yet. Allow the microphone, then tap voice lessons again, or keep going on your own.' : 'Skye couldn’t connect just now. Tap voice lessons to try again, or keep going on your own.'); this.paint(true); }
  },
  async stop() { const c = this.conv; this.stopping = true; setTimeout(() => { this.stopping = false; }, 1500); this.retries = 0; this.on = false; this.conv = null; window.__oracleLive = false; N.bedLevel(); this.paint(); if (c) { try { await c.endSession(); } catch (e) {} } },
  readChart(s) { const t = window.SSMaker.text(s); if (!t) return;
    if (this.on && this.conv) { try { this.conv.sendUserMessage(t); } catch (e) {} } else location.href = '../oracle/?chart=1'; },
  say(text) { if (/^\[SCHOOL\]/.test(text)) text += wayNote(); this.lastPrompt = text; if (this.on && this.conv) { try { this.conv.sendUserMessage(text); } catch (e) {} } },
  chime() { try { const c = this.ctx; if (!c) return; const t = c.currentTime;
    [[784, 0], [1175, .12]].forEach(([f, d]) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, t + d);
      g.gain.linearRampToValueAtTime(.16, t + d + .02); g.gain.exponentialRampToValueAtTime(.001, t + d + .5); o.connect(g); g.connect(c.destination); o.start(t + d); o.stop(t + d + .55); }); } catch (e) {} },
  setUI(t) { $('gStat').textContent = t || ''; },
  paint(keepMsg) { $('gBtn').setAttribute('aria-pressed', this.on); $('gBtn').innerHTML = this.on ? '🎙 Voice lessons: on · tap to stop' : '🎙 Turn on voice lessons'; if (!this.on) document.body.classList.remove('speaking', 'listening');
    $('guideBox').classList.toggle('on', this.on); if (!this.on && !keepMsg) { this.setUI(''); $('gCap').textContent = ''; } }
};
$('gBtn').onclick = () => { try { guide.ctx = guide.ctx || new (window.AudioContext || window.webkitAudioContext)(); guide.ctx.resume(); } catch (e) {}
  if (guide.connecting) { guide.setUI('Hang on, she’s almost here… wait for the chime'); return; } guide.on ? guide.stop() : guide.start(); };
// preload her code as soon as the School opens, so the tap that turns her on can start audio right away (iPhone rule)
const preload = () => guide.load().catch(() => {});

window.__school = { show: () => { preload(); show(); }, leave };
if (!window.__nebula) { preload(); show(); }   // standalone classroom page
