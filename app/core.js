/* ==========================================================================
   奶油动物镇 · 角色小应用 共用引擎
   --------------------------------------------------------------------------
   每个应用页面先写：
     <script>window.NG_ROOT = '../../../'; window.NG_ID = 'naitu'; window.NG_APP = 'a';</script>
   再依次加载 data.js → app/chars.js → app/core.js → app/record.js 或 app/game.js
   - 所有角色反应只在 NG.react() 一个地方处理
   - 每个应用只用一个 localStorage 键：ngw:<角色id>:<a|b>
   - 不连服务器、不扣分、角色不会死
   ========================================================================== */
(function () {
  const ROOT = window.NG_ROOT || '../../../';
  const ID = window.NG_ID;
  const APP = window.NG_APP || 'a';
  const c = CHARACTERS.find(x => x.id === ID) || CHARACTERS[0];
  const cfg = APPS[c.id];
  const KEY = `ngw:${c.id}:${APP}`;

  /* —— 语言 —— */
  function lang() { return document.documentElement.dataset.lang === 'ko' ? 'ko' : 'zh'; }
  function setLang(l) {
    document.documentElement.dataset.lang = l;
    document.documentElement.lang = l === 'ko' ? 'ko' : 'zh-CN';
    try { localStorage.setItem('lang', l); } catch (e) {}
    document.querySelectorAll('[data-ph-zh]').forEach(el => { el.placeholder = el.dataset['ph' + (l === 'ko' ? 'Ko' : 'Zh')]; });
    document.title = t(cfg[APP === 'a' ? 'appA' : 'appB'].name) + ' · ' + t(c.name);
    NG.onLang && NG.onLang(l);
  }
  /* 文字可以是 {zh,ko}、[zh,ko] 或纯字符串 */
  function norm(v) { return Array.isArray(v) ? { zh: v[0], ko: v[1] } : v; }
  function t(v) { v = norm(v); return v == null ? '' : typeof v === 'object' ? v[lang()] : String(v); }
  function esc(s) { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
  function L(v) {
    v = norm(v);
    if (v == null) return '';
    if (typeof v !== 'object') return esc(v);
    return `<span class="l-zh" lang="zh-CN">${v.zh}</span><span class="l-ko" lang="ko">${v.ko}</span>`;
  }
  function fill(v, vars) {
    v = norm(v);
    const f = s => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] && typeof vars[k] === 'object') ? '' : vars[k]);
    const g = (s, l) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] && typeof vars[k] === 'object') ? vars[k][l] : vars[k]);
    return typeof v === 'object' ? { zh: g(v.zh, 'zh'), ko: g(v.ko, 'ko') } : f(v);
  }

  /* —— 存储（一个键） —— */
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { toast(['存储空间满了，这条没存上', '저장 공간이 가득 차서 저장하지 못했어요']); return false; } }

  /* —— 日期（按本机时间） —— */
  function dayKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function daysBetween(a, b) { const p = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 864e5); }

  /* —— 角色素材 —— */
  function face(name, who = c.id) { return `${ROOT}assets/${who}/face/${name}.png`; }
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* —— 小提示 —— */
  let toastTimer;
  function toast(v) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = L(v); el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
  }

  /* ==========================================================================
     反应规则表：情况 → 表情 · 台词（5 句随机）· 动作
     ========================================================================== */
  const RULES = {
    first:    { face: 'surprised', anim: 'wave' },
    idle:     { face: 'happy',     anim: '' },
    recorded: { face: 'happy',     anim: 'bounce' },
    done:     { face: 'proud',     anim: 'jump', stars: true },
    missed:   { face: 'sad',       anim: '' },
    longtime: { face: 'surprised', anim: 'wave' },
    worried:  { face: 'sad',       anim: 'shake' },
    sleep:    { face: 'sleep',     anim: '' },
    love:     { face: 'love',      anim: 'bounce' }
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let charEl, bubbleEl;
  function mountStage(root, size = '') {
    root.innerHTML = `<div class="bubble" aria-live="polite"></div><div class="char ${size}"><img alt="${c.name.zh} ${c.name.ko}" src="${face('happy')}"></div>`;
    bubbleEl = root.querySelector('.bubble'); charEl = root.querySelector('.char');
  }
  function setFace(name) { if (charEl) charEl.querySelector('img').src = face(name); }
  function say(text, faceName, anim) {
    if (faceName) setFace(faceName);
    if (bubbleEl && text != null) {
      bubbleEl.innerHTML = L(text);
      bubbleEl.classList.remove('is-pop'); void bubbleEl.offsetWidth; bubbleEl.classList.add('is-pop');
    }
    if (charEl && anim && !reduceMotion) {
      charEl.classList.remove('bounce', 'jump', 'wave', 'shake'); void charEl.offsetWidth; charEl.classList.add(anim);
    }
  }
  function celebrate(target = charEl) {
    if (reduceMotion || !target) return;
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('i'); s.className = 'star';
      const a = (Math.PI * 2 * i) / 8, r = 70 + Math.random() * 30;
      s.style.setProperty('--x', `${Math.cos(a) * r}px`); s.style.setProperty('--y', `${Math.sin(a) * r}px`);
      target.appendChild(s); setTimeout(() => s.remove(), 900);
    }
  }
  /* 唯一的反应入口 */
  function react(situation, extra) {
    const rule = RULES[situation] || RULES.idle;
    const pool = (cfg.lines && cfg.lines[situation]) || cfg.lines.idle;
    const line = extra && extra.line ? extra.line : pick(pool);
    say(line, (extra && extra.face) || rule.face, rule.anim);
    if (rule.stars) celebrate();
    if (situation === 'done') sfx('done'); else if (situation === 'recorded') sfx('tap');
  }
  /* 打开时：第一次 / 好久不见 / 漏了一天 / 平时 */
  function greet(lastDay, hasData) {
    const today = dayKey();
    if (!hasData) return react('first', { line: cfg.intro.empty });
    const gap = lastDay ? daysBetween(lastDay, today) : 0;
    if (gap >= 3) return react('longtime');
    if (gap === 2) return react('missed');
    return react('idle');
  }

  /* —— 第一次打开：3 张自我介绍卡（以后不再出现） —— */
  function introCards(data, done) {
    if (data.introSeen) return done && done();
    const cards = cfg.intro.cards;
    let i = 0;
    const box = document.createElement('div'); box.className = 'intro'; box.setAttribute('role', 'dialog');
    const faces = ['love', 'happy', 'proud'];
    function draw() {
      box.innerHTML = `<div class="intro__card">
        <div class="char"><img src="${face(faces[i])}" alt=""></div>
        <h2>${L(cards[i][0])}</h2><p>${L(cards[i][1])}</p>
        <div class="dots">${cards.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        <div class="row"><button class="btn btn--ghost grow" data-skip>${L(['跳过', '건너뛰기'])}</button>
        <button class="btn btn--main grow" data-next>${L(i < cards.length - 1 ? ['下一张', '다음'] : ['开始吧', '시작하기'])}</button></div></div>`;
    }
    function close() { box.remove(); data.introSeen = true; save(data); done && done(); }
    box.addEventListener('click', e => {
      if (e.target.closest('[data-skip]')) close();
      else if (e.target.closest('[data-next]')) { if (++i >= cards.length) close(); else draw(); }
    });
    draw(); document.body.appendChild(box);
  }

  /* —— 音效（第一次触摸后才响，可静音） —— */
  let actx = null, muted = false;
  try { muted = localStorage.getItem('ngw:mute') === '1'; } catch (e) {}
  function unlockAudio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } }
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  function sfx(kind) {
    if (muted || !actx) return;
    const tones = { tap: [660, .06], done: [880, .12], good: [740, .07], bad: [220, .14], end: [523, .2] };
    const [f, d] = tones[kind] || tones.tap;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.value = .08;
    g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + d + .02);
  }
  function setMuted(m) { muted = m; try { localStorage.setItem('ngw:mute', m ? '1' : '0'); } catch (e) {} }

  /* —— 页面骨架：顶栏 + 舞台 + 内容 —— */
  function shell(opts = {}) {
    const appCfg = cfg[APP === 'a' ? 'appA' : 'appB'];
    document.documentElement.style.setProperty('--tint', c.tint);
    document.documentElement.style.setProperty('--deep', c.deep);
    document.body.innerHTML = `
      <div class="app">
        <header class="bar">
          <a class="bar__back" href="../" aria-label="返回房间 / 방으로">‹</a>
          <div class="bar__title">${L(appCfg.name)}<small>${L(c.name)} · ${L(appCfg.sub)}</small></div>
          ${opts.mute ? `<button class="bar__btn" data-mute aria-label="静音 / 음소거">${muted ? '🔇' : '🔊'}</button>` : ''}
          <button class="bar__btn lang" data-lang aria-label="切换语言 / 언어 변경"><span>中</span><span>한</span></button>
        </header>
        <section class="stage" id="stage"></section>
        <main class="main" id="main"></main>
        <p class="privacy">${L(['记录只保存在这台手机里，不会上传。', '기록은 이 폰에만 저장되고 업로드되지 않아요.'])}</p>
      </div>`;
    document.querySelector('button[data-lang]').addEventListener('click', () => setLang(lang() === 'zh' ? 'ko' : 'zh'));
    const mb = document.querySelector('[data-mute]');
    if (mb) mb.addEventListener('click', () => { setMuted(!muted); mb.textContent = muted ? '🔇' : '🔊'; });
    mountStage(document.getElementById('stage'), opts.small ? 'sm' : '');
    let saved = null; try { saved = localStorage.getItem('lang'); } catch (e) {}
    setLang(saved === 'ko' ? 'ko' : 'zh');
    return document.getElementById('main');
  }

  /* —— 离线 / 可安装（PWA） —— */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register(ROOT + 'sw.js').catch(() => {}));
  }

  window.NG = {
    c, cfg, APP, ROOT, lang, setLang, t, L, esc, fill, load, save, dayKey, daysBetween, face, pick, toast,
    react, greet, say, setFace, celebrate, introCards, sfx, shell, mountStage,
    get charEl() { return charEl; }, get muted() { return muted; }, onLang: null
  };
})();
