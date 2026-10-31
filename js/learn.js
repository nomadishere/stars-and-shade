// Stars & Shade — Learn section: card guide, flashcards, quiz, worksheet.
(() => {
  const C = window.CARDS, L = window.LEARN, D = window.DECODE;
  const PAID = !!document.getElementById('flash');   // free page: summaries only
  const byN = Object.fromEntries(C.map(c => [c.n, c]));
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const motto = c => c.m;   // Mom's words, verbatim
  const isElement = c => ['041', '042', '043', '044'].includes(c.n);
  const SEC = { Zodiac: 'Zodiac Signs', Planet: 'Planets', House: 'Houses', Misc: 'Points, Nodes & Elements' };
  const store = { get(k, d) { try { const v = localStorage.getItem('ss-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
                  set(k, v) { try { localStorage.setItem('ss-' + k, JSON.stringify(v)); } catch (e) {} } };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickOthers = (pool, not, k) => shuffle(pool.filter(x => x !== not)).slice(0, k);

  // ---------- card guide ----------
  const guide = document.getElementById('guide');
  for (const key of Object.keys(SEC)) {
    const d = document.createElement('details'); d.className = 'gsec'; if (key === 'Zodiac') d.open = true;
    const list = C.filter(c => c.sec === key);
    d.innerHTML = `<summary><span>${SEC[key]}</span><small>${list.length} cards</small></summary><div class="glist"></div>`;
    const g = d.querySelector('.glist');
    for (const c of list) {
      const x = L[c.n];
      const el = document.createElement('article'); el.className = 'gcard';
      el.innerHTML = `<button class="gplay" type="button" aria-label="Play ${esc(c.title)}"><img src="p/${c.n}.jpg" alt="" loading="lazy" width="540" height="960"></button>
        <div class="gtext"><h4>${esc(c.title)} <small>${c.n}</small></h4>
        <p class="gz">“${esc(c.z)}”</p><p class="gm">${esc(motto(c))}</p>
        <p class="gf">${esc(x.f)}</p><p>${esc(x.a)}</p>${PAID ? `<p class="gu"><b>Use it:</b> ${esc(x.u)}</p>` : ''}</div>`;
      el.querySelector('.gplay').onclick = () => window.openCard(C.indexOf(c));
      g.appendChild(el);
    }
    guide.appendChild(d);
  }

  if (!PAID) return;
  // ---------- flashcards ----------
  const fc = { deck: [], i: 0, flipped: false, mode: 'name' };
  const fcCard = document.getElementById('fcCard'), fcFront = document.getElementById('fcFront'), fcBack = document.getElementById('fcBack'),
        fcCount = document.getElementById('fcCount'), fcSec = document.getElementById('fcSec'), fcMode = document.getElementById('fcMode');
  function fcBuild() {
    const s = fcSec.value; fc.deck = shuffle(C.filter(c => s === 'all' || c.sec === s)); fc.i = 0; fc.known = 0; fcShow();
  }
  function fcShow() {
    const c = fc.deck[fc.i]; fc.flipped = false; fcCard.classList.remove('flip'); fcCard.setAttribute('aria-pressed', 'false');
    if (!c) { fcFront.innerHTML = `<div class="fcdone">Deck cleared. You ate that.</div><button class="btn sm" type="button" id="fcAgain">Shuffle again</button>`;
      fcBack.innerHTML = ''; fcCount.textContent = `${fc.deck.length} / ${fc.deck.length}`;
      document.getElementById('fcAgain').onclick = e => { e.stopPropagation(); fcBuild(); }; return; }
    const front = fc.mode === 'name'
      ? `<div class="fck">${SEC[c.sec]}</div><div class="fct">${esc(c.title)}</div><div class="fch">What's the motto?</div>`
      : `<div class="fck">Who said it?</div><div class="fcz">“${esc(c.z)}”</div>`;
    fcFront.innerHTML = front;
    fcBack.innerHTML = `<div class="fct">${esc(c.title)}</div><div class="fcz">“${esc(c.z)}”</div><div class="fcm">${esc(motto(c))}</div><div class="fcu">${esc(L[c.n].u)}</div>`;
    fcCount.textContent = `${fc.i + 1} / ${fc.deck.length}`;
  }
  fcCard.onclick = () => { if (!fc.deck[fc.i]) return; fc.flipped = !fc.flipped; fcCard.classList.toggle('flip', fc.flipped); fcCard.setAttribute('aria-pressed', String(fc.flipped)); };
  document.getElementById('fcGot').onclick = () => { if (fc.deck[fc.i]) { fc.i++; fcShow(); } };
  document.getElementById('fcRedo').onclick = () => { const c = fc.deck[fc.i]; if (!c) return; fc.deck.splice(fc.i, 1); fc.deck.push(c); fcShow(); };
  fcSec.onchange = fcBuild; fcMode.onchange = () => { fc.mode = fcMode.value; fcShow(); };
  fcBuild();

  // ---------- quiz ----------
  const SIGNS = C.filter(c => c.sec === 'Zodiac');
  const qTypes = {
    motto() { const c = shuffle(C.filter(x => !isElement(x)))[0];
      const opts = shuffle([c, ...pickOthers(C.filter(x => !isElement(x) && x.m !== c.m), c, 3)]);
      return { q: `What's the motto for <b>${esc(c.title)}</b>?`, opts: opts.map(o => esc(o.m)), ok: opts.indexOf(c), why: `${c.title}: “${c.z}” · ${c.m}` }; },
    zinger() { const c = shuffle(C)[0];
      const opts = shuffle([c, ...pickOthers(C, c, 3)]);
      return { q: `Who says <b>“${esc(c.z)}”</b>?`, opts: opts.map(o => esc(o.title)), ok: opts.indexOf(c), why: `That's ${c.title}. ${L[c.n].a}` }; },
    reverse() { const c = shuffle(C.filter(x => !isElement(x)))[0];
      const opts = shuffle([c, ...pickOthers(C.filter(x => !isElement(x) && x.m !== c.m && x.sec === c.sec), c, 3)]);
      return { q: `Which card's motto is <b>${esc(c.m)}</b>?`, opts: opts.map(o => esc(o.title)), ok: opts.indexOf(c), why: `${c.title} · ${c.m}. ${L[c.n].u}` }; },
    element() { const c = shuffle(SIGNS)[0], E = ['Fire', 'Earth', 'Air', 'Water'];
      return { q: `Which element is <b>${esc(c.title)}</b>?`, opts: E, ok: E.indexOf(L[c.n].el), why: `${c.title} is ${L[c.n].el}. ${L[c.n].f}` }; },
    decode() { const d = shuffle(D)[0], p = byN[d.p], s = byN[d.s], h = byN[d.h];
      const opts = shuffle([d.ok, ...d.no]);
      return { q: `Decode it with the mottos: <b>${esc(p.title)}</b> (${esc(p.m.toLowerCase())}) in <b>${esc(s.title)}</b> (${esc(s.m.toLowerCase())}) in the <b>${esc(h.title.toLowerCase())}</b> (${esc(h.m.toLowerCase())}). What's the vibe?`,
        opts: opts.map(esc), ok: opts.indexOf(d.ok), why: `${p.m} (planet = what) + ${s.m} (sign = how) + ${h.m} (house = where) = ${d.ok.toLowerCase()}.` }; }
  };
  const quiz = { n: 0, score: 0, q: null, done: false, total: 10 };
  const qBox = document.getElementById('qBox'), qMeta = document.getElementById('qMeta');
  function qNew() { quiz.n = 0; quiz.score = 0; qNext(); }
  function qNext() {
    if (quiz.n >= quiz.total) return qEnd();
    const order = ['motto', 'zinger', 'reverse', 'element', 'decode', 'motto', 'zinger', 'reverse', 'decode', 'motto'];
    quiz.q = qTypes[order[quiz.n]](); quiz.answered = false; quiz.n++;
    qMeta.textContent = `Question ${quiz.n} of ${quiz.total} · Score ${quiz.score}`;
    qBox.innerHTML = `<p class="qq">${quiz.q.q}</p><div class="qopts">${quiz.q.opts.map((o, i) => `<button type="button" class="qopt" data-i="${i}">${o}</button>`).join('')}</div><p class="qwhy" aria-live="polite"></p>`;
    qBox.querySelectorAll('.qopt').forEach(b => b.onclick = () => qAnswer(+b.dataset.i));
  }
  function qAnswer(i) {
    if (quiz.answered) return; quiz.answered = true;
    const right = i === quiz.q.ok; if (right) quiz.score++;
    qBox.querySelectorAll('.qopt').forEach((b, j) => { b.disabled = true; if (j === quiz.q.ok) b.classList.add('ok'); else if (j === i) b.classList.add('no'); });
    const lines = right ? ['Correct. Aura points +100.', 'Yes! Main character behavior.', 'Correct. No notes.', 'Nailed it.'] : ['Not quite. Character development incoming.', 'Close, but no.', 'Nope. Read the explanation and try again.'];
    qBox.querySelector('.qwhy').innerHTML = `<b>${lines[Math.floor(Math.random() * lines.length)]}</b> ${esc(quiz.q.why)}`;
    qMeta.textContent = `Question ${quiz.n} of ${quiz.total} · Score ${quiz.score}`;
    const nx = document.createElement('button'); nx.type = 'button'; nx.className = 'btn sm'; nx.textContent = quiz.n >= quiz.total ? 'See my score' : 'Next question';
    nx.onclick = qNext; qBox.appendChild(nx); nx.focus();
  }
  function qEnd() {
    const best = Math.max(store.get('best', 0), quiz.score); store.set('best', best);
    const verdict = quiz.score >= 9 ? 'Astrologer era unlocked. You could teach this.' : quiz.score >= 7 ? 'Solid. A couple more rounds and it lives in your head rent free.' : quiz.score >= 4 ? 'Getting there. Run the flashcards, then come back.' : 'Lowkey rough, but every expert started here. Flashcards, then rematch.';
    qMeta.textContent = `Final score ${quiz.score} / ${quiz.total} · Best ${best}`;
    qBox.innerHTML = `<p class="qq">${quiz.score} / ${quiz.total}</p><p>${verdict}</p>`;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm'; b.textContent = 'New quiz'; b.onclick = qNew; qBox.appendChild(b);
  }
  document.getElementById('qStart').onclick = () => { document.getElementById('qStart').remove(); qNew(); };
  qMeta.textContent = store.get('best', null) != null ? `Your best so far: ${store.get('best', 0)} / 10` : '10 questions · about 3 minutes';

  // ---------- worksheet ----------
  const wsSec = document.getElementById('wsSec'), wsList = document.getElementById('wsList'), wsScore = document.getElementById('wsScore');
  const norm = s => s.toLowerCase().replace(/[^a-z]/g, '').replace(/^i/, '');
  function wsBuild() {
    const list = C.filter(c => c.sec === wsSec.value && !isElement(c));
    const els = C.filter(c => c.sec === wsSec.value && isElement(c));
    wsScore.textContent = '';
    wsList.innerHTML = list.map(c => `<li><label for="ws-${c.n}"><b>${esc(c.title)}</b> <span>“${esc(c.z)}”</span></label>
      <div class="wsin"><span>I</span><input id="ws-${c.n}" data-n="${c.n}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="____"><em></em></div></li>`).join('')
      + els.map(c => `<li><label for="ws-${c.n}"><b>${esc(c.title)}</b> <span>“${esc(c.z)}”</span> · name the three signs</label>
      <div class="wsin"><input id="ws-${c.n}" data-n="${c.n}" data-el="1" autocomplete="off" spellcheck="false" placeholder="sign, sign, sign"><em></em></div></li>`).join('');
  }
  document.getElementById('wsCheck').onclick = () => {
    let ok = 0, n = 0;
    wsList.querySelectorAll('input').forEach(inp => {
      const c = byN[inp.dataset.n], out = inp.parentElement.querySelector('em'); n++;
      let right;
      if (inp.dataset.el) { const want = c.m.toLowerCase().split('·').map(s => s.trim()); const got = inp.value.toLowerCase(); right = want.every(w => got.includes(w)); }
      else right = norm(inp.value) === norm(c.m);
      if (right) ok++;
      inp.classList.toggle('ok', right); inp.classList.toggle('no', !right && inp.value.trim() !== '');
      out.textContent = right ? '✓' : (inp.value.trim() ? c.m : '');
    });
    wsScore.textContent = `${ok} / ${n} correct` + (ok === n ? ' · flawless, honestly iconic' : '');
  };
  document.getElementById('wsReveal').onclick = () => wsList.querySelectorAll('input').forEach(inp => { const c = byN[inp.dataset.n];
    inp.parentElement.querySelector('em').textContent = c.m; });
  document.getElementById('wsClear').onclick = wsBuild;
  document.getElementById('wsPrint').onclick = () => { try { window.print(); } catch (e) {} };
  wsSec.onchange = wsBuild; wsBuild();
})();
