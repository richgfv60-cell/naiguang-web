/* ==========================================================================
   游戏型小应用（实操 2）
   模式：ball 解忧魔法球 · fortune 今日运势 · quiz 性格测试（难度 下）
        match 翻牌配对 · whack 打地鼠 · reaction 反应速度（难度 中）
        catch 接掉落物（难度 上：移动 → 道具 → 障碍 → 开始/结束 → 声音/暂停）
   ========================================================================== */
(function () {
  const { c, cfg, L, t, esc, load, save, dayKey, face, react, say, toast, sfx, pick } = NG;
  const G = cfg.game;
  const mode = cfg.appB.mode;
  const main = NG.shell({ mute: ['catch', 'whack', 'match', 'reaction', 'hop'].includes(mode), small: true });
  const data = load();
  const T = (zh, ko) => [zh, ko];
  const style = document.createElement('style');
  style.textContent = `
    .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;perspective:800px}
    .mc{aspect-ratio:3/4;position:relative;transform-style:preserve-3d;transition:transform .35s;border-radius:14px}
    .mc.is-up,.mc.is-ok{transform:rotateY(180deg)}
    .mc__f,.mc__b{position:absolute;inset:0;border-radius:14px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;align-items:center;justify-content:center}
    .mc__b{background:var(--deep);color:#fff;font-size:22px;font-weight:800;opacity:.9}
    .mc__f{background:#fff;transform:rotateY(180deg);box-shadow:inset 0 0 0 2px var(--line)}
    .mc__f img{width:86%;height:86%;object-fit:contain}
    .mc.is-ok .mc__f{box-shadow:inset 0 0 0 3px var(--deep)}
    .holes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px}
    .hole{aspect-ratio:1;border-radius:50%;background:radial-gradient(ellipse at 50% 70%,#8B6A55 0 45%,#B89880 46% 60%,transparent 61%);position:relative;overflow:hidden}
    .hole__who{position:absolute;left:10%;right:10%;bottom:12%;height:80%;display:flex;align-items:flex-end;justify-content:center;transform:translateY(110%);transition:transform .16s ease-out;font-size:46px}
    .hole__who img{max-height:100%;width:auto}
    .hole.is-up .hole__who{transform:none}
    .hole__fx{position:absolute;top:4px;left:0;right:0;text-align:center;font-weight:800;color:var(--deep);pointer-events:none}
    .player{position:absolute;bottom:2%;width:80px;height:80px;left:0;will-change:transform;display:flex;align-items:flex-end;justify-content:center}
    .player img{max-height:100%;width:auto}
    .player.is-frozen img{filter:grayscale(.8) brightness(1.1)}
    .player::after{content:"";position:absolute;bottom:-4px;left:6px;right:6px;height:12px;border-radius:50%;background:rgba(0,0,0,.08);z-index:-1}
    .cushion{position:absolute;left:-8px;right:-8px;bottom:-6px;height:16px;border-radius:12px;background:#E9C9A7;box-shadow:inset 0 -3px 0 rgba(0,0,0,.08)}
    .drop{position:absolute;top:0;left:0;width:44px;height:44px;font-size:34px;display:flex;align-items:center;justify-content:center;will-change:transform;pointer-events:none}
    .drop img{width:100%;height:100%;object-fit:contain}
    .lives{letter-spacing:2px}
    .rx{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;height:100%;cursor:pointer}
    .rx img{width:58%;max-width:230px}
    .rx__msg{font-size:26px;font-weight:800;color:var(--deep)}
    .ticks{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
    .ticks span{min-width:56px;padding:4px 8px;border-radius:10px;background:var(--bg);font-size:13px;text-align:center}
    .fcard{width:220px;height:300px;margin:6px auto;perspective:900px;cursor:pointer}
    .fcard__in{position:relative;width:100%;height:100%;transition:transform .6s;transform-style:preserve-3d}
    .fcard.is-open .fcard__in{transform:rotateY(180deg)}
    .fcard__s{position:absolute;inset:0;border-radius:22px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;gap:10px}
    .fcard__back{background:var(--deep);color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.12)}
    .fcard__back img{width:120px}
    .fcard__front{background:#fff;transform:rotateY(180deg);box-shadow:0 10px 30px rgba(0,0,0,.1),inset 0 0 0 3px var(--tint)}
    .fcard__type{font-size:30px;font-weight:800;color:var(--deep)}
    .opt{display:flex;flex-direction:column;gap:10px}
    .opt .btn{justify-content:flex-start;text-align:left;font-weight:600;min-height:56px;padding:10px 18px;line-height:1.35}
    .progress{height:6px;border-radius:3px;background:var(--line);overflow:hidden}
    .progress i{display:block;height:100%;background:var(--deep);transition:width .3s}
    .result img{width:150px;margin:0 auto}
  `;
  document.head.appendChild(style);

  const endLine = (score, hi, mid) => pick(score >= hi ? G.end.high : score >= mid ? G.end.mid : G.end.low);
  const endFace = (score, hi, mid) => score >= hi ? 'proud' : score >= mid ? 'happy' : 'sad';

  /* ===================================================== ball 解忧魔法球 */
  function ball() {
    data.count = data.count || 0;
    let busy = false;
    main.innerHTML = `
      <div class="card">
        <textarea class="input" id="q" maxlength="80" placeholder="${esc(t(G.prompt))}" data-ph-zh="${esc(G.prompt[0])}" data-ph-ko="${esc(G.prompt[1])}"></textarea>
        <button class="btn btn--main btn--wide btn--xl" id="go" style="margin-top:12px">🤍 ${L(T('抱一抱抱枕', '쿠션 꼭 안기'))}</button>
        <p class="muted center" style="margin-top:10px" id="cnt">${L(T(`已经倾诉过 ${data.count} 次`, `${data.count}번 털어놨어`))}</p>
      </div>
      <p class="muted center">${L(G.note)}</p>`;
    say(T('把烦恼写下来，再抱一下抱枕。', '고민을 적고, 쿠션을 꼭 안아 봐.'), 'love');
    main.querySelector('#go').addEventListener('click', () => {
      if (busy) return;
      const q = main.querySelector('#q');
      if (!q.value.trim()) { toast(T('写一点点也可以', '조금만 적어도 돼')); q.focus(); return; }
      busy = true; say(T('嗯……让我想一想', '음… 생각해 볼게'), 'love', 'shake');
      setTimeout(() => {
        data.count += 1; save(data); busy = false;
        main.querySelector('#cnt').innerHTML = L(T(`已经倾诉过 ${data.count} 次`, `${data.count}번 털어놨어`));
        say(pick(G.answers), 'happy', 'bounce'); NG.celebrate(); q.value = '';
      }, 1300);
    });
  }

  /* ===================================================== fortune 今日签 */
  function fortune() {
    const today = dayKey();
    let h = 0; for (const ch of today + c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const idx = h % G.fortunes.length;
    const opened = data.day === today;
    const f = G.fortunes[idx];
    main.innerHTML = `
      <div class="fcard ${opened ? 'is-open' : ''}" id="fc" role="button" aria-label="翻开 / 뒤집기">
        <div class="fcard__in">
          <div class="fcard__s fcard__back"><img src="${face('love')}" alt=""><b>${L(T('点一下，抽今天的签', '눌러서 오늘의 쪽지 뽑기'))}</b></div>
          <div class="fcard__s fcard__front"><div class="fcard__type">${L(G.typeName[f.type])}</div><div>${L(f.t)}</div><div class="muted">${today}</div></div>
        </div>
      </div>
      <p class="muted center" id="hint">${opened ? L(T('今天已经抽过啦，明天再来！', '오늘은 이미 뽑았어. 내일 또 와!')) : ''}</p>
      <div class="card center"><b>${L(T(`已经抽了 ${data.total || 0} 天`, `${data.total || 0}일째 뽑았어`))}</b></div>
      <p class="muted center">${L(G.note)}</p>`;
    say(opened ? T('今天的灵感已经在你手里啦 💡', '오늘의 영감은 이미 네 손에 💡') : T('我有个点子！先抽一张今天的签吧 💡', '나 아이디어 있어! 오늘 쪽지부터 뽑아 봐 💡'), opened ? 'happy' : 'surprised', 'wave');
    main.querySelector('#fc').addEventListener('click', () => {
      if (data.day === today) return;
      data.day = today; data.total = (data.total || 0) + 1; save(data);
      main.querySelector('#fc').classList.add('is-open');
      main.querySelector('#hint').innerHTML = L(T('明天再来抽新的！', '내일 새로 뽑으러 와!'));
      setTimeout(() => {
        if (f.type === 'good') { say(T('大吉！灯泡亮到最大了！', '대길! 전구가 최대 밝기야!'), 'proud', 'jump'); NG.celebrate(); }
        else if (f.type === 'normal') say(T('小吉～平平稳稳也很好。', '소길~ 무난한 것도 좋아.'), 'happy', 'bounce');
        else say(T('小心一点就好，我陪你！', '조금만 조심하면 돼. 내가 같이 있을게!'), 'love', 'bounce');
      }, 600);
    });
  }

  /* ========================================================= quiz 测试 */
  function quiz() {
    let i = 0, score = {};
    function q() {
      const Q = G.questions[i];
      main.innerHTML = `
        <div class="progress"><i style="width:${(i / G.questions.length) * 100}%"></i></div>
        <div class="card"><h3>${i + 1} / ${G.questions.length}</h3><p style="margin:0 0 14px;font-weight:700;font-size:18px">${L(Q.q)}</p>
          <div class="opt">${Q.a.map((a, k) => `<button class="btn" data-a="${k}">${L(a[0])}</button>`).join('')}</div></div>`;
    }
    function result() {
      const order = CHARACTERS.map(x => x.id);
      const best = order.reduce((b, id) => (score[id] || 0) > (score[b] || 0) ? id : b, order[0]);
      const r = CHARACTERS.find(x => x.id === best);
      data.last = best; data.times = (data.times || 0) + 1; save(data);
      main.innerHTML = `
        <div class="card center result">
          <p class="muted">${L(G.result)}</p>
          <img src="${face('happy', r.id)}" alt="">
          <div class="big" style="margin-top:6px">${L(r.name)}</div>
          <p><b>${L(r.role)}</b> · ${L(r.word)}</p>
          <p class="muted">${L(r.hook)}</p>
          <div class="row" style="margin-top:14px"><a class="btn grow" href="${NG.ROOT}character.html?id=${r.id}">${L(T('去看看 TA', '만나러 가기'))}</a>
          <button class="btn btn--main grow" id="again">${L(T('再测一次', '다시 하기'))}</button></div>
        </div>`;
      const line = r.id === c.id ? T('是我！是我！我要把这件事记下来 📒', '나야! 나야! 이건 꼭 적어 둘래 📒') : pick(G.end.high);
      say(line, r.id === c.id ? 'love' : 'proud', 'jump'); NG.celebrate();
      main.querySelector('#again').addEventListener('click', start);
    }
    function start() {
      i = 0; score = {};
      main.innerHTML = `<div class="card center"><p>${L(G.ready)}</p>
        ${data.last ? `<p class="muted">${L(T('上次的结果：', '지난 결과: '))}${L(CHARACTERS.find(x => x.id === data.last).name)}</p>` : ''}
        <button class="btn btn--main btn--wide btn--xl" id="s">${L(T('开始测试', '테스트 시작'))}</button></div>`;
      say(T('6 个问题，选最像你的那个就好 📒', '질문 6개, 제일 나 같은 걸 고르면 돼 📒'), 'happy', 'wave');
      main.querySelector('#s').addEventListener('click', q);
    }
    main.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      G.questions[i].a[+a.dataset.a][1].forEach(id => { score[id] = (score[id] || 0) + 1; });
      say(pick([T('嗯嗯，记下了 📒', '응응, 적었어 📒'), T('原来如此！', '그렇구나!'), T('有意思～', '재밌다~')]), 'happy', 'bounce');
      if (++i >= G.questions.length) result(); else q();
    });
    start();
  }

  /* ========================================================= match 翻牌 */
  function match() {
    const faces = ['happy', 'proud', 'sad', 'surprised', 'sleep', 'love'];
    let cards, open, ok, moves, t0, timer, lock;
    function start() {
      cards = [...faces, ...faces].map((f, i) => ({ f, i })).sort(() => Math.random() - .5);
      open = []; ok = 0; moves = 0; lock = false; t0 = 0; clearInterval(timer);
      main.innerHTML = `
        <div class="hud"><span>⏱ <b id="tm">0</b>s</span><span>${L(T('翻牌', '뒤집기'))} <b id="mv">0</b></span><span>${L(T('最佳', '최고'))} ${data.best ? data.best + 's' : '—'}</span></div>
        <div class="cards">${cards.map((k, n) => `<button class="mc" data-n="${n}" aria-label="card"><span class="mc__b">⏰</span><span class="mc__f"><img src="${face(k.f)}" alt=""></span></button>`).join('')}</div>`;
      say(G.ready, 'happy', 'wave');
    }
    function end() {
      clearInterval(timer);
      const s = Math.round((performance.now() - t0) / 1000);
      const isBest = !data.best || s < data.best; if (isBest) { data.best = s; } data.plays = (data.plays || 0) + 1; save(data);
      const sc = s <= 60 ? 2 : s <= 90 ? 1 : 0;
      setTimeout(() => {
        say(endLine(sc, 2, 1), endFace(sc, 2, 1), 'jump'); NG.celebrate(); sfx('end');
        main.insertAdjacentHTML('beforeend', `<div class="card center"><div class="big">${s}s</div><p class="muted">${L(T(`翻了 ${moves} 次`, `${moves}번 뒤집음`))}${isBest ? ' · 🏆 ' + L(T('新纪录', '신기록')) : ''}</p>
          <button class="btn btn--main btn--wide btn--xl" id="again">${L(T('再来一次', '다시 하기'))}</button></div>`);
      }, 450);
    }
    main.addEventListener('click', e => {
      if (e.target.closest('#again')) return start();
      const b = e.target.closest('.mc'); if (!b || lock) return;
      const n = +b.dataset.n; if (open.includes(n) || b.classList.contains('is-ok')) return;
      if (!t0) { t0 = performance.now(); timer = setInterval(() => { const el = main.querySelector('#tm'); if (el) el.textContent = Math.floor((performance.now() - t0) / 1000); }, 250); }
      b.classList.add('is-up'); open.push(n); sfx('tap');
      if (open.length === 2) {
        moves++; main.querySelector('#mv').textContent = moves;
        const [a, d] = open;
        if (cards[a].f === cards[d].f) {
          open.forEach(k => main.querySelector(`[data-n="${k}"]`).classList.add('is-ok')); open = []; ok++;
          sfx('good'); say(pick(G.pair), cards[a].f === 'sad' ? 'sad' : 'proud', 'bounce');
          if (ok === faces.length) end();
        } else {
          lock = true;
          setTimeout(() => { open.forEach(k => main.querySelector(`[data-n="${k}"]`).classList.remove('is-up')); open = []; lock = false; }, 700);
        }
      }
    });
    start();
  }

  /* ===================================================== reaction 反应 */
  function reaction() {
    let state = 'idle', t0 = 0, times = [], timer = null;
    function draw(msg, img) {
      main.innerHTML = `
        <div class="hud"><span>${times.length} / 5</span><span>${L(T('最佳', '최고'))} ${data.best ? data.best + 'ms' : '—'}</span></div>
        <div class="playfield" id="pf"><div class="rx"><img src="${face(img || 'happy')}" alt=""><div class="rx__msg">${L(msg)}</div></div></div>
        <div class="ticks">${times.map(x => `<span>${x}ms</span>`).join('')}</div>`;
    }
    function wait() {
      state = 'wait'; draw(G.wait, 'happy'); say(T('（举着放大镜……鼻子痒痒的）', '(돋보기를 들고… 코가 간질간질)'), 'happy');
      timer = setTimeout(() => { state = 'go'; t0 = performance.now(); draw(G.go, 'surprised'); sfx('good'); }, 1000 + Math.random() * 3000);
    }
    function end() {
      state = 'end';
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length), best = Math.min(...times);
      const isBest = !data.best || best < data.best; if (isBest) data.best = best; data.avg = avg; save(data);
      const sc = avg < 320 ? 2 : avg < 480 ? 1 : 0;
      main.innerHTML = `<div class="card center"><p class="muted">${L(T('平均', '평균'))}</p><div class="big">${avg}ms</div>
        <p class="muted">${L(T('最快', '최고'))} ${best}ms${isBest ? ' · 🏆 ' + L(T('新纪录', '신기록')) : ''}</p>
        <div class="ticks" style="margin:10px 0">${times.map(x => `<span>${x}ms</span>`).join('')}</div>
        <button class="btn btn--main btn--wide btn--xl" id="again">${L(T('再来一次', '다시 하기'))}</button></div>`;
      say(endLine(sc, 2, 1), endFace(sc, 2, 1), 'jump'); if (sc === 2) NG.celebrate(); sfx('end');
    }
    function start() {
      times = []; state = 'ready';
      draw(T('点这里开始', '여기를 눌러 시작'), 'happy');
      say(G.ready, 'happy', 'wave');
    }
    main.addEventListener('pointerdown', e => {
      if (e.target.closest('#again')) return start();
      if (!e.target.closest('#pf')) return;
      if (state === 'ready') wait();
      else if (state === 'wait') { clearTimeout(timer); state = 'early'; draw(G.early, 'sad'); say(G.early, 'sad', 'shake'); sfx('bad'); setTimeout(wait, 1200); }
      else if (state === 'go') {
        const ms = Math.round(performance.now() - t0); times.push(ms); state = 'hit';
        draw(T(`${ms} 毫秒！`, `${ms}ms!`), 'proud'); say(ms < 300 ? T('……还挺快。', '…꽤 빠르네.') : T('哼，看到了吗？', '흥, 봤어?'), 'proud', 'bounce');
        setTimeout(() => times.length >= 5 ? end() : wait(), 900);
      }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'wait') { clearTimeout(timer); start(); } });
    start();
  }

  /* ========================================================= whack 打地鼠 */
  function whack() {
    const thief = 'naihu', friend = 'naixiong';
    let score = 0, left = 30, running = false, spawnT = null, clockT = null;
    const holes = Array(9).fill(null);
    function draw() {
      main.innerHTML = `
        <div class="hud"><span>⏱ <b id="tl">${left}</b>s</span><span>🌰 <b id="sc">${score}</b></span><span>${L(T('最佳', '최고'))} ${data.best || 0}</span></div>
        <div class="playfield" id="pf" style="aspect-ratio:1">
          <div class="holes">${holes.map((_, i) => `<button class="hole" data-h="${i}" aria-label="hole ${i + 1}"><span class="hole__who"></span><span class="hole__fx"></span></button>`).join('')}</div>
          <div class="overlay" id="ov"><h2>${L(cfg.appB.name)}</h2><p>${L(G.ready)}</p><button class="btn btn--main btn--xl" id="go">${L(T('开始', '시작'))}</button></div>
        </div>`;
    }
    function spawn() {
      if (!running) return;
      const free = holes.map((h, i) => h ? -1 : i).filter(i => i >= 0);
      if (free.length) {
        const i = pick(free); const r = Math.random();
        const kind = r < .62 ? 'acorn' : r < .84 ? 'thief' : 'friend';
        holes[i] = { kind, hit: false };
        const el = main.querySelector(`[data-h="${i}"]`);
        el.querySelector('.hole__who').innerHTML = kind === 'acorn' ? '🌰' : `<img src="${face(kind === 'thief' ? 'happy' : 'happy', kind === 'thief' ? thief : friend)}" alt="">`;
        el.querySelector('.hole__fx').textContent = '';
        el.classList.add('is-up');
        const stay = Math.max(550, 900 - (30 - left) * 10);
        setTimeout(() => { if (holes[i] && !holes[i].hit) { el.classList.remove('is-up'); holes[i] = null; } }, stay);
      }
      spawnT = setTimeout(spawn, 420 + Math.random() * 380);
    }
    function hit(i) {
      const h = holes[i]; if (!h || h.hit || !running) return;
      h.hit = true;
      const el = main.querySelector(`[data-h="${i}"]`);
      const d = h.kind === 'acorn' ? 1 : h.kind === 'thief' ? 2 : -1;
      score = Math.max(0, score + d);
      main.querySelector('#sc').textContent = score;
      el.querySelector('.hole__fx').textContent = d > 0 ? `+${d}` : `${d}`;
      if (h.kind !== 'acorn') el.querySelector('img').src = face(h.kind === 'thief' ? 'sad' : 'surprised', h.kind === 'thief' ? thief : friend);
      if (h.kind === 'thief') { say(T('抓到了！橡果还我！', '잡았다! 도토리 돌려줘!'), 'proud', 'bounce'); sfx('good'); }
      else if (h.kind === 'friend') { say(T('啊！那是来帮忙的奶熊！', '앗! 도와주러 온 우유 곰이야!'), 'surprised', 'shake'); sfx('bad'); }
      else sfx('tap');
      setTimeout(() => { el.classList.remove('is-up'); holes[i] = null; }, 260);
    }
    function start() {
      score = 0; left = 30; running = true; holes.fill(null); draw();
      main.querySelector('#ov').hidden = true;
      say(T('橡果包护好了，开始守！', '도토리 가방 꼭 쥐고, 지키기 시작!'), 'happy', 'bounce');
      spawn();
      clockT = setInterval(() => { if (!running) return; left--; const el = main.querySelector('#tl'); if (el) el.textContent = left; if (left <= 0) end(); }, 1000);
    }
    function end() {
      running = false; clearTimeout(spawnT); clearInterval(clockT);
      const isBest = score > (data.best || 0); if (isBest) data.best = score; save(data);
      const ov = main.querySelector('#ov'); ov.hidden = false;
      ov.innerHTML = `<h2>🌰 ${score}</h2><p>${L(endLine(score, 22, 12))}</p>${isBest ? `<p>🏆 ${L(T('新纪录', '신기록'))}</p>` : ''}<button class="btn btn--main btn--xl" id="go">${L(T('再来一次', '다시 하기'))}</button>`;
      say(endLine(score, 22, 12), endFace(score, 22, 12), 'jump'); if (score >= 22) NG.celebrate(); sfx('end');
    }
    function pause() {
      if (!running) return; running = false; clearTimeout(spawnT); clearInterval(clockT);
      const ov = main.querySelector('#ov'); ov.hidden = false;
      ov.innerHTML = `<h2>${L(T('暂停', '일시정지'))}</h2><button class="btn btn--main btn--xl" id="resume">${L(T('继续', '계속'))}</button>`;
    }
    main.addEventListener('pointerdown', e => {
      const h = e.target.closest('[data-h]'); if (h) { e.preventDefault(); hit(+h.dataset.h); return; }
      if (e.target.closest('#go')) start();
      else if (e.target.closest('#resume')) { running = true; main.querySelector('#ov').hidden = true; spawn(); clockT = setInterval(() => { if (!running) return; left--; main.querySelector('#tl').textContent = left; if (left <= 0) end(); }, 1000); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    draw(); say(G.ready, 'happy', 'wave');
  }

  /* ========================================================= catch 接掉落物 */
  function catchGame() {
    const friends = G.friends ? CHARACTERS.filter(x => x.id !== c.id).map(x => x.id) : null;
    const LIMIT = 45;
    let pf, pl, W, H, px, target, drops, score, lives, elapsed, spawnIn, running = false, raf = 0, last = 0, frozenUntil = 0, keys = {};
    function draw() {
      main.innerHTML = `
        <div class="hud"><span class="lives" id="lv">❤️❤️❤️</span><span>⭐ <b id="sc">0</b></span><span>⏱ <b id="tl">${LIMIT}</b></span></div>
        <div class="playfield" id="pf">
          <div class="player" id="pl"><img src="${face('happy')}" alt="">${G.friends ? '<span class="cushion"></span>' : ''}</div>
          <div class="overlay" id="ov"><h2>${L(cfg.appB.name)}</h2><p>${L(G.ready)}</p>
            <p class="muted">${L(T('← → 键或手指拖动', '← → 키 또는 손가락으로 드래그'))} · ${L(T('最佳', '최고'))} ${data.best || 0}</p>
            <button class="btn btn--main btn--xl" id="go">${L(T('开始', '시작'))}</button></div>
        </div>`;
      pf = main.querySelector('#pf'); pl = main.querySelector('#pl');
      measure(); px = target = W / 2 - 40; place();
    }
    function measure() { W = pf.clientWidth; H = pf.clientHeight; }
    function place() { pl.style.transform = `translateX(${px}px)`; }
    function hud() {
      main.querySelector('#sc').textContent = score;
      main.querySelector('#lv').textContent = '❤️'.repeat(lives) + '🤍'.repeat(3 - lives);
      main.querySelector('#tl').textContent = Math.max(0, Math.ceil(LIMIT - elapsed));
    }
    function spawn() {
      const speedUp = Math.pow(1.15, Math.floor(elapsed / 15));
      const badChance = G.friends ? .2 : .22;
      const isBad = Math.random() < badChance;
      const el = document.createElement('div'); el.className = 'drop';
      let d;
      if (isBad) { const b = pick(G.bad); el.textContent = b.icon; d = { bad: b.effect }; }
      else if (friends) { const who = pick(friends); el.innerHTML = `<img src="${face('surprised', who)}" alt="">`; el.style.width = el.style.height = '50px'; d = { pts: 1, friend: who }; }
      else { const g = pick(G.good); el.textContent = g.icon; d = { pts: g.pts }; }
      d.el = el; d.x = 10 + Math.random() * (W - 64); d.y = -50; d.v = (140 + Math.random() * 60) * speedUp * (H / 520);
      pf.appendChild(el); drops.push(d);
    }
    function loop(now) {
      if (!running) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; elapsed += dt;
      const frozen = now < frozenUntil;
      if (!frozen) {
        if (keys.ArrowLeft) target -= 420 * dt;
        if (keys.ArrowRight) target += 420 * dt;
        target = Math.max(0, Math.min(W - 80, target));
        px += (target - px) * Math.min(1, dt * 14);
        place();
      }
      pl.classList.toggle('is-frozen', frozen);
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); spawnIn = Math.max(.35, .85 - elapsed * .008); }
      const top = H * .98 - 80;
      for (let k = drops.length - 1; k >= 0; k--) {
        const d = drops[k]; d.y += d.v * dt;
        d.el.style.transform = `translate(${d.x}px,${d.y}px)`;
        const cx = d.x + 22, hitX = cx > px - 6 && cx < px + 86;
        if (d.y > top - 20 && d.y < top + 40 && hitX) { collide(d); d.el.remove(); drops.splice(k, 1); continue; }
        if (d.y > H) { if (d.friend) loseLife(T('哎呀，没接住！', '앗, 못 받았어!')); d.el.remove(); drops.splice(k, 1); }
      }
      hud();
      if (lives <= 0 || elapsed >= LIMIT) return end();
      raf = requestAnimationFrame(loop);
    }
    function collide(d) {
      if (d.bad === 'life') { loseLife(T('呜……吵架闪电！别紧张，深呼吸。', '으… 말다툼 번개! 긴장 마, 심호흡.')); return; }
      if (d.bad === 'freeze') {
        frozenUntil = performance.now() + 1500; sfx('bad');
        say(T('轰！……（石化中）', '쾅! …(굳는 중)'), 'surprised', 'shake'); pl.querySelector('img').src = face('surprised');
        setTimeout(() => { if (running) pl.querySelector('img').src = face('happy'); }, 1500);
        return;
      }
      score += d.pts; sfx('good');
      if (score % 5 === 0) say(pick(cfg.lines.recorded), 'happy', 'bounce');
    }
    function loseLife(line) { lives--; sfx('bad'); say(line, 'sad', 'shake'); }
    function start() {
      drops = []; score = 0; lives = 3; elapsed = 0; spawnIn = .4; frozenUntil = 0;
      pf.querySelectorAll('.drop').forEach(x => x.remove());
      main.querySelector('#ov').hidden = true; measure(); hud();
      say(T('准备——开始！', '준비— 시작!'), 'happy', 'bounce');
      running = true; last = performance.now(); raf = requestAnimationFrame(loop);
    }
    function end() {
      running = false; cancelAnimationFrame(raf);
      const isBest = score > (data.best || 0); if (isBest) data.best = score; data.plays = (data.plays || 0) + 1; save(data);
      const ov = main.querySelector('#ov'); ov.hidden = false;
      ov.innerHTML = `<h2>⭐ ${score}</h2><p>${L(endLine(score, 25, 12))}</p>${isBest ? `<p>🏆 ${L(T('新纪录', '신기록'))}</p>` : `<p class="muted">${L(T('最佳', '최고'))} ${data.best}</p>`}
        <button class="btn btn--main btn--xl" id="go">${L(T('再来一次', '다시 하기'))}</button>`;
      say(endLine(score, 25, 12), endFace(score, 25, 12), 'jump'); if (score >= 25) NG.celebrate(); sfx('end');
    }
    function pause() {
      if (!running) return; running = false; cancelAnimationFrame(raf);
      const ov = main.querySelector('#ov'); ov.hidden = false;
      ov.innerHTML = `<h2>${L(T('暂停', '일시정지'))}</h2><button class="btn btn--main btn--xl" id="resume">${L(T('继续', '계속'))}</button>`;
    }
    function resume() { main.querySelector('#ov').hidden = true; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    main.addEventListener('click', e => { if (e.target.closest('#go')) start(); else if (e.target.closest('#resume')) resume(); });
    function aim(e) { if (!running) return; const r = pf.getBoundingClientRect(); target = e.clientX - r.left - 40; }
    main.addEventListener('pointerdown', e => { if (e.target.closest('#pf') && !e.target.closest('.overlay')) { aim(e); pf.setPointerCapture && pf.setPointerCapture(e.pointerId); } });
    main.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') aim(e); });
    addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = true; e.preventDefault(); } });
    addEventListener('keyup', e => { keys[e.key] = false; });
    addEventListener('resize', () => { if (pf) { measure(); target = Math.min(target, W - 80); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    draw(); say(G.ready, 'happy', 'wave');
  }

  /* ===================================================== hop 焦虑跳一跳
     按住蓄力 → 松手起跳；跳到写着焦虑词的礁石上就算「跳过去了」，掉进海里本局结束 */
  function hop() {
    const words = G.words;
    let cv, ctx, W, H, dpr, raf = 0, last = 0;
    let plats, cur, camX, camTo, seal, score, combo, state, power, chargeT, jump, splash, t0, wordIdx;
    const img = {};
    ['happy', 'surprised', 'love', 'proud', 'sad'].forEach(f => { const i = new Image(); i.src = face(f); img[f] = i; });
    let sealFace = 'happy';
    const SEAL = () => Math.min(64, W * .17);
    const TOP = () => H * .6;
    function draw() {
      main.innerHTML = `
        <div class="hud"><span>${L(T('跳过', '넘은 불안'))} <b id="sc">0</b></span><span>${L(T('最佳', '최고'))} ${data.best || 0}</span></div>
        <div class="playfield" id="pf" style="background:#DDF2FB">
          <canvas id="cv" style="position:absolute;inset:0;width:100%;height:100%;touch-action:none"></canvas>
          <div class="overlay" id="ov"><h2>${L(cfg.appB.name)}</h2><p>${L(G.ready)}</p>
            <button class="btn btn--main btn--xl" id="go">${L(T('开始', '시작'))}</button></div>
        </div>
        <p class="muted center">${L(T('按住屏幕蓄力，松手起跳。落在礁石正中间有加分！', '화면을 꾹 눌러 힘을 모으고, 떼면 점프! 바위 한가운데 착지하면 보너스!'))}</p>`;
      cv = main.querySelector('#cv'); ctx = cv.getContext('2d'); size();
    }
    function size() {
      const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function nextWord() { const w = words[wordIdx % words.length]; wordIdx++; return { zh: w[0], ko: w[1] }; }
    function newPlat(prev) {
      const lvl = Math.min(score, 30);
      const w = Math.max(44, rand(78, 110) - lvl * 1.6);
      const gap = rand(40, 70) + lvl * 3 + rand(0, 50);
      return { x: prev.x + prev.w + gap, w, y: TOP() + rand(-26, 22), word: nextWord(), done: false };
    }
    const rand = (a, b) => a + Math.random() * (b - a);
    function reset() {
      score = 0; combo = 0; wordIdx = Math.floor(Math.random() * words.length);
      const first = { x: W * .08, w: 110, y: TOP(), word: null, done: true };
      plats = [first]; plats.push(newPlat(first)); plats.push(newPlat(plats[1]));
      cur = 0; camX = camTo = 0;
      seal = { x: first.x + first.w / 2, y: first.y, sq: 0 };
      state = 'idle'; power = 0; splash = null; sealFace = 'happy';
      main.querySelector('#sc').textContent = 0;
    }
    /* —— 画面 —— */
    function wave(yBase, amp, len, speed, color, t) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + 10; x += 8) ctx.lineTo(x, yBase + Math.sin((x + camX * .3) / len + t * speed) * amp);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function render(t) {
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#EAF7FD'); sky.addColorStop(1, '#C9E9F6');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#FFF3C8'; ctx.beginPath(); ctx.arc(W * .82 - camX * .05 % W, H * .14, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      [[.18, .12], [.55, .2], [1.1, .1]].forEach(([fx, fy]) => { const x = ((fx * W - camX * .15) % (W + 120) + W + 120) % (W + 120) - 60; ctx.beginPath(); ctx.ellipse(x, H * fy, 30, 11, 0, 0, Math.PI * 2); ctx.ellipse(x + 22, H * fy + 4, 22, 9, 0, 0, Math.PI * 2); ctx.fill(); });
      wave(H * .7, 5, 38, 1.1, '#A9DCF0', t);
      // 礁石
      plats.forEach((p, i) => {
        const x = p.x - camX; if (x > W + 40 || x + p.w < -40) return;
        ctx.fillStyle = 'rgba(70,110,130,.12)'; roundRect(x + 4, p.y + 6, p.w, H - p.y, 16); ctx.fill();
        ctx.fillStyle = p.done ? '#F2E6D3' : '#FFF8EE'; roundRect(x, p.y, p.w, H - p.y, 16); ctx.fill();
        ctx.fillStyle = p.done ? '#E2D2B8' : '#F3E3CB'; roundRect(x, p.y, p.w, 12, 8); ctx.fill();
        if (p.word) {
          ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const fs = Math.max(12, Math.min(17, p.w / Math.max(2.2, t2(p.word).length) * 1.1));
          ctx.font = `800 ${fs}px ${getComputedStyle(document.body).fontFamily}`;
          ctx.fillStyle = p.done ? '#B9A88E' : c.deep; ctx.fillText(t2(p.word), x + p.w / 2, p.y + 34);
          if (p.done) { ctx.strokeStyle = '#B9A88E'; ctx.lineWidth = 2; const tw = ctx.measureText(t2(p.word)).width; ctx.beginPath(); ctx.moveTo(x + p.w / 2 - tw / 2 - 2, p.y + 34); ctx.lineTo(x + p.w / 2 + tw / 2 + 2, p.y + 34); ctx.stroke(); }
          ctx.restore();
        }
        if (i === cur + 1 && state !== 'fall') { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x + p.w / 2, p.y + 6, 3, 0, Math.PI * 2); ctx.fill(); }
      });
      // 海豹
      const s = SEAL(), im = img[sealFace];
      if (im && im.complete && im.naturalWidth) {
        const h = s * (1 - seal.sq * .28), w = s * (1 + seal.sq * .12) * im.naturalWidth / im.naturalHeight;
        ctx.drawImage(im, seal.x - camX - w / 2, seal.y - h, w, h);
      }
      // 蓄力条
      if (state === 'charge') { ctx.fillStyle = 'rgba(255,255,255,.8)'; roundRect(seal.x - camX - 26, seal.y - s - 18, 52, 7, 4); ctx.fill(); ctx.fillStyle = c.deep; roundRect(seal.x - camX - 26, seal.y - s - 18, 52 * power, 7, 4); ctx.fill(); }
      wave(H * .82, 6, 30, 1.7, '#8CCDE8', t + 1);
      wave(H * .9, 5, 24, 2.2, '#73BFE0', t + 2);
      if (splash) { const k = splash.k; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(splash.x - camX, H * .83, 10 + k * 40, 4 + k * 10, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    const t2 = w => t(w);
    /* —— 逻辑 —— */
    function loop(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now; const tt = now / 1000;
      if (state === 'charge') { power = Math.min(1, power + dt / 1.1); seal.sq = power; }
      if (state === 'air') {
        jump.k = Math.min(1, jump.k + dt / jump.T);
        seal.x = jump.x0 + jump.d * jump.k;
        seal.y = jump.y0 + (jump.y1 - jump.y0) * jump.k - 4 * jump.h * jump.k * (1 - jump.k);
        if (jump.k >= 1) land();
      }
      if (state === 'fall') { seal.y += 360 * dt; if (seal.y > H * .86 && !splash) { splash = { x: seal.x, k: 0 }; sfx('bad'); } if (splash) { splash.k = Math.min(1, splash.k + dt * 1.6); if (splash.k >= 1) end(); } }
      if (state === 'idle' && seal.sq > 0) seal.sq = Math.max(0, seal.sq - dt * 6);
      camX += (camTo - camX) * Math.min(1, dt * 6);
      render(tt);
      if (state !== 'over') raf = requestAnimationFrame(loop);
    }
    function press() { if (state !== 'idle') return; state = 'charge'; power = 0; sealFace = 'surprised'; }
    function release() {
      if (state !== 'charge') return;
      const from = plats[cur], maxD = W * .95;
      const d = 20 + power * maxD;
      const target = seal.x + d;
      const tp = plats.find((p, i) => i > cur && target >= p.x && target <= p.x + p.w) || (target <= from.x + from.w ? from : null);
      jump = { x0: seal.x, y0: seal.y, d, y1: tp ? tp.y : seal.y, h: 50 + power * 70, k: 0, T: .45 + power * .25, tp };
      state = 'air'; seal.sq = 0; sealFace = 'love'; sfx('tap');
    }
    function land() {
      const p = jump.tp;
      if (!p) { state = 'fall'; sealFace = 'sad'; say(pick(G.fall), 'sad', 'shake'); return; }
      seal.y = p.y; state = 'idle'; sealFace = 'happy';
      const idx = plats.indexOf(p);
      if (idx === cur) return;
      const perfect = Math.abs(seal.x - (p.x + p.w / 2)) < Math.max(6, p.w * .12);
      combo = perfect ? combo + 1 : 0;
      score += perfect ? 1 + combo : 1;
      main.querySelector('#sc').textContent = score;
      p.done = true; cur = idx;
      while (plats.length < cur + 3) plats.push(newPlat(plats[plats.length - 1]));
      camTo = seal.x - W * .25;
      sfx(perfect ? 'done' : 'good'); sealFace = perfect ? 'proud' : 'happy';
      const line = NG.fill(pick(perfect ? G.perfect : G.over), { w: p.word });
      say(line, perfect ? 'proud' : 'happy', perfect ? 'jump' : 'bounce');
      if (perfect) NG.celebrate();
    }
    function end() {
      state = 'over'; cancelAnimationFrame(raf);
      const isBest = score > (data.best || 0); if (isBest) data.best = score; data.plays = (data.plays || 0) + 1; save(data);
      const ov = main.querySelector('#ov'); ov.hidden = false;
      ov.innerHTML = `<h2>${L(T(`跳过了 ${score} 个焦虑`, `불안 ${score}개를 넘었어`))}</h2><p>${L(endLine(score, 15, 6))}</p>${isBest ? `<p>🏆 ${L(T('新纪录', '신기록'))}</p>` : `<p class="muted">${L(T('最佳', '최고'))} ${data.best}</p>`}
        <button class="btn btn--main btn--xl" id="go">${L(T('再跳一次', '다시 점프'))}</button>`;
      say(endLine(score, 15, 6), endFace(score, 15, 6), 'jump'); sfx('end');
    }
    function start() {
      main.querySelector('#ov').hidden = true; size(); reset();
      say(T('别紧张啦～一个一个跳过去就好 ☁️', '긴장하지 마~ 하나씩 뛰어넘으면 돼 ☁️'), 'happy', 'bounce');
      cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop);
    }
    main.addEventListener('click', e => { if (e.target.closest('#go')) start(); });
    main.addEventListener('pointerdown', e => { if (e.target.closest('#cv')) { e.preventDefault(); press(); } });
    addEventListener('pointerup', release); addEventListener('pointercancel', release);
    addEventListener('keydown', e => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); press(); } });
    addEventListener('keyup', e => { if (e.code === 'Space') release(); });
    addEventListener('resize', () => { if (cv) size(); });
    draw(); reset(); render(0); say(G.ready, 'happy', 'wave');
  }

  ({ ball, fortune, quiz, match, reaction, whack, hop, catch: catchGame })[mode]();
})();
