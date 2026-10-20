/* ==========================================================================
   奶油动物镇 · 页面功能
   --------------------------------------------------------------------------
   这里负责：生成页面、语言切换、滚动动画、点击放大等。
   ★ 想改文字请去 data.js，这个文件一般不需要动 ★
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (p, start, end) => clamp((p - start) / (end - start));   // 把进度映射到某个区间
const easeOut = t => 1 - Math.pow(1 - t, 3);                            // 缓出曲线
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const byId = id => CHARACTERS.find(c => c.id === id);

/* 图片路径 */
const img = (c, file) => `assets/${c.id}/${file}`;
const hero = c => img(c, 'hero.png');

/* --------------------------------------------------------------------------
   语言
   - L(文字)：同时输出中文和韩文两份，CSS 只显示当前语言那份
   - tx(文字)：只取当前语言的纯文字（用于图片说明等）
   -------------------------------------------------------------------------- */
function getLang() {
  return document.documentElement.dataset.lang === 'ko' ? 'ko' : 'zh';
}
function setLang(lang) {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === 'ko' ? 'ko' : 'zh-CN';
  try { localStorage.setItem('lang', lang); } catch (e) { /* 浏览器不允许存储时忽略 */ }
}
function L(v, tag = 'span') {
  if (v == null) return '';
  if (typeof v !== 'object') return String(v);
  return `<${tag} class="l-zh" lang="zh-CN">${v.zh}</${tag}><${tag} class="l-ko" lang="ko">${v.ko}</${tag}>`;
}
/* 两种语言各是一个列表时：每种语言分别生成一组 */
function Llist(v, render, tag = 'div', cls = '') {
  return ['zh', 'ko'].map(k =>
    `<${tag} class="l-${k}${cls ? ' ' + cls : ''}" lang="${k === 'ko' ? 'ko' : 'zh-CN'}">${v[k].map(render).join('')}</${tag}>`
  ).join('');
}
function tx(v) { return v == null ? '' : typeof v === 'object' ? v[getLang()] : String(v); }
function both(v) { return typeof v === 'object' ? `${v.zh} ${v.ko}` : String(v); }

/* --------------------------------------------------------------------------
   滚动动画引擎
   - 窗口大小变化时，每个「场景」记录自己在页面上的位置
   - 滚动时只读 scrollY，在同一帧里统一改 transform / opacity → 稳定 60fps
   -------------------------------------------------------------------------- */
const scenes = [];
let ticking = false;
function addScene(scene) { scenes.push(scene); }
function measureAll() {
  const y = window.scrollY;
  scenes.forEach(s => {
    const r = s.el.getBoundingClientRect();
    s.top = r.top + y;
    s.height = r.height;
  });
}
function updateAll() {
  ticking = false;
  if (reduceMotion.matches) return;
  const y = window.scrollY, vh = window.innerHeight;
  scenes.forEach(s => s.update(y, vh));
}
function requestUpdate() {
  if (!ticking) { ticking = true; requestAnimationFrame(updateAll); }
}
function startEngine() {
  measureAll();
  updateAll();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => { measureAll(); requestUpdate(); });
  window.addEventListener('load', () => { measureAll(); requestUpdate(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measureAll(); requestUpdate(); }).observe(document.body);
  reduceMotion.addEventListener?.('change', () => {
    if (reduceMotion.matches) $$('[style*="transform"], [style*="opacity"]').forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
    requestUpdate();
  });
}
/* 吸顶舞台的进度：0 = 刚吸顶，1 = 即将离开 */
const stickyProgress = (s, y, vh) => clamp((y - s.top) / Math.max(1, s.height - vh));
/* 普通元素进入屏幕的进度：0 = 刚从底部出现，1 = 走完 span 个屏幕高度 */
const enterProgress = (s, y, vh, span = 0.9) => clamp((y + vh - s.top) / (vh * span));

/* --------------------------------------------------------------------------
   滚动淡入：元素进入屏幕时加 .is-in，结束后移除标记，让悬停动画恢复正常
   -------------------------------------------------------------------------- */
function initReveal() {
  const els = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-in');
      io.unobserve(el);
      const delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
      setTimeout(() => { el.removeAttribute('data-reveal'); el.classList.remove('is-in'); }, 1200 + delay * 1000);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach(el => io.observe(el));
}

/* --------------------------------------------------------------------------
   逐字点亮：data-scrub-text 里的文字随滚动一个字一个字变亮
   -------------------------------------------------------------------------- */
function initScrubText() {
  $$('[data-scrub-text]').forEach(el => {
    const groups = $$('.l-zh, .l-ko', el);
    const targets = groups.length ? groups : [el];
    const sets = targets.map(t => {
      const text = t.textContent;
      t.textContent = '';
      t.classList.add('scrub-text');
      t.setAttribute('aria-label', text);
      return Array.from(text).map(ch => {
        const span = document.createElement('span');
        span.className = 'ch';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = ch;
        t.appendChild(span);
        return span;
      });
    });
    let last = -1;
    addScene({
      el,
      update(y, vh) {
        const p = clamp((y + vh * 0.85 - this.top) / (this.height + vh * 0.5));
        if (Math.abs(p - last) < 0.002) return;
        last = p;
        sets.forEach(chars => {
          const lit = p * chars.length;
          chars.forEach((c, i) => { c.style.opacity = (0.18 + 0.82 * clamp(lit - i)).toFixed(3); });
        });
      }
    });
  });
}

/* --------------------------------------------------------------------------
   导航栏
   -------------------------------------------------------------------------- */
function renderNav(prefix = '') {
  const n = UI.nav;
  $('#nav').innerHTML = `
    <div class="nav__inner">
      <a class="nav__logo" href="index.html">${L(TOWN.name)}</a>
      <nav class="nav__links" aria-label="主导航">
        <a href="${prefix}#world">${L(n.world)}</a>
        <a href="${prefix}#characters">${L(n.characters)}</a>
        <a href="${prefix}#stickers">${L(n.stickers)}</a>
        <a href="${prefix}#making">${L(n.making)}</a>
        <a href="${prefix}#team">${L(n.team)}</a>
      </nav>
      <button class="lang-btn" type="button" aria-label="切换语言 / 언어 변경"><span>中</span><span>한</span></button>
      <button class="nav__toggle" type="button" aria-label="菜单" aria-expanded="false"><span></span><span></span></button>
    </div>`;
  const nav = $('#nav');
  $('.nav__toggle', nav).addEventListener('click', e => {
    const open = nav.classList.toggle('is-open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
  $$('.nav__links a', nav).forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));
  $('.lang-btn', nav).addEventListener('click', () => {
    setLang(getLang() === 'zh' ? 'ko' : 'zh');
    if (document.body.dataset.page === 'character') setCharacterTitle();
  });
}

/* --------------------------------------------------------------------------
   小提示 + 复制
   -------------------------------------------------------------------------- */
let toastTimer;
function toast(msg) {
  let el = $('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-show'), 1600);
}
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } finally { ta.remove(); }
  return Promise.resolve();
}

/* --------------------------------------------------------------------------
   灯箱：点击图片放大、下载、左右切换（键盘 ← → Esc 也可以）
   用法：给图片外层加 data-zoom="组名"，同组图片可以左右切换
   -------------------------------------------------------------------------- */
const lightbox = {
  items: [], index: 0, el: null,
  build() {
    this.el = document.createElement('div');
    this.el.className = 'lightbox';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'true');
    this.el.setAttribute('aria-hidden', 'true');
    this.el.innerHTML = `
      <button class="lb-btn lightbox__close" aria-label="关闭">×</button>
      <img class="lightbox__img" alt="">
      <div class="lightbox__bar">
        <button class="lb-btn" data-lb="prev" aria-label="上一张">‹</button>
        <span class="lightbox__caption"></span>
        <button class="lb-btn" data-lb="next" aria-label="下一张">›</button>
        <a class="lb-btn lb-btn--dark" data-lb="download" download>${L(UI.download)}</a>
      </div>`;
    document.body.appendChild(this.el);
    this.el.addEventListener('click', e => {
      const act = e.target.closest('[data-lb]')?.dataset.lb;
      if (act === 'prev') this.go(-1);
      else if (act === 'next') this.go(1);
      else if (e.target === this.el || e.target.closest('.lightbox__close')) this.close();
    });
    document.addEventListener('keydown', e => {
      if (!this.el.classList.contains('is-open')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.go(-1);
      if (e.key === 'ArrowRight') this.go(1);
    });
  },
  open(items, index) {
    if (!this.el) this.build();
    this.items = items; this.index = index;
    this.render();
    this.el.classList.add('is-open');
    this.el.setAttribute('aria-hidden', 'false');
    $('.lightbox__close', this.el).focus();
  },
  close() { this.el.classList.remove('is-open'); this.el.setAttribute('aria-hidden', 'true'); },
  go(step) { this.index = (this.index + step + this.items.length) % this.items.length; this.render(); },
  render() {
    const it = this.items[this.index];
    const im = $('.lightbox__img', this.el);
    im.src = it.src; im.alt = it.caption;
    $('.lightbox__caption', this.el).textContent = it.caption;
    const dl = $('[data-lb="download"]', this.el);
    dl.href = it.src;
    dl.setAttribute('download', it.src.split('/').slice(-2).join('_'));
    $$('[data-lb="prev"], [data-lb="next"]', this.el).forEach(b => { b.style.visibility = this.items.length > 1 ? '' : 'hidden'; });
  }
};
function initZoom() {
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-zoom]');
    if (!t) return;
    const group = $$(`[data-zoom="${t.dataset.zoom}"]`);
    const items = group.map(g => ({ src: g.dataset.src, caption: tx(JSON.parse(g.dataset.caption)) }));
    lightbox.open(items, group.indexOf(t));
  });
}
/* 生成一个可放大的元素属性 */
const zoomAttrs = (group, src, caption) =>
  `data-zoom="${group}" data-src="${src}" data-caption='${JSON.stringify(caption).replace(/'/g, '&#39;')}'`;


/* ==========================================================================
   首页
   ========================================================================== */
function renderHome() {
  const T = TOWN, W = T.world, P = T.purpose, C = T.classify, U = T.users, F = T.platform, A = T.ai, S = T.style;
  const charsInOrder = CHARACTERS;

  $('#app').innerHTML = `
  <!-- ============ 1. 开场 ============ -->
  <section class="intro" id="intro">
    <div class="intro__stage">
      <div class="intro__glow"></div>
      <div class="intro__title">
        <p class="intro__en">${T.en}</p>
        <h1 class="intro__h1">${L(T.name)}</h1>
        <p class="intro__sub">${L(T.tagline)}</p>
      </div>
      <div class="intro__caption">
        <h2 class="headline">${L(T.castTitle)}</h2>
        <p class="lead">${L(T.castLine)}</p>
      </div>
      <ul class="intro__cast">
        ${charsInOrder.map(c => `<li class="cast__item"><img src="${hero(c)}" alt="${both(c.name)}"><span>${L(c.name)}</span></li>`).join('')}
      </ul>
      <div class="intro__hint">${L(UI.scroll)}</div>
    </div>
  </section>

  <!-- ============ 2. 世界观 ============ -->
  <div class="night" id="world">
    <section class="section">
      <div class="container">
        <span class="eyebrow" data-reveal>${L(UI.nav.world)}</span>
        <p class="headline headline--md" data-scrub-text>${L(W.oneLine)}</p>
      </div>
    </section>

    <section class="bleed" id="bleed">
      <div class="bleed__stage">
        <div class="bleed__frame"><img src="assets/town/night.jpg" alt="${both(T.name)}"></div>
        <div class="bleed__caption">
          <h2 class="headline">${L(W.enterTitle)}</h2>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <span class="eyebrow" data-reveal>${L(W.enterTitle)}</span>
        <p class="headline headline--md" data-reveal>${L({ zh: '闭园之后，倒走三步。', ko: '폐장 후, 뒤로 세 걸음.' })}</p>
        <p class="lead" data-reveal>${L(W.enter)}</p>

        <div class="block-gap">
          <span class="eyebrow" data-reveal>${L({ zh: '禁忌 · 迷信', ko: '금기 · 미신' })}</span>
          <div class="grid-3">
            ${W.taboos.map((t, i) => `
              <div class="taboo" data-reveal style="--d:${i * 0.1}s">
                <div class="taboo__no">0${i + 1}</div>
                <p class="taboo__text">${L(t)}</p>
              </div>`).join('')}
          </div>
          <div class="cost" data-reveal>
            <div>
              <span class="eyebrow">${L({ zh: '代价', ko: '대가' })}</span>
              <p class="cost__text">${L(W.cost)}</p>
            </div>
            <div class="swatch-mini">
              ${W.colors.map(c => `<div><i style="background:${c.hex}"></i>${L(c.name)}</div>`).join('')}
            </div>
          </div>
        </div>

        <div class="block-gap">
          <span class="eyebrow" data-reveal>${L({ zh: '每位居民的奇怪性质', ko: '주민들의 이상한 성질' })}</span>
          <h2 class="headline headline--md" data-reveal>${L({ zh: '一种小动物，加一种说不清的体质。', ko: '작은 동물 하나, 그리고 설명할 수 없는 체질 하나.' })}</h2>
          <div class="quirks block-gap">
            ${CHARACTERS.map((c, i) => `
              <div class="quirk" data-reveal style="--d:${(i % 2) * 0.08}s">
                <img src="${hero(c)}" alt="" loading="lazy">
                <div><div class="quirk__name">${L(c.name)}</div><div class="quirk__text">${L(c.quirk)}</div></div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- ============ 3. 角色目的 ============ -->
  <section class="section" id="purpose" style="--c-deep:#B07A6C;--c-tint:#F9DFDA">
    <div class="container">
      <span class="eyebrow" data-reveal>${L({ zh: '角色目的', ko: '캐릭터 목적' })}</span>
      <h2 class="headline" data-reveal>${L(P.summary)}</h2>
      <div class="block-gap">
        <span class="eyebrow" data-reveal>${L({ zh: '情感契约', ko: '정서적 계약' })}</span>
        <p class="contract" data-scrub-text>${L(P.contract)}</p>
      </div>
      <div class="grid-2 block-gap">
        <div class="panel" data-reveal>
          <div class="panel__label">${L({ zh: '我们不会说', ko: '우리가 하지 않는 말' })}</div>
          <ul class="words words--no" style="margin-top:12px">${P.dont.map(w => `<li>${L(w)}</li>`).join('')}</ul>
        </div>
        <div class="panel" data-reveal style="--d:.1s">
          <div class="panel__label">${L({ zh: '我们会说', ko: '우리가 하는 말' })}</div>
          <ul class="words words--yes" style="margin-top:12px">${P.say.map(w => `<li>${L(w)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="steps block-gap">
        ${P.funnel.map((s, i) => `
          <div class="panel step" data-reveal style="--d:${i * 0.1}s">
            <div class="step__no">STEP ${i + 1}</div>
            <div class="panel__title">${L(s.title)}</div>
            <p class="panel__text">${L(s.text)}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ============ 4. 角色分类 ============ -->
  <section class="section section--white" id="classify" style="--c-deep:#B07A6C;--c-tint:#F9DFDA">
    <div class="container">
      <span class="eyebrow" data-reveal>${L({ zh: '角色分类', ko: '캐릭터 분류' })}</span>
      <h2 class="headline" data-reveal>${L(C.summary)}</h2>
      <div class="grid-4 block-gap">
        <div data-reveal>
          <div class="stat__big stat__big--sm">${C.human}</div>
          <div class="stat__label">${L({ zh: '拟人化程度', ko: '의인화 정도' })}</div>
          <p class="stat__text">${L(C.humanDetail)}</p>
        </div>
        <div data-reveal style="--d:.08s">
          <div class="stat__big stat__big--sm">2.5<small>${L({ zh: '头身', ko: '등신' })}</small></div>
          <div class="stat__label">${L({ zh: '全员统一头身比例', ko: '전원 통일 등신 비율' })}</div>
          <div class="ratio">
            <span style="height:${C.ratio[0] * 44}px">${L({ zh: '头 1', ko: '머리 1' })}</span>
            <span style="height:${C.ratio[1] * 44}px">${L({ zh: '躯干 1', ko: '몸통 1' })}</span>
            <span style="height:${C.ratio[2] * 44}px">${L({ zh: '腿 0.5', ko: '다리 0.5' })}</span>
          </div>
        </div>
        <div data-reveal style="--d:.16s">
          <div class="stat__label">${L({ zh: '行动范围', ko: '행동 범위' })}</div>
          <p class="stat__text">${L(C.range)}</p>
        </div>
        <div data-reveal style="--d:.24s">
          <div class="stat__label">${L({ zh: '自我投射', ko: '자기 투영' })}</div>
          <p class="stat__text">${L(C.projection)}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 5. 目标用户 ============ -->
  <section class="section" id="users" style="--c-deep:#5E6E8C;--c-tint:#DCE3EF">
    <div class="container">
      <span class="eyebrow" data-reveal>${L({ zh: '目标用户', ko: '사용자 타깃' })}</span>
      <h2 class="headline headline--md" data-reveal>${L(U.summary)}</h2>
      <div class="layers block-gap">
        ${U.layers.map((l, i) => `
          <div class="layer" data-reveal style="--w:${100 - i * 6}%;--a:${30 + i * 15}%;--d:${i * 0.06}s">
            <div class="layer__name">${L(l.name)}</div>
            <div class="layer__who">${L(l.who)}</div>
            <div class="layer__moment">${L(l.moment)}</div>
          </div>`).join('')}
      </div>
      <div class="persona block-gap">
        <div class="panel" data-reveal>
          <div class="panel__label">${L({ zh: '代表人物', ko: '페르소나' })}</div>
          <div class="panel__title">${L(U.personaTitle)}</div>
          <p class="panel__text">${L(U.persona)}</p>
        </div>
        <div class="panel" data-reveal style="--d:.1s">
          <div class="panel__label">${L({ zh: '付费原因', ko: '구매 이유' })}</div>
          <p class="panel__title">${L(U.payReason)}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 6. 平台 ============ -->
  <section class="section section--white" id="platform" style="--c-deep:#5E6E8C;--c-tint:#DCE3EF">
    <div class="container">
      <span class="eyebrow" data-reveal>${L({ zh: '平台', ko: '플랫폼' })}</span>
      <h2 class="headline headline--md" data-reveal>${L(F.summary)}</h2>
      <div class="grid-3 block-gap">
        ${F.stats.map((s, i) => `
          <div data-reveal style="--d:${i * 0.08}s">
            <div class="stat__big">${L(s.big)}</div>
            <div class="stat__label">${L(s.label)}</div>
          </div>`).join('')}
      </div>
      <p class="lead" data-reveal>${L({ zh: '亮点：', ko: '하이라이트: ' })}<strong>${L(F.highlight)}</strong></p>
      <div class="killer block-gap" data-reveal="scale">
        <span class="eyebrow">${L({ zh: '杀手功能', ko: '킬러 기능' })}</span>
        <div class="killer__name">「${L(F.killerName)}」</div>
        <p class="killer__text">${L(F.killer)}</p>
      </div>
      <div class="steps block-gap">
        ${F.steps.map((s, i) => `
          <div class="panel step" data-reveal style="--d:${i * 0.1}s">
            <div class="step__no">${L({ zh: '扩展顺序', ko: '확장 순서' })} ${i + 1}</div>
            <div class="panel__title">${L(s)}</div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ============ 7. 小镇日常十件事 ============ -->
  <section class="section" id="daily">
    <div class="container--wide">
      <div class="container">
        <span class="eyebrow" data-reveal style="--c-deep:#B07A6C">${L({ zh: '小镇每天必需的 10 件事', ko: '마을에 매일 필요한 일 10가지' })}</span>
        <h2 class="headline headline--md" data-reveal>${L(T.dailyTitle)}</h2>
      </div>
      <div class="daily block-gap">
        ${T.daily.map((d, i) => {
          const c = d.owner && byId(d.owner);
          return `
          <div class="task${c ? '' : ' is-vacant'}" data-reveal style="--d:${(i % 5) * 0.06}s${c ? `;--c-deep:${c.deep}` : ''}">
            <div class="task__no">${String(i + 1).padStart(2, '0')}</div>
            <p class="task__text">${L(d.text)}</p>
            <div class="task__who">${c ? `<img src="${hero(c)}" alt="" loading="lazy">${L(c.name)}` : L(UI.vacant)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </section>

  <!-- ============ 8. 角色墙 ============ -->
  <section class="section section--tight" id="characters">
    <div class="container--wide">
      <div class="hero-img" data-reveal="scale"><img src="assets/town/forest.jpg" alt="${both(T.name)}" loading="lazy"></div>
      <div class="container block-gap">
        <span class="eyebrow" data-reveal style="--c-deep:#B07A6C">${L(UI.nav.characters)}</span>
        <h2 class="headline" data-reveal>${L({ zh: '认识一下，<br>镇上的八位居民。', ko: '마을의 여덟 주민을<br>소개할게요.' })}</h2>
      </div>
      <div class="wall block-gap">
        ${CHARACTERS.map((c, i) => `
          <a class="card" href="character.html?id=${c.id}" data-reveal style="--d:${(i % 4) * 0.08}s;--c-tint:${c.tint};--c-deep:${c.deep}">
            <span class="card__no">NO.${c.no}</span>
            <h3 class="card__name">${L(c.name)}</h3>
            <p class="card__role">${L(c.role)} · ${L(c.word)}</p>
            <div class="card__img"><img src="${hero(c)}" alt="${both(c.name)}" loading="lazy"></div>
            <span class="card__more">${L(UI.more)}</span>
          </a>`).join('')}
      </div>
    </div>
  </section>

  <!-- ============ 9. 表情包 ============ -->
  <section class="section" id="stickers">
    <div class="container--wide">
      <div class="container">
        <span class="eyebrow" data-reveal style="--c-deep:#B07A6C">${L(UI.nav.stickers)}</span>
        <h2 class="headline" data-reveal>${L({ zh: '八个人，一百多种心情。', ko: '여덟 명, 백 가지가 넘는 기분.' })}</h2>
        <p class="lead" data-reveal>${L({ zh: '第 7 周完成的表情表。点击放大查看，也可以直接下载。', ko: '7주 차에 완성한 표정 시트. 클릭하면 크게 보고 다운로드할 수 있어요.' })}</p>
      </div>
      <div class="stickers block-gap">
        ${CHARACTERS.map((c, i) => `
          <button class="sticker" type="button" data-reveal style="--d:${(i % 4) * 0.06}s" ${zoomAttrs('stickers', img(c, 'sheet.jpg'), { zh: `${c.name.zh} · 表情表`, ko: `${c.name.ko} · 표정 시트` })}>
            <img src="${img(c, 'sheet.jpg')}" alt="${both(c.name)}" loading="lazy">
            <div class="sticker__info"><span class="sticker__name">${L(c.name)}</span><span class="sticker__zoom">${L({ zh: '放大 ⤢', ko: '확대 ⤢' })}</span></div>
          </button>`).join('')}
      </div>
    </div>
  </section>

  <!-- ============ 10. 幕后 ============ -->
  <section class="section section--white" id="making" style="--c-deep:#B07A6C;--c-tint:#F9DFDA">
    <div class="container">
      <span class="eyebrow" data-reveal>${L({ zh: '幕后 · 与 AI 协作的方式', ko: '제작 과정 · AI와 일한 방식' })}</span>
      <h2 class="headline headline--md" data-reveal>${L(A.summary)}</h2>
    </div>
    <div class="container--wide block-gap">
      <div class="flow">
        ${A.flow.map((f, i) => `
          <div class="panel" data-reveal style="--d:${i * 0.08}s">
            <div class="panel__label">0${i + 1}</div>
            <div class="panel__title">${L(f.title)}</div>
            <p class="panel__text">${L(f.text)}</p>
          </div>`).join('')}
      </div>
    </div>
    <div class="container block-gap">
      <div class="grid-2">
        <div data-reveal>
          <span class="eyebrow">${L({ zh: '工具分工', ko: '도구별 역할' })}</span>
          <table class="table"><tbody>
            ${A.tools.map(t => `<tr><th>${L(t.name)}</th><td>${L(t.job)}</td></tr>`).join('')}
          </tbody></table>
        </div>
        <div data-reveal style="--d:.1s">
          <span class="eyebrow">${L({ zh: '使用检查清单', ko: '사용 체크리스트' })}</span>
          <ul class="checks">${A.checks.map(c => `<li>${L(c)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="block-gap" data-reveal>
        <span class="eyebrow">${L({ zh: '最常见的失败 → 修正', ko: '가장 흔했던 실패 → 수정' })}</span>
        <div class="fixline">
          <div class="panel"><div class="panel__label">${L({ zh: '失败', ko: '실패' })}</div><div class="panel__title">${L(A.fail)}</div></div>
          <div class="fixline__arrow">→</div>
          <div class="panel"><div class="panel__label">${L({ zh: '修正', ko: '수정' })}</div><div class="panel__title">${L(A.fix)}</div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="style" style="--c-deep:#B07A6C;--c-tint:#F9DFDA">
    <div class="container">
      <span class="eyebrow" data-reveal>${L({ zh: '风格比较与后续计划', ko: '스타일 비교와 다음 계획' })}</span>
      <h2 class="headline headline--md" data-reveal>${L(S.summary)}</h2>
    </div>
    <div class="container block-gap">
      <div class="grid-2" style="align-items:start">
        <figure class="panel zoomable" style="padding:0;overflow:hidden" data-reveal="scale" ${zoomAttrs('style', 'assets/town/style.jpg', { zh: '风格比较', ko: '스타일 비교' })}>
          <img src="assets/town/style.jpg" alt="" loading="lazy">
        </figure>
        <div data-reveal style="--d:.1s">
          <span class="eyebrow">${L({ zh: '选择理由', ko: '선택 이유' })}</span>
          <p class="panel__title" style="margin:0">${L(S.reason)}</p>
          <span class="eyebrow" style="margin-top:36px">${L({ zh: '团队遵守的四条规则', ko: '팀이 지킨 규칙 넷' })}</span>
          <ol class="rules">${S.rules.map(r => `<li>${L(r)}</li>`).join('')}</ol>
        </div>
      </div>
      <div class="block-gap">
        <span class="eyebrow" data-reveal>${L({ zh: '后续连载计划', ko: '연재 계획' })}</span>
        <div class="plan">
          ${S.plan.map((p, i) => { const c = byId(p.who); return `
            <div class="panel" data-reveal style="--d:${i * 0.08}s;--c-deep:${c.deep}">
              <div class="plan__day">${L(p.day)}</div>
              <p class="plan__line">${L(p.line)}</p>
              <div class="plan__who"><img src="${hero(c)}" alt="" loading="lazy">${L(c.name)}</div>
            </div>`; }).join('')}
        </div>
      </div>
      <div class="block-gap">
        <span class="eyebrow" data-reveal>${L({ zh: '周边', ko: '굿즈' })}</span>
        <div class="grid-2">
          ${['goods_1', 'goods_2'].map((g, i) => `
            <figure class="panel zoomable" style="padding:0;overflow:hidden;--d:${i * 0.1}s" data-reveal ${zoomAttrs('goods', `assets/town/${g}.jpg`, { zh: `周边 ${i + 1}`, ko: `굿즈 ${i + 1}` })}>
              <img src="assets/town/${g}.jpg" alt="" loading="lazy">
            </figure>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 11. 团队 ============ -->
  <section class="section section--white" id="team">
    <div class="container--wide">
      <div class="container">
        <span class="eyebrow" data-reveal style="--c-deep:#B07A6C">${L(UI.nav.team)} · ${T.team.name}</span>
        <h2 class="headline" data-reveal>${L({ zh: '八位成员，<br>八位居民。', ko: '여덟 명의 팀원,<br>여덟 명의 주민.' })}</h2>
        <p class="lead" data-reveal>${L(T.team.group)} · ${T.team.course}</p>
      </div>
      <div class="hero-img block-gap zoomable" data-reveal="scale" style="max-width:720px;margin-left:auto;margin-right:auto" ${zoomAttrs('family', 'assets/town/family.jpg', { zh: '全家福', ko: '단체 사진' })}>
        <img src="assets/town/family.jpg" alt="" loading="lazy">
      </div>
      <div class="team block-gap">
        ${CHARACTERS.map((c, i) => `
          <a class="member" href="character.html?id=${c.id}" data-reveal style="--d:${(i % 4) * 0.06}s;--c-tint:${c.tint};--c-deep:${c.deep}">
            <img src="${hero(c)}" alt="" loading="lazy">
            <div class="member__name">${c.member.zh}</div>
            <div class="member__ko">${c.member.ko}</div>
            <div class="member__sid">${c.member.sid}</div>
            <div class="member__role">${L(c.name)} · ${L(c.role)}</div>
          </a>`).join('')}
      </div>
    </div>
  </section>

  <section class="thanks">
    <p class="thanks__big" data-reveal>${L(T.thanks)}</p>
    <p class="thanks__en" data-reveal>THANKS FOR LISTENING</p>
  </section>`;

  /* —— 开场动画 —— */
  const title = $('.intro__title'), glow = $('.intro__glow'), caption = $('.intro__caption'), hint = $('.intro__hint');
  const cast = $$('.cast__item');
  addScene({
    el: $('#intro'),
    update(y, vh) {
      const p = stickyProgress(this, y, vh);
      const t = easeOut(range(p, 0.02, 0.18));
      title.style.opacity = (1 - t).toFixed(3);
      title.style.transform = `translate3d(0, ${(-t * vh * 0.12).toFixed(1)}px, 0) scale(${(1 - t * 0.18).toFixed(4)})`;
      glow.style.transform = `scale(${(0.9 + p * 0.5).toFixed(4)})`;
      cast.forEach((el, i) => {
        const start = 0.1 + i * 0.07;
        const e = easeOut(range(p, start, start + 0.14));
        el.style.opacity = e.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - e) * vh * 0.45).toFixed(1)}px, 0) scale(${(0.85 + e * 0.15).toFixed(4)})`;
      });
      const c = easeOut(range(p, 0.7, 0.85));
      caption.style.opacity = c.toFixed(3);
      caption.style.transform = `translate3d(0, ${((1 - c) * 30).toFixed(1)}px, 0)`;
      hint.style.opacity = (1 - range(p, 0, 0.04)).toFixed(3);
    }
  });

  /* —— 深夜小镇大图：从圆角小图放大到铺满全屏 —— */
  const frame = $('.bleed__frame'), frameImg = $('.bleed__frame img'), bleedCap = $('.bleed__caption');
  addScene({
    el: $('#bleed'),
    update(y, vh) {
      const p = stickyProgress(this, y, vh);
      const g = easeOut(range(p, 0, 0.55));
      frame.style.transform = `scale(${(0.62 + g * 0.38).toFixed(4)})`;
      frame.style.borderRadius = `${((1 - g) * 40).toFixed(1)}px`;
      frameImg.style.transform = `scale(${(1.25 - g * 0.25).toFixed(4)})`;
      const c = easeOut(range(p, 0.5, 0.75));
      bleedCap.style.opacity = c.toFixed(3);
      bleedCap.style.transform = `translate3d(0, ${((1 - c) * 30).toFixed(1)}px, 0)`;
    }
  });
}


/* ==========================================================================
   角色详情页
   ========================================================================== */
let currentChar;
function setCharacterTitle() {
  document.title = `${tx(currentChar.name)} · ${tx(currentChar.role)} — ${tx(TOWN.name)}`;
}

function renderCharacter() {
  const id = new URLSearchParams(location.search).get('id') || CHARACTERS[0].id;
  const idx = Math.max(0, CHARACTERS.findIndex(c => c.id === id));
  const c = CHARACTERS[idx];
  const next = CHARACTERS[(idx + 1) % CHARACTERS.length];
  currentChar = c;

  const root = document.documentElement;
  root.style.setProperty('--c-tint', c.tint);
  root.style.setProperty('--c-deep', c.deep);
  $('meta[name="theme-color"]')?.setAttribute('content', c.tint);
  setCharacterTitle();

  const taskNo = String(TOWN.daily.findIndex(d => d.owner === c.id) + 1).padStart(2, '0');
  const capOf = (zh, ko) => ({ zh: `${c.name.zh} · ${zh}`, ko: `${c.name.ko} · ${ko}` });

  $('#app').innerHTML = `
    <!-- 1. 首屏 -->
    <section class="ch-hero" id="chHero">
      <div class="ch-hero__stage">
        <div class="ch-hero__text">
          <span class="eyebrow">NO.${c.no} · ${L(c.role)}</span>
          <h1 class="ch-hero__name">${L(c.name)}</h1>
        </div>
        <p class="ch-hero__line">${c.quote ? `「${L(c.quote)}」` : L(c.hook)}<small>${L(c.word)} · ${c.member.zh} ${c.member.ko}</small></p>
        <img class="ch-hero__img" src="${hero(c)}" alt="${both(c.name)}">
      </div>
    </section>

    <!-- 2. 性格 -->
    <section class="section" id="personality">
      <div class="container">
        <span class="eyebrow" data-reveal>${L({ zh: '性格一词', ko: '성격 한 단어' })}</span>
        <h2 class="headline" data-reveal>${L({ zh: c.word.zh + '。', ko: c.word.ko + '.' })}</h2>
        <p class="lead" data-reveal>${L({ zh: '奇怪的性质：', ko: '이상한 성질: ' })}<strong>${L(c.quirk)}</strong></p>
        <div class="facts block-gap">
          ${[[{ zh: '习惯', ko: '버릇' }, c.habit], [{ zh: '喜欢的', ko: '좋아하는 것' }, c.likes], [{ zh: '讨厌的', ko: '싫어하는 것' }, c.dislikes],
             [{ zh: '空间', ko: '공간' }, c.space], [{ zh: '基调', ko: '톤' }, c.tone], [{ zh: '小规则', ko: '작은 룰' }, c.rule]]
            .map(([k, v], i) => `
            <div class="fact" data-reveal style="--d:${(i % 3) * 0.08}s">
              <div class="fact__label">${L(k)}</div>
              <div class="fact__value">${L(v)}</div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- 3. 形态与永久缺失 -->
    <section class="section flaw" id="flaw">
      <div class="container">
        <span class="eyebrow" data-reveal>01 · ${L({ zh: '永久缺失', ko: '영구 결핍' })}</span>
        <p class="flaw__text" data-scrub-text>${L(c.flaw)}</p>
        <p class="flaw__form" data-reveal>${L({ zh: '形态：', ko: '형태: ' })}${L(c.form)}</p>
      </div>
    </section>

    <!-- 4. 专属动词与日常工作 -->
    <section class="section center" id="verbs">
      <div class="container">
        <span class="eyebrow" data-reveal>02 · ${L({ zh: '专属动词', ko: '전용 동사' })}</span>
        ${Llist(c.verbs, v => `<span class="verb">${v}</span>`, 'div', 'verbs')}
        <div class="chip" data-reveal><b>${taskNo}</b>${L(c.work)}</div>
      </div>
    </section>

    <!-- 5. 理由与道具 -->
    <section class="section section--white" id="reason">
      <div class="container">
        <span class="eyebrow" data-reveal>03 · ${L({ zh: '做这件事的理由 · 道具', ko: '이 일을 하는 이유 · 소품' })}</span>
        <p class="reason" data-reveal>${L(c.reason)}</p>
        ${Llist(c.items, it => `<span class="item">${it}</span>`, 'div', 'items')}
      </div>
    </section>

    <!-- 6. 变形条件与四格 -->
    <section class="section" id="transform">
      <div class="container">
        <span class="eyebrow" data-reveal>04 · ${L({ zh: '变形条件与扩展', ko: '변형 조건과 확장' })}</span>
        <h2 class="headline headline--md" data-reveal>${L(c.transform)}</h2>
        <div class="block-gap">
          ${['zh', 'ko'].map(k => `
            <div class="comic l-${k}" lang="${k === 'ko' ? 'ko' : 'zh-CN'}">
              ${c.comic[k].map((t, i) => `
                <div class="panel4" data-reveal style="--d:${i * 0.1}s">
                  <div class="panel4__no">${i + 1}</div>
                  <p class="panel4__text">${t}</p>
                </div>`).join('')}
            </div>`).join('')}
        </div>
        <p class="lead" data-reveal>${L({ zh: '周边：', ko: '굿즈: ' })}<strong>${L(c.goods)}</strong></p>
      </div>
    </section>

    <!-- 7. 配色卡 -->
    <section class="section section--tight" id="palette">
      <div class="container">
        <span class="eyebrow" data-reveal>${L({ zh: '配色卡', ko: '컬러 팔레트' })}</span>
        <h2 class="headline headline--md" data-reveal>${L(c.tone)}</h2>
        <p class="lead" data-reveal>${L({ zh: '从定稿形象中提取的五种颜色。点击色块即可复制色号。', ko: '최종 이미지에서 뽑은 다섯 가지 색. 색을 클릭하면 코드가 복사돼요.' })}</p>
        <div class="swatches block-gap">
          ${c.palette.map((hex, i) => `
            <button class="swatch" type="button" data-hex="${hex}" data-reveal style="--d:${i * 0.07}s" aria-label="${hex}">
              <div class="swatch__color" style="background:${hex}"></div>
              <div class="swatch__info"><div class="swatch__hex">${hex}</div><div class="swatch__tip">${L(UI.clickCopy)}</div></div>
            </button>`).join('')}
        </div>
      </div>
    </section>

    <!-- 8. 造型实验 -->
    <section class="section" id="lab">
      <div class="container">
        <span class="eyebrow" data-reveal>I-2 · ${L({ zh: '造型实验（第 6 周）', ko: '조형 실험 (6주 차)' })}</span>
        <h2 class="headline headline--md" data-reveal>${L({ zh: '先放开去试，<br>再回到最适合的样子。', ko: '마음껏 실험해 보고,<br>가장 어울리는 모습으로.' })}</h2>
        ${Llist(c.experiment, r => `<li>${r}</li>`, 'ol', 'rules block-gap')}
      </div>
      <div class="container--wide block-gap">
        <div class="lab">
          ${[['card.jpg', { zh: '定稿', ko: '최종' }], ['ai_1.jpg', { zh: '实验 A', ko: '실험 A' }], ['ai_2.jpg', { zh: '实验 B', ko: '실험 B' }]].map(([f, label], i) => `
            <figure class="zoomable" data-reveal style="--d:${i * 0.08}s" ${zoomAttrs('lab', img(c, f), capOf(label.zh, label.ko))}>
              <img src="${img(c, f)}" alt="" loading="lazy">
              <figcaption><span class="tag">${L(label)}</span></figcaption>
            </figure>`).join('')}
        </div>
      </div>
    </section>

    <!-- 9. 表情表 -->
    <section class="section section--white" id="sheet">
      <div class="container">
        <span class="eyebrow" data-reveal>I-2 · ${L({ zh: '表情表（第 7 周）', ko: '표정 시트 (7주 차)' })}</span>
        <h2 class="headline headline--md" data-reveal>${L({ zh: '每一种心情，都有一张脸。', ko: '모든 기분에는 얼굴이 있어요.' })}</h2>
        <div class="sheet block-gap zoomable" id="sheetBox" ${zoomAttrs('sheet', img(c, 'sheet.jpg'), capOf('表情表', '표정 시트'))}>
          <img src="${img(c, 'sheet.jpg')}" alt="" loading="lazy">
        </div>
      </div>
    </section>

    <!-- 10. 三种姿势 -->
    <section class="section" id="poses">
      <div class="container--wide">
        <div class="container">
          <span class="eyebrow" data-reveal>I-2 · ${L({ zh: '3 种姿势（第 7 周）', ko: '포즈 3종 (7주 차)' })}</span>
          <h2 class="headline headline--md" data-reveal>${L({ zh: '伸展、收缩、放松。', ko: '펴고, 웅크리고, 쉬고.' })}</h2>
        </div>
        <div class="poses block-gap">
          ${c.poses.map((p, i) => `
            <div class="pose" data-reveal style="--d:${i * 0.08}s">
              <div class="pose__img zoomable" ${zoomAttrs('poses', img(c, `pose_${i + 1}.jpg`), { zh: `${c.name.zh} · ${p.name.zh}`, ko: `${c.name.ko} · ${p.name.ko}` })}>
                <img src="${img(c, `pose_${i + 1}.jpg`)}" alt="" loading="lazy">
              </div>
              <div class="pose__info"><div class="pose__name">${L(p.name)}</div><p class="pose__desc">${L(p.desc)}</p></div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- 11. 设计者 + 下一位 -->
    <section class="section section--tight" id="credit">
      <div class="container">
        <div class="grid-2">
          <div class="panel" data-reveal>
            <div class="panel__label">${L({ zh: '角色设计', ko: '캐릭터 디자인' })}</div>
            <div class="panel__title">${c.member.zh} · ${c.member.ko}</div>
            <p class="panel__text">${c.member.sid}</p>
          </div>
          <div class="panel" data-reveal style="--d:.08s">
            <div class="panel__label">${L({ zh: '日常工作', ko: '일과' })} · ${taskNo}</div>
            <div class="panel__title">${L(c.work)}</div>
          </div>
        </div>
        <a class="next-link" href="character.html?id=${next.id}" data-reveal>
          <div><div class="next-link__label">${L(UI.next)}</div><div class="next-link__name">${L(next.name)} ›</div></div>
          <img src="${hero(next)}" alt="">
        </a>
      </div>
    </section>`;

  /* —— 配色卡：点击复制 —— */
  $$('.swatch').forEach(btn => btn.addEventListener('click', () => {
    copyText(btn.dataset.hex).then(() => toast(`${tx(UI.copied)} ${btn.dataset.hex}`));
  }));

  /* —— 首屏：名字退场 → 立绘放大 → 一句话出现 —— */
  const heroText = $('.ch-hero__text'), heroImg = $('.ch-hero__img'), heroLine = $('.ch-hero__line');
  addScene({
    el: $('#chHero'),
    update(y, vh) {
      const p = stickyProgress(this, y, vh);
      const t = easeOut(range(p, 0, 0.4));
      heroText.style.opacity = (1 - t).toFixed(3);
      heroText.style.transform = `translate3d(0, ${(-t * 60).toFixed(1)}px, 0) scale(${(1 - t * 0.08).toFixed(4)})`;
      const s = easeOut(range(p, 0, 0.9));
      heroImg.style.transform = `translate3d(-50%, ${(-s * vh * 0.04).toFixed(1)}px, 0) scale(${(1 + s * 0.1).toFixed(4)})`;
      const q = easeOut(range(p, 0.38, 0.68));
      heroLine.style.opacity = q.toFixed(3);
      heroLine.style.transform = `translate3d(0, ${((1 - q) * 40).toFixed(1)}px, 0)`;
    }
  });

  /* —— 专属动词：一个接一个放大出现 —— */
  $$('.verbs').forEach(group => {
    const words = $$('.verb', group);
    addScene({
      el: group,
      update(y, vh) {
        const p = enterProgress(this, y, vh, 0.8);
        words.forEach((w, i) => {
          const e = easeOut(range(p, i * 0.1, i * 0.1 + 0.5));
          w.style.opacity = (0.12 + e * 0.88).toFixed(3);
          w.style.transform = `translate3d(0, ${((1 - e) * 40).toFixed(1)}px, 0) scale(${(0.8 + e * 0.2).toFixed(4)})`;
        });
      }
    });
  });

  /* —— 表情表：进入时从 0.9 放大到原尺寸 —— */
  const sheet = $('#sheetBox');
  addScene({
    el: sheet,
    update(y, vh) {
      const p = easeOut(enterProgress(this, y, vh, 0.8));
      sheet.style.transform = `scale(${(0.9 + p * 0.1).toFixed(4)})`;
    }
  });
}


/* ==========================================================================
   启动
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) { /* 忽略 */ }
  setLang(saved === 'ko' ? 'ko' : 'zh');

  const page = document.body.dataset.page;
  renderNav(page === 'home' ? '' : 'index.html');
  if (page === 'home') renderHome();
  if (page === 'character') renderCharacter();
  initZoom();
  initScrubText();
  initReveal();
  startEngine();
});
