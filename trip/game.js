/* ==========================================================================
   奶油镇 · 出门去
   放置养成小游戏：选一位居民 → 院子收三叶草 → 商店买便当和道具 → 整理行李
   → 居民自己出门旅行 → 寄回明信片、带回特产
   - 时间按真实时间算（关掉再打开也会继续）；「演示模式」下 1 分钟 = 1 秒
   - 只存在这台手机里（localStorage），没有扣分，居民不会生病也不会离开
   ========================================================================== */
(function () {
  const ROOT = window.TRIP_ROOT || '../';
  const KEY = 'cream-trip';
  const $ = (s, el = document) => el.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const byId = (arr, id) => arr.find(x => x.id === id);
  const face = (id, f) => `${ROOT}assets/${id}/face/${f}.png`;
  /* 「‹」回到哪里：网页版 → 网站首页；小镇应用 APK → 应用合集；单独的游戏 APK → 不显示 */
  const HOME = window.AndroidBridge ? (AndroidBridge.home ? AndroidBridge.home() : '') : 'index.html#apps';

  /* —— 语言 —— */
  const lang = () => document.documentElement.dataset.lang === 'ko' ? 'ko' : 'zh';
  const t = v => Array.isArray(v) ? v[lang() === 'ko' ? 1 : 0] : v && typeof v === 'object' ? v[lang()] : String(v ?? '');
  const L = v => {
    if (v == null) return '';
    const o = Array.isArray(v) ? { zh: v[0], ko: v[1] } : v;
    return typeof o === 'object' ? `<span class="l-zh">${o.zh}</span><span class="l-ko">${o.ko}</span>` : String(o);
  };
  function setLang(l) {
    document.documentElement.dataset.lang = l;
    document.documentElement.lang = l === 'ko' ? 'ko' : 'zh-CN';
    try { localStorage.setItem('lang', l); } catch (e) {}
    document.title = t(TRIP.title);
  }

  /* —— 存档 —— */
  let S;
  function fresh(charId) {
    const now = Date.now();
    return { v: 1, char: charId, clover: 30, inv: { cookie: 1, mat: 1 }, packed: { food: null, tool: null },
      status: 'home', leaveAt: 0, backAt: 0, cardAt: 0, trip: null,
      yard: { last: now, spots: Array.from({ length: 6 }, spot) }, mail: [], gifts: {}, trips: 0, demo: false, act: 0 };
  }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  const unit = () => (S.demo ? 1000 : 60000);   // 1「分钟」有多长
  function spot() { return { x: rand(8, 92), y: rand(10, 90), gold: Math.random() < .07 }; }
  const me = () => CHARACTERS.find(c => c.id === S.char);

  /* —— 时间推进（打开时补算离线进度） —— */
  function tick(now = Date.now(), quiet = false) {
    // 院子：每 3「分钟」长一株，最多 14 株
    const grow = 3 * unit();
    while (now - S.yard.last >= grow) {
      S.yard.last += grow;
      if (S.yard.spots.length < 14) S.yard.spots.push(spot());
    }
    if (S.status === 'home' && S.packed.food && S.leaveAt && now >= S.leaveAt) depart(S.leaveAt, quiet);
    if (S.status === 'away' && S.cardAt && now >= S.cardAt) {
      S.cardAt = 0;
      S.mail.unshift({ id: Date.now().toString(36), place: S.trip.place, char: S.char, guest: S.trip.guest, ts: S.trip.cardTs, read: false });
      if (!quiet) toast(['📮 收到一张明信片！', '📮 엽서가 도착했어!']);
    }
    if (S.status === 'away' && now >= S.backAt) arrive(quiet);
    save();
  }
  function depart(at) {
    const food = byId(TRIP.foods, S.packed.food), tool = S.packed.tool && byId(TRIP.tools, S.packed.tool);
    const pool = TRIP.places.filter(p => p.owner !== S.char);
    const weights = pool.map(p => 1 + (tool && p.tags.includes(tool.tag) ? 4 : 0));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), place = pool[0];
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { place = pool[i]; break; } }
    const dur = rand(food.min, food.max) * unit();
    const guest = place.owner || pick(CHARACTERS.filter(c => c.id !== S.char)).id;
    const card = (tool && tool.id === 'letter') || Math.random() < .75;
    S.trip = { place: place.id, food: food.id, tool: tool ? tool.id : null, guest, cardTs: at + dur * .5 };
    S.status = 'away'; S.backAt = at + dur; S.cardAt = card ? at + dur * rand(.3, .7) : 0; S.leaveAt = 0;
    S.packed = { food: null, tool: null };
  }
  let pendingBack = null;
  function arrive() {
    const place = byId(TRIP.places, S.trip.place);
    const bonus = Math.round(rand(6, 16));
    S.gifts[place.id] = (S.gifts[place.id] || 0) + 1;
    S.clover += bonus; S.trips += 1; S.status = 'home'; S.backAt = 0; S.cardAt = 0;
    pendingBack = { place: place.id, bonus };
    S.trip = null;
  }

  /* —— 小提示 —— */
  let toastT;
  function toast(v) {
    const el = $('.toast'); el.innerHTML = L(v); el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2400);
  }

  /* ======================================================== 明信片（画布） */
  const imgCache = {};
  const loadImg = src => imgCache[src] || (imgCache[src] = new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function scene(ctx, p, W, H, tint, deep, bgImg) {
    const g = (a, b) => { const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
    const circle = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
    const tree = (x, y, s, c) => { ctx.fillStyle = '#8B6A55'; ctx.fillRect(x - 6 * s, y - 10 * s, 12 * s, 40 * s); circle(x, y - 30 * s, 34 * s, c); circle(x - 22 * s, y - 14 * s, 24 * s, c); circle(x + 22 * s, y - 14 * s, 24 * s, c); };
    const indoor = (wall, floor) => { ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H); ctx.fillStyle = floor; ctx.fillRect(0, H * .68, W, H * .32); };
    switch (p.scene) {
      case 'night':
        if (bgImg) { const s = Math.max(W / bgImg.width, H / bgImg.height); ctx.drawImage(bgImg, (W - bgImg.width * s) / 2, (H - bgImg.height * s) / 2, bgImg.width * s, bgImg.height * s); ctx.fillStyle = 'rgba(20,24,40,.25)'; ctx.fillRect(0, 0, W, H); }
        else { ctx.fillStyle = g('#1E2436', '#4D5C82'); ctx.fillRect(0, 0, W, H); }
        break;
      case 'lake':
        ctx.fillStyle = g('#CFE8F7', '#F7F1E6'); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#9CCBE3'; ctx.beginPath(); ctx.ellipse(W * .5, H * .78, W * .6, H * .2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#C9A584'; ctx.fillRect(W * .05, H * .7, W * .35, H * .06);
        circle(W * .78, H * .2, 40, '#FFF6D8'); [[.2, .18], [.55, .12]].forEach(([x, y]) => { circle(W * x, H * y, 26, '#fff'); circle(W * x + 30, H * y + 4, 22, '#fff'); });
        break;
      case 'sea':
        ctx.fillStyle = g('#BFE4F5', '#FDF3DE'); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#7FC1DE'; ctx.fillRect(0, H * .45, W, H * .25);
        ctx.fillStyle = '#F6E2BE'; ctx.beginPath(); ctx.moveTo(0, H * .7); ctx.quadraticCurveTo(W * .5, H * .6, W, H * .72); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
        circle(W * .82, H * .2, 46, '#FFE7A0');
        break;
      case 'island':
        ctx.fillStyle = g('#AFD8F2', '#F5ECFA'); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#A7D58E'; ctx.beginPath(); ctx.ellipse(W * .5, H * .5, W * .32, H * .09, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#B08A6E'; ctx.beginPath(); ctx.moveTo(W * .2, H * .52); ctx.lineTo(W * .8, H * .52); ctx.lineTo(W * .5, H * .78); ctx.fill();
        tree(W * .5, H * .44, .9, '#7DBE6A');
        [[.12, .22], [.8, .3], [.25, .82], [.75, .86]].forEach(([x, y]) => { circle(W * x, H * y, 30, '#fff'); circle(W * x + 34, H * y + 6, 24, '#fff'); circle(W * x - 30, H * y + 8, 22, '#fff'); });
        break;
      case 'garden':
        ctx.fillStyle = g('#D8F0FF', '#E9F7D8'); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#A8DA8E'; ctx.fillRect(0, H * .55, W, H * .45);
        for (let i = 0; i < 60; i++) { ctx.font = `${rand(18, 30)}px sans-serif`; ctx.fillText(Math.random() < .2 ? '🌼' : '🍀', rand(0, W), rand(H * .58, H)); }
        break;
      case 'forest': case 'tree':
        ctx.fillStyle = g('#CBE6C4', '#F4EBD8'); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#9BC98A'; ctx.fillRect(0, H * .72, W, H * .28);
        [.08, .3, .7, .92].forEach((x, i) => tree(W * x, H * .7, 1.3 + (i % 2) * .3, i % 2 ? '#6FAF60' : '#86C277'));
        if (p.scene === 'tree') { ctx.fillStyle = deep; rr(ctx, W * .56, H * .18, W * .26, H * .2, 14); ctx.fill(); ctx.font = '40px sans-serif'; ctx.fillText('💡', W * .65, H * .32); }
        else { ctx.fillStyle = '#B9B2A6'; rr(ctx, W * .38, H * .36, W * .24, H * .32, 18); ctx.fill(); ctx.fillStyle = '#FFD98A'; rr(ctx, W * .46, H * .46, W * .08, H * .1, 6); ctx.fill(); }
        break;
      default: {
        indoor(tint, deep + '55');
        ctx.fillStyle = '#fff'; rr(ctx, W * .08, H * .1, W * .26, H * .3, 16); ctx.fill();
        ctx.fillStyle = p.tags.includes('night') ? '#36406A' : '#BFE3F7'; rr(ctx, W * .1, H * .125, W * .22, H * .25, 10); ctx.fill();
        const ic = { room: '📚', window: '🔍', clock: '⏰', cellar: '🌰', attic: '📒' }[p.scene] || '✨';
        ctx.fillStyle = deep + '88'; ctx.fillRect(W * .55, H * .3, W * .36, 10);
        ctx.font = '42px sans-serif'; ctx.fillText(ic + ic, W * .62, H * .28);
      }
    }
  }
  async function drawCard(m) {
    const p = byId(TRIP.places, m.place);
    const traveler = CHARACTERS.find(c => c.id === m.char), guest = CHARACTERS.find(c => c.id === m.guest);
    const host = p.owner ? CHARACTERS.find(c => c.id === p.owner) : traveler;
    const W = 900, H = 700, PW = 852, PH = 500;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#FFFDF7'; ctx.fillRect(0, 0, W, H);
    const [bg, f1, f2] = await Promise.all([p.scene === 'night' ? loadImg(`${ROOT}assets/town/night.jpg`) : null, loadImg(face(traveler.id, 'happy')), guest ? loadImg(face(guest.id, 'love')) : null]);
    ctx.save(); ctx.translate(24, 24); rr(ctx, 0, 0, PW, PH, 10); ctx.clip();
    scene(ctx, p, PW, PH, host.tint, host.deep, bg);
    const put = (img, cx, h) => { if (!img) return; const s = h / img.height; ctx.drawImage(img, cx - img.width * s / 2, PH - h - 18, img.width * s, h); };
    put(f2, PW * .66, 230); put(f1, PW * .36, 250);
    ctx.restore();
    // 邮票
    ctx.save(); ctx.translate(W - 150, 40); ctx.rotate(.06);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 104, 124); ctx.strokeStyle = host.deep; ctx.setLineDash([6, 5]); ctx.lineWidth = 3; ctx.strokeRect(6, 6, 92, 112);
    ctx.font = '54px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.gift.icon, 52, 78); ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = host.deep; ctx.fillText('CREAM', 52, 106);
    ctx.restore();
    // 文字
    const fontFam = getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = host.deep; ctx.font = `800 42px ${fontFam}`; ctx.textAlign = 'left';
    ctx.fillText(`${t(p.name)}`, 30, PH + 84);
    ctx.fillStyle = '#5A5153'; ctx.font = `500 30px ${fontFam}`;
    const who = guest && p.owner ? (lang() === 'ko' ? `${t(guest.name)}와(과) ` : `和${t(guest.name)}`) : '';
    ctx.fillText(`${who}${t(p.act)}`, 30, PH + 134, W - 60);
    ctx.fillStyle = '#A1999A'; ctx.font = `500 22px ${fontFam}`; ctx.textAlign = 'right';
    const d = new Date(m.ts); ctx.fillText(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} · ${t(traveler.name)}`, W - 30, PH + 176);
    return cv;
  }

  /* ============================================================ 界面 */
  let view = 'home', bubbleT;
  function shell() {
    document.body.innerHTML = `
      <div class="game">
        <header class="top">
          ${!HOME ? '' : `<a class="ibtn back" href="${ROOT}${HOME}" aria-label="回到网站首页 / 홈으로">‹</a>`}
          <button class="who" data-act="settings"><img id="avatar" alt=""><b id="whoName"></b></button>
          <span class="pill">🍀 <span id="clover">0</span></span>
          <button class="ibtn" data-go="album" aria-label="明信片 / 엽서">📮<span class="badge" id="mailBadge" hidden></span></button>
          <button class="ibtn" data-act="settings" aria-label="设置 / 설정">⚙️</button>
        </header>
        <main class="view" id="v-home"></main>
        <main class="view" id="v-yard" hidden></main>
        <main class="view" id="v-shop" hidden></main>
        <main class="view" id="v-album" hidden></main>
        <nav class="tabs">
          <button class="tab" data-go="home"><i>🏠</i>${L(['房间', '방'])}</button>
          <button class="tab" data-go="yard"><i>🍀</i>${L(['院子', '마당'])}</button>
          <button class="tab" data-go="shop"><i>🛍️</i>${L(['商店', '가게'])}</button>
          <button class="tab" data-go="album"><i>📷</i>${L(['相册', '앨범'])}</button>
        </nav>
        <div class="modal" id="modal" hidden><div class="sheet" id="sheet"></div></div>
        <div class="toast"></div>
      </div>`;
  }
  function theme() {
    const c = me(); const r = document.documentElement.style;
    r.setProperty('--tint', c.tint); r.setProperty('--deep', c.deep); r.setProperty('--soft', (c.palette || [])[0] || '#FEFDEB');
    $('meta[name="theme-color"]')?.setAttribute('content', c.tint);
    $('#avatar').src = face(c.id, 'happy'); $('#whoName').innerHTML = L(c.name);
  }
  function hud() {
    $('#clover').textContent = S.clover;
    const n = S.mail.filter(m => !m.read).length; const b = $('#mailBadge'); b.hidden = !n; b.textContent = n;
  }
  function go(v) {
    view = v;
    ['home', 'yard', 'shop', 'album'].forEach(k => { $('#v-' + k).hidden = k !== v; });
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.go === v));
    render();
  }
  function render() { hud(); ({ home: renderHome, yard: renderYard, shop: renderShop, album: renderAlbum })[view](); }

  /* —— 房间 —— */
  function fmt(ms) { const m = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(m / 3600), mm = Math.floor(m % 3600 / 60), ss = m % 60; return h ? `${h}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${mm}:${String(ss).padStart(2, '0')}`; }
  function renderHome() {
    const c = me(), away = S.status === 'away';
    const hr = new Date().getHours(), night = hr < 6 || hr >= 19;
    const act = TRIP.home[S.act % TRIP.home.length];
    const gifts = Object.keys(S.gifts).map(id => byId(TRIP.places, id).gift.icon).slice(-10);
    const pf = S.packed.food && byId(TRIP.foods, S.packed.food), pt = S.packed.tool && byId(TRIP.tools, S.packed.tool);
    $('#v-home').innerHTML = `
      <div class="room">
        <div class="win ${night ? 'night' : 'day'}"><i></i>${night ? '' : '<span class="cloud"></span>'}</div>
        <div class="place">${L(c.space)}<small>${L(c.name)} · ${L(c.role)}</small></div>
        <div class="shelf">${gifts.map(g => `<span>${g}</span>`).join('')}</div>
        <div class="door ${away ? 'open' : ''}"></div>
        <div class="rug"></div>
        <div class="table"><div class="table__on">${away ? `<span class="note">${L(['出门了～', '다녀올게~'])}</span>` : `${pf ? pf.icon : ''}${pt ? pt.icon : ''}`}</div></div>
        ${away ? '' : `<button class="me" id="me" aria-label="${t(c.name)}"><img src="${face(c.id, act.face)}" alt=""></button>`}
        <div id="bubble"></div>
      </div>
      <p class="status" id="status"></p>
      ${away ? `<button class="btn btn--wide mt" data-go="yard">🍀 ${L(['去院子收三叶草', '마당에서 클로버 모으기'])}</button>`
             : `<div class="row mt"><button class="btn btn--main" data-act="pack">🎒 ${L(pf ? ['改一下行李', '짐 다시 싸기'] : ['整理行李', '짐 싸기'])}</button></div>`}`;
    updateStatus();
    const meBtn = $('#me');
    if (meBtn) meBtn.addEventListener('click', () => {
      meBtn.classList.remove('hop'); void meBtn.offsetWidth; meBtn.classList.add('hop');
      const lines = (typeof APPS === 'object' && APPS[c.id]) ? APPS[c.id].lines.idle : TRIP.lines.packed;
      say(S.packed.food ? pick(TRIP.lines.packed) : S.clover < 5 && !Object.values(S.inv).some(Boolean) ? pick(TRIP.lines.hungry) : pick(lines));
      S.act++; save();
      setTimeout(() => { const img = $('#me img'); if (img) img.src = face(c.id, TRIP.home[S.act % TRIP.home.length].face); }, 2400);
    });
  }
  function say(line) {
    const b = $('#bubble'); if (!b) return;
    b.innerHTML = `<div class="bubble">${L(line)}</div>`;
    clearTimeout(bubbleT); bubbleT = setTimeout(() => { b.innerHTML = ''; }, 2600);
  }
  function updateStatus() {
    const el = $('#status'); if (!el) return;
    const now = Date.now(), c = me();
    if (S.status === 'away') el.innerHTML = `${L([`${t(c.name)}去旅行了`, `${t(c.name)} 여행 중`])} · ${L(['预计', '귀가까지'])} <b>${fmt(S.backAt - now)}</b>`;
    else if (S.packed.food) el.innerHTML = L(['行李准备好了，TA 会找个时间悄悄出门', '짐은 준비됐어. 곧 슬쩍 나갈 거야']);
    else el.innerHTML = `${L(TRIP.home[S.act % TRIP.home.length].text)} · ${L(['装好便当，TA 就会去旅行', '도시락을 챙겨 주면 여행을 떠나'])}`;
  }

  /* —— 院子 —— */
  function renderYard() {
    const next = 3 * unit() - (Date.now() - S.yard.last);
    $('#v-yard').innerHTML = `
      <div class="h">${L(['点一下或者用手指划过去收三叶草', '탭하거나 손가락으로 쓸어서 모으기'])}</div>
      <div class="yard" id="yard">${S.yard.spots.map((s, i) => `<span class="clover ${s.gold ? 'gold' : ''}" data-i="${i}" style="left:${s.x}%;top:${s.y}%">🍀</span>`).join('')}</div>
      <p class="status">${S.yard.spots.length >= 14 ? L(['院子长满啦！', '마당이 가득 찼어!']) : `${L(['下一株', '다음 클로버'])} <b id="nextGrow">${fmt(next)}</b>`} · ${L(['金色的 +5', '금색은 +5'])}</p>`;
    const yard = $('#yard');
    const grab = el => {
      if (!el || el.classList.contains('got')) return;
      const i = +el.dataset.i, s = S.yard.spots[i]; if (!s) return;
      const v = s.gold ? 5 : 1; S.clover += v; S.yard.spots[i] = null;
      el.classList.add('got');
      const p = document.createElement('span'); p.className = 'plus'; p.textContent = `+${v}`; p.style.left = el.style.left; p.style.top = el.style.top; yard.appendChild(p);
      setTimeout(() => p.remove(), 700);
      hud();
    };
    const at = e => document.elementFromPoint(e.clientX, e.clientY)?.closest('.clover');
    let down = false;
    yard.addEventListener('pointerdown', e => { down = true; yard.setPointerCapture?.(e.pointerId); grab(at(e)); });
    yard.addEventListener('pointermove', e => { if (down) grab(at(e)); });
    const end = () => { if (!down) return; down = false; S.yard.spots = S.yard.spots.filter(Boolean); save(); setTimeout(() => view === 'yard' && renderYard(), 320); };
    yard.addEventListener('pointerup', end); yard.addEventListener('pointercancel', end);
  }

  /* —— 商店 —— */
  function shopItem(it, kind) {
    const own = S.inv[it.id] || 0;
    return `<div class="item"><span class="item__icon">${it.icon}</span>
      <div class="item__t"><b>${L(it.name)}</b><span>${L(it.desc)}</span>${own ? `<div class="own">${L(['有', '보유'])} ${own}</div>` : ''}</div>
      <button class="btn" data-buy="${it.id}" data-kind="${kind}" ${S.clover < it.price ? 'disabled' : ''}>🍀 ${it.price}</button></div>`;
  }
  function renderShop() {
    $('#v-shop').innerHTML = `
      <div class="h">${L(['便当 · 决定走多远', '도시락 · 얼마나 멀리 갈지'])}</div>
      <div class="list">${TRIP.foods.map(f => shopItem(f, 'food')).join('')}</div>
      <div class="h mt">${L(['道具 · 决定去哪里', '도구 · 어디로 갈지'])}</div>
      <div class="list">${TRIP.tools.map(f => shopItem(f, 'tool')).join('')}</div>`;
  }

  /* —— 相册 —— */
  const thumbs = {};
  function renderAlbum() {
    const got = TRIP.places.filter(p => S.gifts[p.id]);
    $('#v-album').innerHTML = `
      <div class="h">${L(['明信片', '엽서'])}<span>${S.mail.length}</span></div>
      ${S.mail.length ? `<div class="cards">${S.mail.map((m, i) => `<button class="pc" data-card="${i}"><img alt="" data-thumb="${m.id}">${m.read ? '' : `<span class="new">NEW</span>`}</button>`).join('')}</div>`
        : `<div class="empty">${L(['还没有明信片。整理好行李，等 TA 从远方寄来吧。', '아직 엽서가 없어. 짐을 싸 주고 먼 곳에서 보내 주길 기다려 봐.'])}</div>`}
      <div class="h mt">${L(['旅行特产', '여행 기념품'])}<span>${got.length} / ${TRIP.places.length}</span></div>
      <div class="gifts">${TRIP.places.map(p => `<div class="gift ${S.gifts[p.id] ? '' : 'no'}"><b>${p.gift.icon}</b>${S.gifts[p.id] ? `${L(p.gift.name)} ×${S.gifts[p.id]}` : '？'}</div>`).join('')}</div>
      <p class="status">${L([`一共旅行了 ${S.trips} 次`, `여행 ${S.trips}번 다녀옴`])}</p>`;
    S.mail.forEach(m => {
      const key = m.id + lang();
      const img = $(`[data-thumb="${m.id}"]`);
      (thumbs[key] ? Promise.resolve(thumbs[key]) : drawCard(m).then(cv => (thumbs[key] = cv.toDataURL('image/jpeg', .82)))).then(u => { if (img) img.src = u; });
    });
  }

  /* —— 弹窗 —— */
  function modal(html, center = false) {
    const m = $('#modal'); $('#sheet').innerHTML = html; m.classList.toggle('center', center); m.hidden = false;
  }
  function closeModal() { $('#modal').hidden = true; }
  function openPack() {
    let food = S.packed.food, tool = S.packed.tool;
    const opt = (it, sel, kind) => {
      const own = (S.inv[it.id] || 0) + (S.packed[kind] === it.id ? 1 : 0);
      return own ? `<button class="item ${sel === it.id ? 'sel' : ''}" data-pick="${it.id}" data-kind="${kind}"><span class="item__icon">${it.icon}</span><div class="item__t"><b>${L(it.name)}</b><span>${L(it.desc)} · ×${own}</span></div></button>` : '';
    };
    const draw = () => {
      const foods = TRIP.foods.map(f => opt(f, food, 'food')).join(''), tools = TRIP.tools.map(f => opt(f, tool, 'tool')).join('');
      modal(`<h2>🎒 ${L(['整理行李', '짐 싸기'])}</h2>
        <div class="h">${L(['便当（必选一个）', '도시락 (꼭 하나)'])}</div>
        <div class="list">${foods || `<div class="empty">${L(['没有便当，去商店买一个吧', '도시락이 없어. 가게에서 사 와'])}</div>`}</div>
        <div class="h mt">${L(['道具（可以不带）', '도구 (안 챙겨도 돼)'])}</div>
        <div class="list">${tools || `<div class="empty">${L(['没有道具', '도구 없음'])}</div>`}</div>
        <div class="row mt"><button class="btn" data-act="close">${L(['取消', '취소'])}</button>
        <button class="btn btn--main" data-act="packOk" ${food ? '' : 'disabled'}>${L(['放到桌上', '탁자에 두기'])}</button></div>`);
    };
    $('#sheet').onclick = e => {
      const p = e.target.closest('[data-pick]');
      if (p) { if (p.dataset.kind === 'food') food = p.dataset.pick; else tool = tool === p.dataset.pick ? null : p.dataset.pick; draw(); return; }
      if (e.target.closest('[data-act="packOk"]')) {
        ['food', 'tool'].forEach(k => { if (S.packed[k]) S.inv[S.packed[k]] = (S.inv[S.packed[k]] || 0) + 1; });
        S.packed = { food, tool };
        ['food', 'tool'].forEach(k => { if (S.packed[k]) S.inv[S.packed[k]] -= 1; });
        S.leaveAt = Date.now() + rand(1, 4) * unit();
        save(); closeModal(); render(); say(pick(TRIP.lines.packed));
      }
    };
    draw();
  }
  async function openCard(i) {
    const m = S.mail[i]; m.read = true; save(); hud();
    const cv = await drawCard(m);
    modal(`<h2>📮 ${L(['来自远方的明信片', '먼 곳에서 온 엽서'])}</h2><div id="cardHost"></div>
      <div class="row mt"><button class="btn" data-act="close">${L(['收好', '간직하기'])}</button><button class="btn btn--main" data-act="saveCard">${L(['保存图片', '이미지 저장'])}</button></div>`, true);
    cv.className = 'postcard'; $('#cardHost').appendChild(cv);
    $('#sheet').onclick = e => {
      if (e.target.closest('[data-act="saveCard"]')) {
        const url = cv.toDataURL('image/png');
        if (window.AndroidBridge && AndroidBridge.saveImage) { toast(AndroidBridge.saveImage(url) ? ['已保存到相册 Pictures/CreamTrip', '앨범(Pictures/CreamTrip)에 저장했어'] : ['这台手机暂时不能保存，可以截图哦', '이 폰에선 저장이 안 돼요. 캡처해 주세요']); return; }
        const a = document.createElement('a'); a.href = url; a.download = `postcard-${m.place}.png`; a.click();
      }
    };
    if (view === 'album') renderAlbum();
  }
  function showBack() {
    if (!pendingBack) return;
    const p = byId(TRIP.places, pendingBack.place), c = me(), b = pendingBack; pendingBack = null;
    modal(`<h2>${L(pick(TRIP.lines.back))}</h2>
      <div style="display:flex;justify-content:center;gap:12px;align-items:flex-end;margin:6px 0 12px">
        <img src="${face(c.id, 'proud')}" alt="" style="width:130px"><span style="font-size:64px">${p.gift.icon}</span></div>
      <p style="text-align:center;margin:0 0 6px">${L([`从「${p.name[0]}」带回了`, `「${p.name[1]}」에서 가져온 선물`])} <b>${L(p.gift.name)}</b></p>
      <p style="text-align:center;margin:0;color:var(--ink-2)">${L([`还捡到了 🍀 ${b.bonus}`, `클로버 🍀 ${b.bonus}개도 주웠어`])}</p>
      <button class="btn btn--main btn--wide mt" data-act="close">${L(['欢迎回家', '어서 와'])}</button>`, true);
    $('#sheet').onclick = null;
  }
  function openSettings() {
    const away = S.status === 'away';
    modal(`<h2>⚙️ ${L(['设置', '설정'])}</h2>
      <div class="h">${L(['换一位居民', '주민 바꾸기'])}${away ? `<span>${L(['旅行中不能换', '여행 중엔 못 바꿔'])}</span>` : ''}</div>
      <div class="chars">${CHARACTERS.map(c => `<button class="ch ${c.id === S.char ? 'on' : ''}" data-char="${c.id}" style="--t:${c.tint};--d:${c.deep}" ${away ? 'disabled' : ''}><img src="${face(c.id, 'happy')}" alt="">${L(c.name)}</button>`).join('')}</div>
      <div class="set"><div>${L(['语言', '언어'])}</div><button class="lang" data-act="lang"><span>中</span><span>한</span></button></div>
      <div class="set"><div><b>${L(['演示模式', '시연 모드'])}</b><div style="font-size:13px;color:var(--ink-2)">${L(['1 分钟变成 1 秒，录视频时用', '1분이 1초가 돼요. 영상 촬영할 때'])}</div></div><button class="switch ${S.demo ? 'on' : ''}" data-act="demo" aria-label="demo"></button></div>
      <div class="set"><div style="color:var(--ink-2);font-size:13px">${L(['存档只保存在这台手机里', '저장 데이터는 이 폰에만 있어요'])}</div><button class="btn" data-act="reset" style="min-height:40px;font-size:13px;border-color:var(--line);color:var(--ink-2)">${L(['重新开始', '처음부터'])}</button></div>
      <button class="btn btn--main btn--wide mt" data-act="close">${L(['好了', '완료'])}</button>`);
    $('#sheet').onclick = e => {
      const ch = e.target.closest('[data-char]');
      if (ch && !away) { S.char = ch.dataset.char; save(); theme(); openSettings(); render(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'lang') { setLang(lang() === 'zh' ? 'ko' : 'zh'); render(); }
      if (a.dataset.act === 'demo') { rescale(!S.demo); a.classList.toggle('on', S.demo); render(); }
      if (a.dataset.act === 'reset' && confirm(t(['确定要清空存档重新开始吗？', '저장 데이터를 지우고 처음부터 할까요?']))) { localStorage.removeItem(KEY); location.reload(); }
    };
  }
  /* 切换演示模式时，把正在进行的计时按比例换算 */
  function rescale(demo) {
    const now = Date.now(), k = (demo ? 1000 : 60000) / unit();
    ['leaveAt', 'backAt', 'cardAt'].forEach(f => { if (S[f]) S[f] = now + (S[f] - now) * k; });
    S.yard.last = now - (now - S.yard.last) * k;
    S.demo = demo; save();
  }

  /* —— 第一次打开：选居民 —— */
  function pickScreen() {
    let sel = CHARACTERS[0].id;
    const box = document.createElement('div'); box.className = 'pick';
    const draw = () => {
      box.innerHTML = `<div class="pick__in">
        <div style="display:flex;justify-content:space-between;align-items:center">${!HOME ? '<span></span>' : `<a class="lang" href="${ROOT}${HOME}" style="text-decoration:none;color:inherit">‹ ${L(window.AndroidBridge ? ['小镇应用', '마을 앱'] : ['网站首页', '홈페이지'])}</a>`}<button class="lang" data-act="lang"><span>中</span><span>한</span></button></div>
        <img class="pick__banner" src="${ROOT}assets/town/forest.jpg" alt="">
        <h1>${L(TRIP.title)}</h1>
        <p>${L(['选一位居民住进你的手机。收三叶草、准备便当，TA 会自己出门旅行，从远方寄明信片回来。', '주민 한 명을 골라 폰에 데려와요. 클로버를 모아 도시락을 챙겨 주면, 혼자 여행을 떠나 먼 곳에서 엽서를 보내요.'])}</p>
        <div class="chars">${CHARACTERS.map(c => `<button class="ch ${c.id === sel ? 'on' : ''}" data-char="${c.id}" style="--t:${c.tint};--d:${c.deep}"><img src="${face(c.id, 'happy')}" alt="">${L(c.name)}</button>`).join('')}</div>
        <p class="mt" style="margin-top:14px"><b>${L(CHARACTERS.find(c => c.id === sel).role)}</b> · ${L(CHARACTERS.find(c => c.id === sel).hook)}</p>
        <button class="btn btn--main btn--wide" data-act="start" style="background:${CHARACTERS.find(c => c.id === sel).deep};border-color:${CHARACTERS.find(c => c.id === sel).deep}">${L(['就决定是你了！', '너로 정했어!'])}</button>
      </div>`;
    };
    box.addEventListener('click', e => {
      const ch = e.target.closest('[data-char]'); if (ch) { sel = ch.dataset.char; draw(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'lang') setLang(lang() === 'zh' ? 'ko' : 'zh');
      if (a.dataset.act === 'start') { S = fresh(sel); save(); box.remove(); boot(); }
    });
    draw(); document.body.appendChild(box);
  }

  /* —— 启动 —— */
  function boot() {
    shell(); theme();
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go); return; }
      const a = e.target.closest('[data-act]'); if (!a || a.closest('#sheet') && !['close'].includes(a.dataset.act)) return;
      if (a.dataset.act === 'close') closeModal();
      else if (a.dataset.act === 'settings') openSettings();
      else if (a.dataset.act === 'pack') openPack();
    });
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.querySelector('.game').addEventListener('click', e => {
      const b = e.target.closest('[data-buy]'); if (b) {
        const it = byId(b.dataset.kind === 'food' ? TRIP.foods : TRIP.tools, b.dataset.buy);
        if (S.clover >= it.price) { S.clover -= it.price; S.inv[it.id] = (S.inv[it.id] || 0) + 1; save(); renderShop(); hud(); toast([`买到了 ${it.icon}`, `${it.icon} 구매 완료`]); }
        return;
      }
      const c = e.target.closest('[data-card]'); if (c) openCard(+c.dataset.card);
    });
    tick(Date.now(), true);
    go('home');
    if (pendingBack) showBack();
    let lastStatus = S.status, lastMail = S.mail.length, lastSpots = S.yard.spots.length;
    setInterval(() => {
      tick();
      if (S.status !== lastStatus) {
        if (S.status === 'away' && view === 'home') toast(pick(TRIP.lines.leave));
        lastStatus = S.status; if (view === 'home') renderHome();
        if (pendingBack) showBack();
      }
      if (S.mail.length !== lastMail) { lastMail = S.mail.length; hud(); if (view === 'album') renderAlbum(); }
      if (view === 'yard' && S.yard.spots.length !== lastSpots) { lastSpots = S.yard.spots.length; renderYard(); }
      else if (view === 'yard') { const n = $('#nextGrow'); if (n) n.textContent = fmt(3 * unit() - (Date.now() - S.yard.last)); }
      if (view === 'home') updateStatus();
      if (view === 'shop') renderShop();
    }, 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); render(); if (pendingBack) showBack(); } });
  }

  let saved = null; try { saved = localStorage.getItem('lang'); } catch (e) {}
  setLang(saved === 'ko' ? 'ko' : 'zh');
  S = load();
  if (S && S.char && CHARACTERS.some(c => c.id === S.char)) boot(); else pickScreen();
})();
