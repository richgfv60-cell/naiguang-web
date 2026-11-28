/* ==========================================================================
   我的房间：角色住在这里，两个小应用挂在房间的「应用标签」上
   - 点角色：惊讶 + 一句台词；角色会在房间里慢慢走动
   - 可以把房间（或任意一个应用）添加到手机主屏幕
   ========================================================================== */
(function () {
  const { c, cfg, L, t, face, pick, say } = NG;
  const T = (zh, ko) => [zh, ko];
  document.documentElement.style.setProperty('--tint', c.tint);
  document.documentElement.style.setProperty('--deep', c.deep);
  const kindA = { mood: 'A', diary: 'A', lend: 'A', water: 'B', habit: 'B', todo: 'C', idea: 'C', focus: 'C' };
  const kindB = { hop: 'E', catch: 'E', match: 'E', whack: 'E', reaction: 'E', ball: 'F', fortune: 'F', quiz: 'F' };
  const KN = { A: T('记录', '기록'), B: T('习惯·健康', '습관·건강'), C: T('待办·专注', '할 일·집중'), E: T('游戏', '게임'), F: T('运势·测试', '운세·테스트') };
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  const st = document.createElement('style');
  st.textContent = `
    .room{position:relative;height:330px;margin:0 16px;border-radius:26px;overflow:hidden;
      background:linear-gradient(180deg,color-mix(in srgb,var(--tint) 70%,#fff) 0 64%,color-mix(in srgb,var(--deep) 18%,#fff) 64% 100%)}
    .room__win{position:absolute;top:22px;left:22px;width:84px;height:84px;border-radius:14px;background:linear-gradient(180deg,#1E2436,#5A6A8C);box-shadow:inset 0 0 0 5px #fff}
    .room__win::after{content:"";position:absolute;top:16px;right:16px;width:18px;height:18px;border-radius:50%;background:#FFE7A8;box-shadow:0 0 14px #FFE7A8}
    .room__name{position:absolute;top:22px;right:20px;text-align:right;font-weight:800;color:var(--deep);font-size:18px}
    .room__name small{display:block;font-weight:500;font-size:12px;color:var(--ink-2)}
    .room__shelf{position:absolute;top:120px;right:22px;width:110px;height:8px;border-radius:4px;background:var(--deep);opacity:.35}
    .walker{position:absolute;bottom:22px;left:0;width:120px;height:140px;display:flex;align-items:flex-end;justify-content:center;cursor:pointer;will-change:transform;touch-action:none}
    .walker img{max-height:100%;width:auto;filter:drop-shadow(0 6px 8px rgba(0,0,0,.12));user-select:none;-webkit-user-drag:none;transition:transform .2s}
    .walker.flip img{transform:scaleX(-1)}
    .walker.step img{animation:step .5s ease-in-out infinite}
    @keyframes step{50%{translate:0 -5px}}
    .room .bubble{position:absolute;left:8%;right:8%;top:116px;font-size:14px;z-index:2}
    .tabs{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .tile{display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:22px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.05);text-decoration:none;min-height:180px}
    .tile__icon{width:64px;height:64px;border-radius:18px;background:var(--tint);display:flex;align-items:center;justify-content:center}
    .tile__icon img{width:52px;height:52px;object-fit:contain}
    .tile b{font-size:17px}
    .tile .tag{align-self:flex-start;font-size:11px;padding:2px 8px;border-radius:10px;background:var(--bg);color:var(--deep);font-weight:700}
    .faces{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
    .faces img{width:100%;aspect-ratio:1;object-fit:contain;background:var(--bg);border-radius:12px;padding:3px}
    .steps{margin:6px 0 0;padding-left:20px;color:var(--ink-2);font-size:14px}
    @media (prefers-reduced-motion:reduce){.walker.step img{animation:none}}
  `;
  document.head.appendChild(st);

  const tile = (k, a, kind) => `
    <a class="tile" href="app-${k}/index.html">
      <span class="tile__icon"><img src="${face(k === 'a' ? 'happy' : 'proud')}" alt=""></span>
      <span class="tag">${k === 'a' ? L(T('实操 1 · 记录型', '실습 1 · 기록형')) : L(T('实操 2 · 游戏型', '실습 2 · 놀이형'))} · ${kind} ${L(KN[kind])}</span>
      <b>${L(a.name)}</b><span class="muted">${L(a.sub)}</span>
    </a>`;

  document.body.innerHTML = `
    <div class="app">
      <header class="bar">
        <a class="bar__back" href="${window.AndroidBridge ? NG.ROOT + 'apps.html' : NG.ROOT + 'index.html#apps'}" aria-label="返回小镇应用 / 마을 앱으로">‹</a>
        <div class="bar__title">${L(T('我的房间', '내 방'))}<small>${L(c.name)} · ${L(c.role)}</small></div>
        <button class="bar__btn lang" data-lang aria-label="切换语言 / 언어 변경"><span>中</span><span>한</span></button>
      </header>
      <div class="room" id="room">
        <div class="room__win"></div><div class="room__shelf"></div>
        <div class="room__name">${L(c.space)}<small>NO.${c.no} · ${L(c.word)}</small></div>
        <div class="bubble" id="bb" hidden></div>
        <div class="walker" id="wk"><img src="${face('happy')}" alt="${c.name.zh}"></div>
      </div>
      <main class="main">
        <p class="center" style="margin:4px 8px 0;color:var(--ink-2)">「${L(cfg.sentence)}」</p>
        <div><h3 style="margin:6px 4px 10px">${L(T('应用标签', '앱 탭'))}</h3>
          <div class="tabs">${tile('a', cfg.appA, kindA[cfg.appA.mode])}${tile('b', cfg.appB, kindB[cfg.appB.mode])}</div></div>
        <div class="card" id="install">
          <h3>📲 ${L(T('放到手机主屏幕', '홈 화면에 추가'))}</h3>
          ${standalone ? `<p>${L(T('已经在主屏幕上啦！', '이미 홈 화면에 있어요!'))}</p>` : `
          <button class="btn btn--main btn--wide" id="ins" hidden>${L(T('安装到主屏幕', '홈 화면에 설치'))}</button>
          <ol class="steps" id="howto">${isIOS
            ? `<li>${L(T('用 Safari 打开这个房间或某个应用', 'Safari로 이 방이나 앱을 열어요'))}</li><li>${L(T('点底部的「分享」按钮 ⬆️', '아래쪽 「공유」 버튼 ⬆️ 누르기'))}</li><li>${L(T('选「添加到主屏幕」', '「홈 화면에 추가」 선택'))}</li>`
            : `<li>${L(T('用 Chrome 打开这个房间或某个应用', 'Chrome으로 이 방이나 앱을 열어요'))}</li><li>${L(T('点右上角 ⋮ 菜单', '오른쪽 위 ⋮ 메뉴'))}</li><li>${L(T('选「添加到主屏幕」或「安装应用」', '「홈 화면에 추가」 또는 「앱 설치」 선택'))}</li>`}</ol>
          <p class="muted" style="margin-top:8px">${L(T('想直接打开某个应用，就先进入那个应用再添加。', '특정 앱을 바로 열고 싶다면 그 앱에 들어가서 추가하세요.'))}</p>`}
        </div>
        <div class="card"><h3>${L(T('表情 PNG（来自表情表）', '표정 PNG (표정 시트에서)'))}</h3>
          <div class="faces">${['happy', 'proud', 'sad', 'surprised', 'sleep', 'love'].map(f => `<img src="${face(f)}" alt="${f}" title="${f}.png">`).join('')}</div></div>
        <a class="btn btn--ghost btn--wide" href="${NG.ROOT}character.html?id=${c.id}">${L(T('看角色介绍', '캐릭터 소개 보기'))} ›</a>
      </main>
      <p class="privacy">STUDIO NULL · ${L(T('奶油动物镇', '크림 동물 마을'))}</p>
    </div>`;

  /* 语言 */
  let saved = null; try { saved = localStorage.getItem('lang'); } catch (e) {}
  NG.setLang(saved === 'ko' ? 'ko' : 'zh');
  document.title = t(T('我的房间', '내 방')) + ' · ' + t(c.name);
  NG.onLang = () => { document.title = t(T('我的房间', '내 방')) + ' · ' + t(c.name); };
  document.querySelector('button[data-lang]').addEventListener('click', () => NG.setLang(NG.lang() === 'zh' ? 'ko' : 'zh'));

  /* 安装按钮（Android / 电脑 Chrome） */
  let deferred = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; const b = document.getElementById('ins'); if (b) b.hidden = false; });
  document.addEventListener('click', e => {
    if (e.target.closest('#ins') && deferred) { deferred.prompt(); deferred = null; e.target.closest('#ins').hidden = true; }
  });

  /* 房间里走来走去的角色 */
  const room = document.getElementById('room'), wk = document.getElementById('wk'), img = wk.querySelector('img'), bb = document.getElementById('bb');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let x = 30, goal = 30, wait = 1.5, last = performance.now(), bubbleT;
  function talk(line, f) {
    bb.hidden = false; bb.innerHTML = L(line); bb.classList.remove('is-pop'); void bb.offsetWidth; bb.classList.add('is-pop');
    if (f) img.src = face(f);
    clearTimeout(bubbleT); bubbleT = setTimeout(() => { bb.hidden = true; img.src = face('happy'); }, 2600);
  }
  wk.addEventListener('click', () => { talk(pick(cfg.lines.idle), 'surprised'); wait = 2.5; goal = x; });
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const W = room.clientWidth - 120;
    if (!reduce && !document.hidden) {
      if (Math.abs(goal - x) < 2) {
        wk.classList.remove('step');
        wait -= dt;
        if (wait <= 0) { goal = Math.random() * W; wait = 2 + Math.random() * 3; if (Math.random() < .25) { img.src = face('sleep'); setTimeout(() => img.src = face('happy'), 2500); } }
      } else {
        const dir = Math.sign(goal - x); x += dir * Math.min(Math.abs(goal - x), 40 * dt);
        wk.classList.add('step'); wk.classList.toggle('flip', dir < 0);
      }
    }
    wk.style.transform = `translateX(${Math.max(0, Math.min(W, x))}px)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setTimeout(() => talk(pick(cfg.lines.idle), 'happy'), 600);
})();
