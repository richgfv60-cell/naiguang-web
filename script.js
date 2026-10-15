/* ==========================================================================
   奶光镇 · 全站脚本
   --------------------------------------------------------------------------
   这个文件分成两部分：
   ① 【内容数据】—— 所有角色的文字都在这里，想改文字直接改引号里的内容
   ② 【页面功能】—— 渲染页面、滚动动画、放大查看等，一般不需要改
   ========================================================================== */


/* ==========================================================================
   ① 内容数据
   ========================================================================== */

/* 小镇日常十件事（角色页「专属动词」部分会引用任务编号） */
const TASKS = {
  '01': '清晨摇铃叫醒全镇',
  '02': '给纸盒灯换情绪电池',
  '03': '巡逻广场维持秩序',
  '04': '接收新到的情绪碎片包裹',
  '05': '整理当日烦恼仓库',
  '06': '广播今日情绪天气预报',
  '07': '深夜巡岗，接住睡不着的人',
  '08': '调解镇上小纠纷',
  '09': '给新来的人做欢迎仪式',
  '10': '熄灯前最后一次全镇安抚'
};

/* 8 位角色
   字段说明：
   - id        网址里用的英文名（character.html?id=这里）
   - no        编号，同时决定图片文件名：assets/hero_编号.png、assets/turn_clean_编号.png
   - ready     true = 详情页已开放；false = 角色墙上显示「即将上线」
   - tint/deep 详情页的主色：tint 是浅色背景，deep 是深色标题
   - palette   配色卡（色号）
   - emotes    7 个精选表情：[中文, 英文, 类型]；类型写「签名动作」的会显示成大格
               表情图片文件名：assets/emo_编号_顺序.png，例如 emo_01_1.png */
const CHARACTERS = [
  {
    id: 'naitu', no: '01', ready: true,
    name: '奶兔', animal: '兔', role: '情绪治愈官', personality: '温柔治愈',
    quote: '没关系没关系，我在呢',
    tint: '#F2D6CC', deep: '#8D4635',
    palette: ['#8D4635', '#AA6D6C', '#B4593F', '#E7B7A9', '#F4E5CA'],
    quirk: '心情越低落，耳朵越会自己卷起来',
    habit: '没事就摸自己耳朵',
    likes: '被夸「今天很棒」',
    dislikes: '突然的大声音',
    place: '纸盒收发站',
    rule: '每天只能说 3 次「没关系」，说多了会失效',
    flaw: '听不得重话，一被说重就耷拉耳朵一整天。',
    verb: '轻拍', tasks: ['04', '10'],
    item: '一颗会发光的奶白色爱心', itemShape: 'heart',
    transform: '连续安慰三个人之后，会短暂「满电」发光。',
    goods: '桌面宠物（耳朵随系统电量 / 心情卷起）＋ 日常治愈表情包',
    member: { name: '王嘉诚', ko: '왕가성', sid: '202323150' },
    emotes: [
      ['开心', 'Happy', '基础'], ['生气', 'Angry', '基础'], ['太累了', 'Tired', '基础'],
      ['吓一跳', 'Startled', '基础'], ['被窝很危险', 'Safe in Bed', '签名动作'],
      ['爱你', 'Love', '延伸'], ['鞠躬问候', 'Bow', '延伸']
    ]
  },
  {
    id: 'naimao', no: '02', ready: false,
    name: '奶猫', animal: '猫', role: '气氛观察员', personality: '高冷傲娇',
    quote: '……才没有很开心',
    tint: '#FBD9C2', deep: '#AA6D6C',
    palette: ['#FBC5A1', '#AA6D6C', '#F7ECD9', '#F4AEB1'],
    quirk: '开心到一定程度会突然隐身三秒',
    habit: '开心会藏起来不让人看见',
    likes: '安静待着被需要',
    dislikes: '被看穿情绪',
    place: '镇上安静角落的躲猫猫屋',
    rule: '一天只现身说一句真心话',
    flaw: '极度害怕被当众表扬。',
    verb: '隐身', tasks: ['06'],
    item: '一只戴着的铃铛耳环',
    transform: '真正开心到顶点时会消失 3 秒，再出现时毛更蓬松。',
    goods: '「已读unresponsive」隐身主题聊天贴纸 ＋ 傲娇语音便签',
    member: { name: '岳耀森', ko: '악요삼', sid: '202323143' },
    emotes: [
      ['开心', 'Happy', '基础'], ['生气', 'Angry', '基础'], ['太累了', 'Tired', '基础'],
      ['吓一跳', 'Startled', '基础'], ['完全没电', 'Dead Battery', '签名动作'],
      ['探头', 'Peek', '延伸'], ['生闷气', 'Sulking', '延伸']
    ]
  },
  {
    id: 'naicang', no: '03', ready: false,
    name: '奶仓', animal: '仓鼠', role: '烦恼收集员', personality: '话痨但贴心',
    quote: '说吧说吧，我都听着呢',
    tint: '#F1D5BC', deep: '#9A5F45',
    palette: ['#AA6D6C', '#DEA67B', '#E7B7A9', '#F4E5CA'],
    quirk: '把别人的烦恼当瓜子一直嗑不停',
    habit: '把别人的烦恼当瓜子一直嗑',
    likes: '听八卦式的倾诉',
    dislikes: '别人憋着不说',
    place: '情绪仓库',
    rule: '听到的秘密绝不外传，除非打嗝说漏嘴',
    flaw: '存太多别人的烦恼，自己会打嗝。',
    verb: '收集', tasks: ['02', '05'],
    item: '随身小麻袋',
    transform: '听满 100 件烦恼后，两颊会鼓成满满的情绪仓库。',
    goods: '「今日份烦恼」语音便签小组件 ＋ 嗑瓜子解压动态贴纸',
    member: { name: '马祖豪', ko: '마쭈하오', sid: '202323160' },
    emotes: [
      ['开心', 'Happy', '基础'], ['生气', 'Angry', '基础'], ['太累了', 'Tired', '基础'],
      ['吓一跳', 'Startled', '基础'], ['啦啦啦', 'Lalala Dance', '签名动作'],
      ['最棒了', 'Awesome', '延伸'], ['呼呼吹气', 'Blowing Steam', '延伸']
    ]
  },
  {
    id: 'naixiong', no: '04', ready: false,
    name: '奶熊', animal: '熊', role: '广场护卫员', personality: '嘴硬心软',
    quote: '才…才不是担心你',
    tint: '#E3CBBB', deep: '#7A5243',
    palette: ['#AA6D6C', '#DEA67B', '#E7B7A9', '#F4E5CA'],
    quirk: '生气的时候会变成两倍大，消气后缩回去还带点委屈',
    habit: '生气时变大，消气后缩回去还带点委屈',
    likes: '被需要却嘴上说不要',
    dislikes: '被敷衍对待',
    place: '广场岗哨',
    rule: '帮完忙一定要假装「顺路」',
    flaw: '不会主动说「我需要帮助」。',
    verb: '守护', tasks: ['03'],
    item: '一条围脖',
    transform: '为别人出头的瞬间，体型会翻倍。',
    goods: '生气变大动态头像 ＋ 直播弹幕挂件',
    member: { name: '董昊鑫', ko: '둥하오신', sid: '202323162' },
    emotes: [
      ['开心', 'Happy', '基础'], ['生气', 'Angry', '基础'], ['太累了', 'Tired', '基础'],
      ['吓一跳', 'Startled', '基础'], ['最棒了', 'Awesome', '签名动作'],
      ['对不起', 'Sorry', '延伸'], ['歪头疑惑', 'Puzzled Head Tilt', '延伸']
    ]
  },
  {
    id: 'naiqi', no: '05', ready: false,
    name: '奶企', animal: '企鹅', role: '心情播报员', personality: '容易感动',
    quote: '呜哇——好感动！',
    tint: '#DCE9F1', deep: '#374B5B',
    palette: ['#374B5B', '#3B4A5C', '#ECF8FD', '#FC9A4F'],
    quirk: '感动的时候会原地转圈直到晕',
    habit: '感动时会原地转圈',
    likes: '小事被记住',
    dislikes: '被冷落',
    place: '广播站',
    rule: '每天播报一条「今日份小确幸」',
    flaw: '转多了会晕，晕了才说真心话。',
    verb: '转圈', tasks: ['01'],
    item: '一只小喇叭',
    transform: '转圈超过 3 圈会头晕摔倒，然后开始胡言乱语式安慰。',
    goods: '转圈播报天气 / 日程提醒小组件 ＋ 感动落泪表情包',
    member: { name: '陈舒新', ko: '첸슈신', sid: '202323119' },
    emotes: [
      ['开心', 'Happy', '基础'], ['生气', 'Angry', '基础'], ['太累了', 'Tired', '基础'],
      ['吓一跳', 'Startled', '基础'], ['啦啦啦', 'Lalala Dance', '签名动作'],
      ['爱你', 'Love', '延伸'], ['又开心了', 'Happy Again', '延伸']
    ]
  },
  {
    id: 'naihu', no: '06', ready: false,
    name: '奶狐', animal: '狐（红熊猫基调）', role: '纠纷调解员', personality: '看似精明实则嘴笨',
    quote: '这件事，交给我调解',
    tint: '#EECBBB', deep: '#8D4635',
    palette: ['#8D4635', '#AA6D6C', '#B4593F', '#E7B7A9', '#F4E5CA'],
    quirk: '说谎话尾巴会自己竖起来，自己却毫无察觉',
    habit: '说谎尾巴会自己竖起来，自己却毫无察觉',
    likes: '被识破也不尴尬的关系',
    dislikes: '被怀疑没良心',
    place: '纠纷调解亭',
    rule: '帮人调解时自己从不插话评判对错',
    flaw: '嘴笨，词不达意，常被误会。',
    verb: '调解', tasks: ['08'],
    item: '一本调解账本',
    transform: '说出一句真心话的瞬间，尾巴会瞬间炸毛。',
    goods: '说谎检测尾巴动画表情 ＋ 调解语录贴纸',
    member: { name: '王泓森', ko: '왕홍선', sid: '202323121' },
    emotes: [
      ['开心', 'Happy', '基础'], ['生气', 'Angry', '基础'], ['太累了', 'Tired', '基础'],
      ['吓一跳', 'Startled', '基础'], ['歪头疑惑', 'Puzzled Head Tilt', '签名动作'],
      ['对不起', 'Sorry', '延伸'], ['鞠躬问候', 'Bow', '延伸']
    ]
  },
  {
    id: 'naihai', no: '07', ready: false,
    name: '奶海', animal: '海豹', role: '深夜守夜员', personality: '看似淡定其实很怂',
    quote: '我、我才没有紧张',
    tint: '#DCEBEA', deep: '#374B5B',
    palette: ['#374B5B', '#9AA085', '#EAF8F7', '#3BA45C'],
    quirk: '紧张的时候全身会渗出奶汗，黏糊糊的',
    habit: '紧张的时候全身会渗出黏糊糊的奶汗',
    likes: '被悄悄保护而不说破',
    dislikes: '被突然点名',
    place: '深夜岗哨',
    rule: '只在夜里说真心话',
    flaw: '怂，遇到大场面会先缩成球。',
    verb: '缩成一团', tasks: ['07'],
    item: '一条小毛毯',
    transform: '极度紧张时，会整只缩成一个奶白色的球。',
    goods: '深夜陪伴桌宠（屏幕角落缩成球）＋ 紧张冒汗表情包',
    member: { name: '张玉洋', ko: '장위양', sid: '202323120' },
    emotes: [
      ['开心', 'Happy', '基础'], ['生气', 'Angry', '基础'], ['太累了', 'Tired', '基础'],
      ['吓一跳', 'Startled', '基础'], ['局促不安', 'Cautious Walk', '签名动作'],
      ['发呆', 'Daze', '延伸'], ['呼呼吹气', 'Blowing Steam', '延伸']
    ]
  },
  {
    id: 'naixiaoxiongmao', no: '08', ready: false,
    name: '奶小熊猫', animal: '小熊猫', role: '迎新接待员', personality: '社恐型可爱',
    quote: '呜……被发现了',
    tint: '#F5E0C2', deep: '#7D6F60',
    palette: ['#958C7F', '#AA6D6C', '#E7B7A9', '#F3D3A1', '#F7E7CE'],
    quirk: '一有人夸它就原地装死',
    habit: '一有人夸它就原地装死',
    likes: '被肯定又不敢承认',
    dislikes: '当众表扬',
    place: '欢迎亭',
    rule: '装死超过 10 秒，真的会睡着',
    flaw: '社恐，人一多就会躲起来。',
    verb: '装死', tasks: ['09'],
    item: '一片干净的叶子当盾牌',
    transform: '装死超过 10 秒，会真的睡着。',
    goods: '装死表情包 ＋「假装不在线」状态图标',
    member: { name: '陶朝伟', ko: '도조위', sid: '202323169' },
    emotes: [
      ['开心', 'Happy', '基础'], ['生气', 'Angry', '基础'], ['太累了', 'Tired', '基础'],
      ['吓一跳', 'Startled', '基础'], ['呼噜呼噜', 'Snore', '签名动作'],
      ['探头', 'Peek', '延伸'], ['发呆', 'Daze', '延伸']
    ]
  }
];


/* ==========================================================================
   ② 页面功能（以下一般不需要修改）
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (p, start, end) => clamp((p - start) / (end - start)); // 把进度 p 映射到 [start, end] 区间
const easeOut = t => 1 - Math.pow(1 - t, 3);                         // 缓出曲线，让动作更柔和
const heroSrc = c => `assets/hero_${c.no}.png`;
const turnSrc = c => `assets/turn_clean_${c.no}.png`;
const emoteSrc = (c, i) => `assets/emo_${c.no}_${i + 1}.png`;
const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/* 用户是否开启了「减少动态效果」 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* --------------------------------------------------------------------------
   滚动动画引擎
   - 每个「场景」在窗口大小变化时记录自己的位置（measure）
   - 滚动时只读取 scrollY，在同一帧里统一更新 transform / opacity（update）
   - 这样不会反复测量页面布局，能稳定跑满 60fps
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
    if (s.measure) s.measure();
  });
}

function updateAll() {
  ticking = false;
  if (reduceMotion.matches) return;
  const y = window.scrollY;
  const vh = window.innerHeight;
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
  // 页面高度变化（图片、字体加载完）时重新测量
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { measureAll(); requestUpdate(); }).observe(document.body);
  }
  // 用户中途切换「减少动态效果」时，清掉动画留下的样式
  reduceMotion.addEventListener?.('change', () => {
    if (reduceMotion.matches) $$('[style*="transform"], [style*="opacity"]').forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
    requestUpdate();
  });
}

/* 吸顶舞台的进度：0 = 刚到顶部，1 = 即将离开 */
function stickyProgress(s, y, vh) {
  return clamp((y - s.top) / Math.max(1, s.height - vh));
}

/* --------------------------------------------------------------------------
   滚动淡入：元素进入屏幕时加上 .is-in
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
      // 淡入结束后移除标记，让卡片自己的悬停动画恢复正常速度
      const delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
      setTimeout(() => { el.removeAttribute('data-reveal'); el.classList.remove('is-in'); }, 1200 + delay * 1000);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  els.forEach(el => io.observe(el));
}

/* --------------------------------------------------------------------------
   逐字点亮：带 data-scrub-text 的文字，随滚动一个字一个字变亮
   -------------------------------------------------------------------------- */
function initScrubText() {
  $$('[data-scrub-text]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    el.classList.add('scrub-text');
    el.setAttribute('aria-label', text);
    const chars = Array.from(text).map(ch => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch;
      el.appendChild(span);
      return span;
    });
    let last = -1;
    addScene({
      el,
      update(y, vh) {
        // 文字从屏幕 85% 处开始点亮，到屏幕 35% 处全部点亮
        const p = clamp((y + vh * 0.85 - this.top) / (this.height + vh * 0.5));
        const lit = p * chars.length;
        if (Math.abs(lit - last) < 0.01) return;
        last = lit;
        chars.forEach((c, i) => { c.style.opacity = (0.18 + 0.82 * clamp(lit - i)).toFixed(3); });
      }
    });
  });
}

/* --------------------------------------------------------------------------
   导航栏：手机端菜单开关
   -------------------------------------------------------------------------- */
function initNav() {
  const nav = $('.nav');
  const btn = $('.nav__toggle');
  if (!nav || !btn) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
  });
  $$('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));
}

/* --------------------------------------------------------------------------
   小提示（例如「已复制色号」）
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
  // 兼容写法：本地双击打开时某些浏览器不支持 clipboard
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } finally { ta.remove(); }
  return Promise.resolve();
}

/* --------------------------------------------------------------------------
   灯箱：点击图片放大、可下载、可左右切换（键盘 ← → 和 Esc 也能用）
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
        <a class="lb-btn lb-btn--dark" data-lb="download" download>下载</a>
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
  close() {
    this.el.classList.remove('is-open');
    this.el.setAttribute('aria-hidden', 'true');
  },
  go(step) {
    this.index = (this.index + step + this.items.length) % this.items.length;
    this.render();
  },
  render() {
    const it = this.items[this.index];
    const img = $('.lightbox__img', this.el);
    img.src = it.src; img.alt = it.caption;
    $('.lightbox__caption', this.el).textContent = it.caption;
    const dl = $('[data-lb="download"]', this.el);
    dl.href = it.src;
    dl.setAttribute('download', it.src.split('/').pop());
    const multi = this.items.length > 1;
    $$('[data-lb="prev"], [data-lb="next"]', this.el).forEach(b => { b.style.visibility = multi ? '' : 'hidden'; });
  }
};


/* ==========================================================================
   首页
   ========================================================================== */
function renderHome() {
  // 开场的 8 个角色
  $('#cast').innerHTML = CHARACTERS.map(c => `
    <li class="cast__item">
      <img src="${heroSrc(c)}" alt="${c.name}">
      <span>${c.name}</span>
    </li>`).join('');

  // 角色墙卡片
  $('#wall').innerHTML = CHARACTERS.map((c, i) => {
    const tag = c.ready ? 'a' : 'div';
    const href = c.ready ? ` href="character.html?id=${c.id}"` : '';
    return `
    <${tag} class="card${c.ready ? '' : ' is-soon'}"${href} data-reveal style="--d:${(i % 4) * 0.08}s; --c-tint:${c.tint}; --c-deep:${c.deep}">
      <span class="card__no">NO.${c.no}</span>
      <h3 class="card__name">${c.name}</h3>
      <p class="card__role">${c.role} · ${c.personality}</p>
      <div class="card__img"><img src="${heroSrc(c)}" alt="${c.name}" loading="lazy"></div>
      <span class="card__more">${c.ready ? '了解更多' : '即将上线'}</span>
    </${tag}>`;
  }).join('');

  // 开场滚动动画
  const intro = $('#intro');
  const title = $('.intro__title');
  const glow = $('.intro__glow');
  const caption = $('.intro__caption');
  const hint = $('.intro__hint');
  const cast = $$('.cast__item');
  addScene({
    el: intro,
    update(y, vh) {
      const p = stickyProgress(this, y, vh);

      // 1) 标题：向上淡出并缩小
      const t = easeOut(range(p, 0.02, 0.18));
      title.style.opacity = (1 - t).toFixed(3);
      title.style.transform = `translate3d(0, ${(-t * vh * 0.12).toFixed(1)}px, 0) scale(${(1 - t * 0.18).toFixed(4)})`;

      // 2) 奶光：慢慢扩散
      glow.style.transform = `scale(${(0.9 + p * 0.5).toFixed(4)})`;

      // 3) 角色：一个接一个从下方升起
      cast.forEach((el, i) => {
        const start = 0.1 + i * 0.07;
        const e = easeOut(range(p, start, start + 0.14));
        el.style.opacity = e.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - e) * vh * 0.45).toFixed(1)}px, 0) scale(${(0.85 + e * 0.15).toFixed(4)})`;
      });

      // 4) 收尾文字
      const c = easeOut(range(p, 0.7, 0.85));
      caption.style.opacity = c.toFixed(3);
      caption.style.transform = `translate3d(0, ${((1 - c) * 30).toFixed(1)}px, 0)`;

      // 5) 「向下滚动」提示
      hint.style.opacity = (1 - range(p, 0, 0.04)).toFixed(3);
    }
  });
}


/* ==========================================================================
   角色详情页
   ========================================================================== */

/* 道具图标：目前只有奶兔的爱心，其他角色先用发光圆点代替 */
const ITEM_SHAPES = {
  heart: `<svg viewBox="0 0 100 92" aria-hidden="true"><path fill="#FFF9EF" stroke="#AA6D6C" stroke-width="4" stroke-linejoin="round" d="M50 86C22 66 6 50 6 30 6 16 17 6 30 6c9 0 16 5 20 12 4-7 11-12 20-12 13 0 24 10 24 24 0 20-16 36-44 56z"/></svg>`,
  dot: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="#FFF9EF" stroke="#AA6D6C" stroke-width="4"/></svg>`
};

function renderCharacter() {
  const id = new URLSearchParams(location.search).get('id') || 'naitu';
  const idx = Math.max(0, CHARACTERS.findIndex(c => c.id === id));
  const c = CHARACTERS[idx];
  const next = CHARACTERS[(idx + 1) % CHARACTERS.length];

  // 设置本页主色、标题
  const root = document.documentElement;
  root.style.setProperty('--c-tint', c.tint);
  root.style.setProperty('--c-deep', c.deep);
  document.title = `${c.name} · ${c.role} — 奶光镇`;
  $('meta[name="theme-color"]')?.setAttribute('content', c.tint);

  // 签名动作排在第一个（显示为大格）
  const emotes = c.emotes.map((e, i) => ({ zh: e[0], en: e[1], type: e[2], src: emoteSrc(c, i) }));
  emotes.sort((a, b) => (b.type === '签名动作') - (a.type === '签名动作'));

  $('#app').innerHTML = `
    <!-- 1. 首屏 -->
    <section class="ch-hero" id="chHero">
      <div class="ch-hero__stage">
        <div class="ch-hero__text">
          <span class="eyebrow">NO.${c.no} · ${c.role} · ${c.personality}</span>
          <h1 class="ch-hero__name">${c.name}</h1>
        </div>
        <p class="ch-hero__quote">「${c.quote}」<small>—— ${c.name}的口头禅</small></p>
        <img class="ch-hero__img" src="${heroSrc(c)}" alt="${c.name}立绘">
      </div>
    </section>

    <!-- 2. 性格 -->
    <section class="section" id="personality">
      <div class="container">
        <span class="eyebrow" data-reveal>性格</span>
        <h2 class="headline" data-reveal style="--d:.08s">${c.personality}。</h2>
        <p class="lead" data-reveal style="--d:.16s">奇怪的体质：<strong>${c.quirk}</strong>。</p>
        <div class="facts">
          ${[['习惯', c.habit], ['喜欢的', c.likes], ['讨厌的', c.dislikes],
             ['镇上的岗位', c.place], ['小规则', c.rule], ['数字周边创意', c.goods]]
            .map(([k, v], i) => `
            <div class="fact" data-reveal style="--d:${(i % 3) * 0.08}s">
              <div class="fact__label">${k}</div>
              <div class="fact__value">${v}</div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- 3. 永久缺陷 -->
    <section class="section flaw" id="flaw">
      <div class="container">
        <span class="eyebrow" data-reveal>永久缺陷</span>
        <p class="flaw__text" data-scrub-text>${c.flaw}</p>
        <p class="flaw__note" data-reveal>奶光镇的代价：每治愈一个人，自己的那种「奇怪体质」就会更明显一点。原因不解释，保留一点神秘。</p>
      </div>
    </section>

    <!-- 4. 专属动词 -->
    <section class="section verb center" id="verb">
      <div class="container">
        <span class="eyebrow" data-reveal>专属动词</span>
        <span class="verb__word" style="--len:${c.verb.length + 2}">「${c.verb}」</span>
        <p class="lead" data-reveal>在小镇日常里，${c.name}负责：</p>
        <div class="chips">
          ${c.tasks.map((n, i) => `<span class="chip" data-reveal style="--d:${i * 0.1}s"><b>${n}</b>${TASKS[n]}</span>`).join('')}
        </div>
      </div>
    </section>

    <!-- 5. 随身道具 -->
    <section class="section" id="item">
      <div class="container item">
        <div class="item__visual" data-reveal="scale">${ITEM_SHAPES[c.itemShape] || ITEM_SHAPES.dot}</div>
        <div>
          <span class="eyebrow" data-reveal>随身道具</span>
          <h2 class="headline" data-reveal style="--d:.08s">${c.item}</h2>
          <p class="lead" data-reveal style="--d:.16s">变形条件：<strong>${c.transform}</strong></p>
        </div>
      </div>
    </section>

    <!-- 6. 配色卡 -->
    <section class="section" id="palette">
      <div class="container">
        <span class="eyebrow" data-reveal>配色卡</span>
        <h2 class="headline" data-reveal style="--d:.08s">${CN_NUM[c.palette.length] || c.palette.length}种颜色，<br>不多不少。</h2>
        <p class="lead" data-reveal style="--d:.16s">每位居民保留自己的主色，关键道具统一使用奶白 <strong>#F4E5CA</strong> 与奶茶棕 <strong>#AA6D6C</strong>。点击色块即可复制色号。</p>
        <div class="swatches">
          ${c.palette.map((hex, i) => `
            <button class="swatch" data-hex="${hex}" data-reveal style="--d:${i * 0.07}s" aria-label="复制色号 ${hex}">
              <div class="swatch__color" style="background:${hex}"></div>
              <div class="swatch__info">
                <div class="swatch__hex">${hex}</div>
                <div class="swatch__tip">点击复制</div>
              </div>
            </button>`).join('')}
        </div>
      </div>
    </section>

    <!-- 7. 三视图 -->
    <section class="section" id="turnaround">
      <div class="container--wide">
        <div class="container">
          <span class="eyebrow" data-reveal>三视图</span>
          <h2 class="headline" data-reveal style="--d:.08s">正面、侧面、背面。</h2>
          <p class="lead" data-reveal style="--d:.16s">三视图共用同一比例参考框，Q 版头身比约 1:1.8，肢体与五官全部圆角化处理。</p>
        </div>
        <figure class="turn" id="turn" style="margin-left:0;margin-right:0">
          <img src="${turnSrc(c)}" alt="${c.name}三视图" loading="lazy">
          <figcaption class="turn__labels"><span>正面</span><span>侧面</span><span>背面</span></figcaption>
        </figure>
      </div>
    </section>

    <!-- 8. 精选表情 -->
    <section class="section" id="emotes">
      <div class="container--wide">
        <div class="container">
          <span class="eyebrow" data-reveal>精选表情</span>
          <h2 class="headline" data-reveal style="--d:.08s">七种心情。</h2>
          <p class="lead" data-reveal style="--d:.16s">基础 4 种 ＋ 签名动作 1 种 ＋ 延伸 2 种。点击表情可以放大和下载。</p>
        </div>
        <div class="emotes">
          ${emotes.map((e, i) => `
            <button class="emote${e.type === '签名动作' ? ' emote--sign' : ''} is-empty" data-index="${i}" data-reveal style="--d:${(i % 5) * 0.06}s" aria-label="${e.zh} ${e.en}">
              <div class="emote__pic"><img src="${heroSrc(c)}" data-emote-src="${e.src}" alt="" loading="lazy"></div>
              <div class="emote__info">
                <div class="emote__zh">${e.zh}</div>
                <div class="emote__en">${e.en}</div>
                <span class="emote__tag">${e.type === '签名动作' ? '签名动作 · 全身' : e.type}</span>
              </div>
            </button>`).join('')}
        </div>
      </div>
    </section>

    <!-- 9. 设计者 + 下一位 -->
    <section class="section" id="credit" style="padding-top:0">
      <div class="container">
        <div class="credit">
          <div class="credit__box" data-reveal>
            <div class="credit__label">角色设计</div>
            <div class="credit__value">${c.member.name}</div>
            <div class="credit__sub">${c.member.ko} · ${c.member.sid}</div>
          </div>
          <div class="credit__box" data-reveal style="--d:.08s">
            <div class="credit__label">镇上的岗位</div>
            <div class="credit__value">${c.place}</div>
            <div class="credit__sub">${c.role}</div>
          </div>
        </div>
        ${next.ready
          ? `<a class="next-link" href="character.html?id=${next.id}" data-reveal>
               <div><div class="credit__sub" style="color:inherit;opacity:.7">下一位居民</div><div class="next-link__name">${next.name} ›</div></div>
               <img src="${heroSrc(next)}" alt="">
             </a>`
          : `<div class="next-link is-soon" data-reveal>
               <div><div class="credit__sub" style="color:inherit">下一位居民</div><div class="next-link__name">${next.name} · 即将上线</div></div>
               <img src="${heroSrc(next)}" alt="" style="opacity:.4">
             </div>`}
      </div>
    </section>`;

  // —— 表情图：如果 assets 里已经有 emo_编号_顺序.png，就自动换上并允许放大 ——
  const emoteBtns = $$('.emote');
  emoteBtns.forEach(btn => {
    const img = $('img', btn);
    const probe = new Image();
    probe.onload = () => { img.src = probe.src; btn.classList.remove('is-empty'); };
    probe.src = img.dataset.emoteSrc;
  });
  $('.emotes').addEventListener('click', e => {
    const btn = e.target.closest('.emote');
    if (!btn || btn.classList.contains('is-empty')) return;
    const ready = emoteBtns.filter(b => !b.classList.contains('is-empty'));
    const items = ready.map(b => ({ src: $('img', b).src, caption: `${c.name} · ${$('.emote__zh', b).textContent}` }));
    lightbox.open(items, ready.indexOf(btn));
  });

  // —— 三视图也可以点击放大 ——
  $('#turn img').addEventListener('click', () => lightbox.open([{ src: turnSrc(c), caption: `${c.name} · 三视图` }], 0));
  $('#turn img').style.cursor = 'zoom-in';

  // —— 配色卡：点击复制色号 ——
  $$('.swatch').forEach(btn => btn.addEventListener('click', () => {
    copyText(btn.dataset.hex).then(() => toast(`已复制 ${btn.dataset.hex}`));
  }));

  // —— 首屏滚动：名字退场 → 立绘放大 → 台词出现 ——
  const heroText = $('.ch-hero__text');
  const heroImg = $('.ch-hero__img');
  const heroQuote = $('.ch-hero__quote');
  addScene({
    el: $('#chHero'),
    update(y, vh) {
      const p = stickyProgress(this, y, vh);
      const t = easeOut(range(p, 0, 0.4));
      heroText.style.opacity = (1 - t).toFixed(3);
      heroText.style.transform = `translate3d(0, ${(-t * 60).toFixed(1)}px, 0) scale(${(1 - t * 0.08).toFixed(4)})`;

      const s = easeOut(range(p, 0, 0.9));
      heroImg.style.transform = `translate3d(-50%, ${(-s * vh * 0.06).toFixed(1)}px, 0) scale(${(1 + s * 0.12).toFixed(4)})`;

      const q = easeOut(range(p, 0.38, 0.68));
      heroQuote.style.opacity = q.toFixed(3);
      heroQuote.style.transform = `translate3d(0, ${((1 - q) * 40).toFixed(1)}px, 0)`;
    }
  });

  // —— 专属动词：随滚动从小到大 ——
  const word = $('.verb__word');
  addScene({
    el: $('#verb'),
    update(y, vh) {
      const p = easeOut(clamp((y + vh - this.top) / (vh * 0.9)));
      word.style.opacity = (0.15 + p * 0.85).toFixed(3);
      word.style.transform = `scale(${(0.7 + p * 0.3).toFixed(4)})`;
    }
  });

  // —— 三视图：进入时轻微放大到原尺寸 ——
  const turn = $('#turn');
  addScene({
    el: turn,
    update(y, vh) {
      const p = easeOut(clamp((y + vh - this.top) / (vh * 0.8)));
      turn.style.transform = `scale(${(0.9 + p * 0.1).toFixed(4)})`;
    }
  });
}


/* ==========================================================================
   启动
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'home') renderHome();
  if (page === 'character') renderCharacter();
  initNav();
  initScrubText();
  initReveal();
  startEngine();
});
