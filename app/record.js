/* ==========================================================================
   记录型应用（实操 1）
   模式：mood 心情日记 · todo 待办 · idea 点子待办 · habit 习惯打卡 · water 喝水
        lend 借出登记 · focus 专注计时 · diary 一句话日记 + 月历
   ========================================================================== */
(function () {
  const { c, cfg, L, t, esc, load, save, dayKey, daysBetween, face, react, greet, say, toast } = NG;
  const mode = cfg.appA.mode;
  const main = NG.shell({ small: false });
  const data = load();
  const T = (zh, ko) => [zh, ko];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const ph = (zh, ko) => `placeholder="${esc(NG.lang() === 'ko' ? ko : zh)}" data-ph-zh="${esc(zh)}" data-ph-ko="${esc(ko)}"`;

  function touch() { data.last = dayKey(); save(data); }
  function lastDays(n) { const out = []; const d = new Date(); for (let i = n - 1; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); out.push(dayKey(x)); } return out; }
  const WEEK = { zh: ['日', '一', '二', '三', '四', '五', '六'], ko: ['일', '월', '화', '수', '목', '금', '토'] };
  const wd = k => { const [y, m, d] = k.split('-').map(Number); const w = new Date(y, m - 1, d).getDay(); return L([WEEK.zh[w], WEEK.ko[w]]); };
  function bars(values, max, labelFn) {
    return `<div class="bars">${values.map(v => `<div class="bars__col"><div class="bars__bar" style="height:${Math.min(100, (v.v / max) * 100)}%"></div><span>${labelFn(v)}</span></div>`).join('')}</div>`;
  }
  const style = document.createElement('style');
  style.textContent = `
    .bars{display:flex;gap:8px;align-items:flex-end;height:110px;padding-top:6px}
    .bars__col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;font-size:12px;color:var(--ink-2)}
    .bars__bar{width:100%;max-width:26px;min-height:3px;border-radius:8px 8px 4px 4px;background:var(--deep);opacity:.85}
    .strip{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center;font-size:12px;color:var(--ink-2)}
    .strip__cell{aspect-ratio:1;border-radius:12px;background:var(--bg);display:flex;align-items:center;justify-content:center}
    .strip__cell img{width:80%;height:80%;object-fit:contain}
    .entry{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line)}
    .entry:first-child{border-top:0}
    .entry img{width:40px;height:40px;object-fit:contain;flex:none}
    .tag{font-size:12px;padding:2px 8px;border-radius:10px;background:color-mix(in srgb,var(--tint) 70%,#fff);color:var(--deep);white-space:nowrap}
    .glass{position:relative;width:120px;height:170px;margin:4px auto 10px;border:4px solid var(--deep);border-top-width:2px;border-radius:10px 10px 30px 30px;overflow:hidden;background:#fff}
    .glass__water{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(180deg,#BFE3F5,#8FCBEA);transition:height .5s cubic-bezier(.22,.61,.36,1)}
    .glass__marks{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 calc(12.5% - 1px),rgba(0,0,0,.06) calc(12.5% - 1px) 12.5%)}
    .ring{position:relative;width:210px;height:210px;margin:0 auto}
    .ring svg{width:100%;height:100%;transform:rotate(-90deg)}
    .ring__t{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:42px;font-weight:800;color:var(--deep);font-variant-numeric:tabular-nums}
    .ring__t small{font-size:13px;font-weight:500;color:var(--ink-2)}
    .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
    .cal__h{font-size:12px;color:var(--ink-2);padding:2px 0}
    .cal__d{aspect-ratio:1;border-radius:10px;background:var(--bg);font-size:12px;position:relative;display:flex;align-items:flex-start;justify-content:flex-start;padding:3px;color:var(--ink-2);min-height:40px}
    .cal__d img{position:absolute;inset:14% 8% 4%;width:84%;height:82%;object-fit:contain}
    .cal__d.is-today{outline:2px solid var(--deep)}
    .cal__d.is-pick{background:color-mix(in srgb,var(--tint) 70%,#fff)}
    .who img{width:26px;height:26px}
  `;
  document.head.appendChild(style);

  /* ======================================================== mood 心情日记 */
  function mood() {
    data.entries = data.entries || [];
    let pickK = null;
    const moodBy = k => cfg.moods.find(m => m.k === k);
    function streak() {
      const days = new Set(data.entries.map(e => e.d)); let n = 0; const d = new Date();
      while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    }
    function draw() {
      const week = lastDays(7).map(k => ({ k, e: data.entries.find(e => e.d === k) }));
      main.innerHTML = `
        <div class="card">
          <h3>${L(T('今天的心情章', '오늘의 기분 도장'))}</h3>
          <div class="chips" id="moods">${cfg.moods.map(m => `<button class="chip ${pickK === m.k ? 'is-on' : ''}" data-m="${m.k}"><img src="${face(m.face)}" alt="">${L(m.name)}</button>`).join('')}</div>
          <textarea class="input" id="txt" maxlength="80" style="margin-top:12px" ${ph('想说的一句话（可以不写）', '하고 싶은 한마디 (안 써도 돼)')}></textarea>
          <button class="btn btn--main btn--wide btn--xl" id="go" style="margin-top:12px" ${pickK ? '' : 'disabled'}>${L(T('盖章', '도장 찍기'))}</button>
        </div>
        <div class="card"><h3>${L(T('这一周', '이번 주'))} · ${L(T(`连续 ${streak()} 天`, `${streak()}일 연속`))}</h3>
          <div class="strip">${week.map(w => `<div>${wd(w.k)}<div class="strip__cell">${w.e ? `<img src="${face(moodBy(w.e.m).face)}" alt="">` : ''}</div></div>`).join('')}</div>
        </div>
        ${data.entries.length ? `<div class="card"><h3>${L(T('写给奶兔的信', '우유 토끼에게 쓴 편지'))}</h3>
          ${data.entries.slice(0, 6).map(e => `<div class="entry"><img src="${face(moodBy(e.m).face)}" alt=""><div class="grow"><div class="muted">${e.d.slice(5)} ${new Date(e.ts).toTimeString().slice(0, 5)} · ${L(moodBy(e.m).name)}</div><div>${e.text ? esc(e.text) : '<span class="muted">…</span>'}</div></div></div>`).join('')}</div>` : ''}`;
      const txt = main.querySelector('#txt'); txt.value = draft;
      txt.addEventListener('input', () => { draft = txt.value; });
    }
    let draft = '';
    main.addEventListener('click', e => {
      const m = e.target.closest('[data-m]');
      if (m) { pickK = m.dataset.m; const md = moodBy(pickK); draw(); say(md.reply[0], md.face, 'bounce'); return; }
      if (e.target.closest('#go')) {
        if (!pickK) return toast(T('先选一个心情', '기분을 먼저 골라 줘'));
        const firstToday = !data.entries.some(x => x.d === dayKey());
        const md = moodBy(pickK);
        data.entries.unshift({ d: dayKey(), ts: Date.now(), m: pickK, text: draft.trim().slice(0, 80) });
        data.entries = data.entries.slice(0, 400);
        touch(); draft = ''; pickK = null; draw();
        const s = streak();
        if (firstToday && [3, 7, 14, 21, 30, 50, 100].includes(s)) react('done');
        else react('recorded', { line: NG.pick(md.reply), face: md.face });
      }
    });
    draw();
    return data.entries.length > 0;
  }

  /* ============================================== todo / idea 待办·点子 */
  function list(kind) {
    data.items = data.items || [];
    const isIdea = kind === 'idea';
    const STALE = 3;
    let draft = '';
    function draw() {
      const open = data.items.filter(i => !i.done), done = data.items.filter(i => i.done);
      main.innerHTML = `
        <div class="card">
          <div class="row"><input class="input grow" id="txt" maxlength="60" ${isIdea ? ph('写下一个点子……', '아이디어 하나 적기…') : ph('新线索：要做的事', '새 단서: 할 일')}>
          <button class="btn btn--main" id="add" style="min-width:76px">${L(isIdea ? T('记下', '적기') : T('登记', '등록'))}</button></div>
        </div>
        <div class="card">
          <h3>${L(isIdea ? T(`还没做的点子 · ${open.length}`, `아직인 아이디어 · ${open.length}`) : T(`待侦查 · ${open.length}`, `수사 대기 · ${open.length}`))}</h3>
          ${open.length ? `<ul class="list">${open.map(i => {
            const age = daysBetween(i.at, dayKey());
            return `<li class="item" data-id="${i.id}"><button class="check" data-done aria-label="完成 / 완료"><i></i></button>
              <span class="item__text">${esc(i.text)}</span>${isIdea && age >= STALE ? `<span class="tag">💤 ${L(T(`${age} 天`, `${age}일`))}</span>` : ''}
              <button class="icon-btn" data-del aria-label="删除 / 삭제">×</button></li>`;
          }).join('')}</ul>` : `<p class="muted center">${L(isIdea ? T('点子都做完啦！', '아이디어를 다 해냈어!') : T('没有待办，干净。', '할 일 없음. 깔끔.'))}</p>`}
        </div>
        ${done.length ? `<div class="card"><div class="row"><h3 class="grow" style="margin:0">${L(isIdea ? T(`做到了 💡 ${done.length}`, `해냈다 💡 ${done.length}`) : T(`已破案 🔍 ${done.length}`, `해결 🔍 ${done.length}`))}</h3>
          <button class="btn btn--ghost" id="clear">${L(T('清理', '정리'))}</button></div>
          <ul class="list" style="margin-top:8px">${done.slice(0, 8).map(i => `<li class="item is-done" data-id="${i.id}"><button class="check" data-undo aria-label="取消 / 취소"><i></i></button><span class="item__text">${esc(i.text)}</span></li>`).join('')}</ul></div>` : ''}`;
      const txt = main.querySelector('#txt'); txt.value = draft;
      txt.addEventListener('input', () => { draft = txt.value; });
      txt.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) add(); });
    }
    function add() {
      const v = draft.trim();
      if (!v) { toast(T('先写点什么吧', '먼저 뭔가 적어 줘')); main.querySelector('#txt').focus(); return; }
      data.items.unshift({ id: uid(), text: v.slice(0, 60), at: dayKey(), done: false });
      draft = ''; touch(); draw(); react('recorded');
      const open = data.items.filter(i => !i.done).length;
      if (open >= 7) setTimeout(() => react('worried'), 1600);
    }
    main.addEventListener('click', e => {
      if (e.target.closest('#add')) return add();
      if (e.target.closest('#clear')) { data.items = data.items.filter(i => !i.done); save(data); draw(); return; }
      const li = e.target.closest('[data-id]'); if (!li) return;
      const it = data.items.find(i => i.id === li.dataset.id);
      if (e.target.closest('[data-done]')) { it.done = true; it.doneAt = dayKey(); touch(); draw(); react('done'); }
      else if (e.target.closest('[data-undo]')) { it.done = false; save(data); draw(); }
      else if (e.target.closest('[data-del]')) { data.items = data.items.filter(i => i !== it); save(data); draw(); }
    });
    draw();
    const stale = data.items.some(i => !i.done && daysBetween(i.at, dayKey()) >= STALE);
    const many = data.items.filter(i => !i.done).length >= 7;
    return { has: data.items.length > 0, worried: (isIdea && stale) || many };
  }

  /* ======================================================= habit 习惯打卡 */
  function habit() {
    data.names = data.names || cfg.habits.map(h => ({ zh: h[0], ko: h[1] }));
    data.log = data.log || {};
    let editing = false;
    const today = () => (data.log[dayKey()] = data.log[dayKey()] || [false, false, false, false]);
    function draw() {
      const td = data.log[dayKey()] || [false, false, false, false];
      const n = td.filter(Boolean).length;
      main.innerHTML = `
        <div class="card">
          <div class="row"><h3 class="grow" style="margin:0">${L(T('今日计划', '오늘의 계획'))} · <b style="color:var(--deep)">${n} / 4</b></h3>
          <button class="btn btn--ghost" id="edit">${L(editing ? T('完成', '완료') : T('改名字', '이름 바꾸기'))}</button></div>
          <ul class="list" style="margin-top:10px">${data.names.map((nm, i) => editing
            ? `<li class="item"><input class="input" data-name="${i}" maxlength="16" value="${esc(t(nm))}"></li>`
            : `<li class="item ${td[i] ? 'is-done' : ''}" data-i="${i}"><button class="check" aria-label="打卡 / 체크"><i></i></button><span class="item__text">${L(nm)}</span></li>`).join('')}</ul>
        </div>
        <div class="card"><h3>${L(T('最近 7 天', '최근 7일'))}</h3>
          ${bars(lastDays(7).map(k => ({ k, v: (data.log[k] || []).filter(Boolean).length })), 4, v => wd(v.k))}
        </div>`;
    }
    main.addEventListener('click', e => {
      if (e.target.closest('#edit')) {
        if (editing) main.querySelectorAll('[data-name]').forEach(inp => {
          const v = inp.value.trim(); if (v) data.names[+inp.dataset.name] = { zh: v, ko: v };
        });
        editing = !editing; save(data); draw(); return;
      }
      const li = e.target.closest('[data-i]'); if (!li) return;
      const td = today(); const i = +li.dataset.i;
      td[i] = !td[i]; touch(); draw();
      if (td[i]) react(td.every(Boolean) ? 'done' : 'recorded');
    });
    draw();
    return Object.keys(data.log).length > 0;
  }

  /* ========================================================= water 喝水 */
  function water() {
    data.log = data.log || {};
    const goal = cfg.goal || 8;
    const lv = n => n >= 6 ? 'love' : n >= 3 ? 'happy' : 'sleep';
    function draw() {
      const n = data.log[dayKey()] || 0;
      main.innerHTML = `
        <div class="card center">
          <div class="glass" aria-hidden="true"><div class="glass__water" style="height:${Math.min(100, n / goal * 100)}%"></div><div class="glass__marks"></div></div>
          <div class="big">${n} <span style="font-size:18px;color:var(--ink-2)">/ ${goal}</span></div>
          <p class="muted">${L(n >= 6 ? T('水润润', '촉촉') : n >= 3 ? T('普通', '보통') : T('有点干', '조금 건조'))}</p>
          <button class="btn btn--main btn--wide btn--xl" id="plus" style="margin-top:10px">☁️ ${L(T('喝了一杯', '한 잔 마셨어'))}</button>
          <button class="btn btn--ghost btn--wide" id="minus" style="margin-top:8px" ${n ? '' : 'disabled'}>${L(T('减一杯', '한 잔 빼기'))}</button>
        </div>
        <div class="card"><h3>${L(T('最近 7 天', '최근 7일'))}</h3>${bars(lastDays(7).map(k => ({ k, v: data.log[k] || 0 })), goal, v => wd(v.k))}</div>`;
    }
    main.addEventListener('click', e => {
      const k = dayKey();
      if (e.target.closest('#plus')) {
        const n = Math.min(20, (data.log[k] || 0) + 1); data.log[k] = n; touch(); draw();
        if (n === goal) react('done', { face: 'love' }); else react('recorded', { face: lv(n) });
      } else if (e.target.closest('#minus')) {
        data.log[k] = Math.max(0, (data.log[k] || 0) - 1); save(data); draw(); NG.setFace(lv(data.log[k]));
      }
    });
    draw(); NG.setFace(lv(data.log[dayKey()] || 0));
    return Object.keys(data.log).length > 0;
  }

  /* ===================================================== lend 借出登记簿 */
  function lend() {
    data.items = data.items || [];
    data.no = data.no || 0;
    const others = CHARACTERS.filter(x => x.id !== c.id);
    let who = null, what = '', otherName = '';
    const whoLabel = w => { const r = CHARACTERS.find(x => x.id === w); return r ? L(r.name) : esc(w); };
    function draw() {
      const out = data.items.filter(i => !i.back), back = data.items.filter(i => i.back);
      main.innerHTML = `
        <div class="card">
          <h3>${L(T('借出了什么？', '무엇을 빌려줬어?'))}</h3>
          <input class="input" id="what" maxlength="30" ${ph('例：小铜钥匙、伞、充电器', '예: 작은 열쇠, 우산, 충전기')}>
          <h3 style="margin-top:12px">${L(T('借给谁？', '누구에게?'))}</h3>
          <div class="chips who">${others.map(o => `<button class="chip ${who === o.id ? 'is-on' : ''}" data-who="${o.id}"><img src="${face('happy', o.id)}" alt="">${L(o.name)}</button>`).join('')}
            <button class="chip ${who === '_' ? 'is-on' : ''}" data-who="_">${L(T('其他人', '다른 사람'))}</button></div>
          ${who === '_' ? `<input class="input" id="other" maxlength="16" style="margin-top:8px" ${ph('名字', '이름')}>` : ''}
          <button class="btn btn--main btn--wide btn--xl" id="go" style="margin-top:12px">${L(T('登记', '장부에 적기'))}</button>
        </div>
        <div class="card"><h3>${L(T(`借出中 · ${out.length}`, `대여 중 · ${out.length}`))}</h3>
          ${out.length ? `<ul class="list">${out.map(i => { const age = daysBetween(i.at, dayKey()); return `<li class="item" data-id="${i.id}">
            <div class="item__text"><b>#${i.no} ${esc(i.what)}</b><div class="muted">→ ${whoLabel(i.who)} · ${L(age ? T(`${age} 天`, `${age}일째`) : T('今天', '오늘'))}${age >= 7 ? ' ⚠️' : ''}</div></div>
            <button class="btn" data-back>${L(T('已归还', '반납 완료'))}</button></li>`; }).join('')}</ul>`
          : `<p class="muted center">${L(T('全部在库，安心 ✨', '전부 보관 중, 안심 ✨'))}</p>`}
        </div>
        ${back.length ? `<div class="card"><h3>${L(T(`已归还 · ${back.length}`, `반납 완료 · ${back.length}`))}</h3>
          <ul class="list">${back.slice(0, 6).map(i => `<li class="item is-done"><span class="item__text">#${i.no} ${esc(i.what)} · ${whoLabel(i.who)}</span><span class="muted">${i.backAt.slice(5)}</span></li>`).join('')}</ul></div>` : ''}`;
      const w = main.querySelector('#what'); w.value = what; w.addEventListener('input', () => { what = w.value; });
      const o = main.querySelector('#other'); if (o) { o.value = otherName; o.addEventListener('input', () => { otherName = o.value; }); }
    }
    main.addEventListener('click', e => {
      const wb = e.target.closest('[data-who]');
      if (wb) { who = wb.dataset.who; draw(); return; }
      if (e.target.closest('#go')) {
        const v = what.trim();
        if (!v) return toast(T('写下借出的东西', '빌려준 물건을 적어 줘'));
        if (!who) return toast(T('选一下借给谁', '누구에게 빌려줬는지 골라 줘'));
        const w = who === '_' ? (otherName.trim() || (NG.lang() === 'ko' ? '누군가' : '某人')) : who;
        data.no += 1;
        data.items.unshift({ id: uid(), no: data.no, what: v.slice(0, 30), who: w, at: dayKey(), back: false });
        what = ''; who = null; otherName = ''; touch(); draw();
        react('recorded', { line: NG.fill(NG.pick(cfg.lines.recorded), { n: data.no }) });
        return;
      }
      const li = e.target.closest('[data-id]');
      if (li && e.target.closest('[data-back]')) {
        const it = data.items.find(i => i.id === li.dataset.id); it.back = true; it.backAt = dayKey(); touch(); draw(); react('done');
      }
    });
    draw();
    return { has: data.items.length > 0, worried: data.items.some(i => !i.back && daysBetween(i.at, dayKey()) >= 7) };
  }

  /* ======================================================= focus 专注计时 */
  function focus() {
    data.sessions = data.sessions || {};
    let mins = data.lastMin || 25, left = mins * 60000, running = false, frozen = false, lastTick = 0, timer = null;
    const R = 92, C = 2 * Math.PI * R;
    const fmt = ms => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
    function draw() {
      const td = data.sessions[dayKey()] || { n: 0, m: 0 };
      main.innerHTML = `
        <div class="card center">
          <div class="chips" style="justify-content:center;margin-bottom:10px">${[10, 25, 45].map(m => `<button class="chip ${m === mins ? 'is-on' : ''}" data-min="${m}" ${running ? 'disabled' : ''}>${m} ${L(T('分钟', '분'))}</button>`).join('')}</div>
          <div class="ring"><svg viewBox="0 0 210 210"><circle cx="105" cy="105" r="${R}" fill="none" stroke="var(--line)" stroke-width="12"/>
            <circle id="arc" cx="105" cy="105" r="${R}" fill="none" stroke="var(--deep)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
            <div class="ring__t"><span id="clock">${fmt(left)}</span><small id="state">${L(frozen ? T('石化中……', '굳는 중…') : running ? T('奶熊守着你', '우유 곰이 지키는 중') : T('准备好了吗', '준비됐어?'))}</small></div></div>
          ${running ? `<button class="btn btn--ghost btn--wide" id="quit" style="margin-top:12px">${L(T('先放弃（不扣分）', '그만두기 (감점 없음)'))}</button>`
                    : `<button class="btn btn--main btn--wide btn--xl" id="start" style="margin-top:12px">${L(left < mins * 60000 ? T('继续', '계속') : T('开始专注', '집중 시작'))}</button>`}
        </div>
        <div class="card"><h3>${L(T(`今天 · ${td.n} 次 · ${td.m} 分钟`, `오늘 · ${td.n}회 · ${td.m}분`))}</h3>
          ${bars(lastDays(7).map(k => ({ k, v: (data.sessions[k] || { m: 0 }).m })), 120, v => wd(v.k))}</div>`;
      paint();
    }
    function paint() {
      const arc = main.querySelector('#arc'); if (arc) arc.style.strokeDashoffset = String(C * (1 - left / (mins * 60000)));
      const cl = main.querySelector('#clock'); if (cl) cl.textContent = fmt(left);
    }
    function tick() {
      const now = performance.now(); left -= now - lastTick; lastTick = now;
      if (left <= 0) { finish(); return; }
      paint();
    }
    function start() { running = true; frozen = false; lastTick = performance.now(); timer = setInterval(tick, 250); draw(); react('recorded'); }
    function stop() { clearInterval(timer); timer = null; running = false; }
    function finish() {
      stop(); const k = dayKey(); const s = data.sessions[k] = data.sessions[k] || { n: 0, m: 0 };
      s.n += 1; s.m += mins; left = mins * 60000; touch(); draw(); react('done');
    }
    document.addEventListener('visibilitychange', () => {
      if (!running) return;
      if (document.hidden) { clearInterval(timer); timer = null; frozen = true; NG.charEl.classList.add('freeze'); say(cfg.lines.frozen[0], 'surprised'); }
      else if (frozen) { frozen = false; NG.charEl.classList.remove('freeze'); lastTick = performance.now(); timer = setInterval(tick, 250); draw(); say(cfg.lines.frozen[1], 'happy', 'bounce'); }
    });
    main.addEventListener('click', e => {
      const m = e.target.closest('[data-min]');
      if (m && !running) { mins = +m.dataset.min; data.lastMin = mins; left = mins * 60000; save(data); draw(); return; }
      if (e.target.closest('#start')) start();
      else if (e.target.closest('#quit')) { stop(); left = mins * 60000; draw(); say(T('嗯。下次再来。', '응. 다음에 또 하자.'), 'happy'); }
    });
    draw();
    return Object.keys(data.sessions).length > 0;
  }

  /* ============================================ diary 一句话日记 + 月历 */
  function diary() {
    data.entries = data.entries || {};
    let stamp = 'happy', view = new Date(), picked = dayKey(), draft = (data.entries[dayKey()] || {}).t || '';
    if (data.entries[dayKey()]) stamp = data.entries[dayKey()].s;
    const monthCount = (y, m) => Object.keys(data.entries).filter(k => k.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)).length;
    function draw() {
      const y = view.getFullYear(), m = view.getMonth();
      const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < first; i++) cells.push('<div></div>');
      for (let d = 1; d <= days; d++) {
        const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; const e = data.entries[k];
        cells.push(`<button class="cal__d ${k === dayKey() ? 'is-today' : ''} ${k === picked ? 'is-pick' : ''}" data-day="${k}">${d}${e ? `<img src="${face(e.s)}" alt="">` : ''}</button>`);
      }
      const pe = data.entries[picked];
      const has = !!data.entries[dayKey()];
      const cnt = monthCount(y, m);
      main.innerHTML = `
        <div class="card">
          <h3>${L(T('今天的一句话', '오늘의 한 줄'))}</h3>
          <input class="input" id="txt" maxlength="60" ${ph('今天发生了什么？', '오늘 무슨 일이 있었어?')}>
          <div class="chips" style="margin-top:10px">${cfg.stamps.map(s => `<button class="chip ${s === stamp ? 'is-on' : ''}" data-s="${s}" aria-label="${s}"><img src="${face(s)}" alt=""></button>`).join('')}</div>
          <button class="btn btn--main btn--wide btn--xl" id="go" style="margin-top:12px">${L(has ? T('改写今天', '오늘 다시 쓰기') : T('印到日历上', '달력에 찍기'))}</button>
        </div>
        <div class="card">
          <div class="row"><button class="icon-btn" data-mv="-1" aria-label="上个月 / 이전 달">‹</button>
            <h3 class="grow center" style="margin:0">${y}.${String(m + 1).padStart(2, '0')} · ${L(T(`${cnt} / 10 格`, `${cnt} / 10칸`))}</h3>
            <button class="icon-btn" data-mv="1" aria-label="下个月 / 다음 달">›</button></div>
          <div class="cal" style="margin-top:8px">${WEEK.zh.map((_, i) => `<div class="cal__h">${L([WEEK.zh[i], WEEK.ko[i]])}</div>`).join('')}${cells.join('')}</div>
          <div class="entry" style="margin-top:10px">${pe ? `<img src="${face(pe.s)}" alt=""><div><div class="muted">${picked}</div>${esc(pe.t)}</div>` : `<div class="muted">${picked} · ${L(T('这天还没有故事', '이 날은 아직 이야기가 없어'))}</div>`}</div>
        </div>`;
      const txt = main.querySelector('#txt'); txt.value = draft;
      txt.addEventListener('input', () => { draft = txt.value; });
    }
    main.addEventListener('click', e => {
      const s = e.target.closest('[data-s]'); if (s) { stamp = s.dataset.s; draw(); NG.setFace(stamp); return; }
      const mv = e.target.closest('[data-mv]'); if (mv) { view = new Date(view.getFullYear(), view.getMonth() + +mv.dataset.mv, 1); draw(); return; }
      const d = e.target.closest('[data-day]'); if (d) { picked = d.dataset.day; draw(); return; }
      if (e.target.closest('#go')) {
        const v = draft.trim();
        if (!v) { toast(T('写一句话再印上去吧', '한 줄 쓰고 찍어 줘')); return; }
        const k = dayKey(); const isNew = !data.entries[k];
        data.entries[k] = { t: v.slice(0, 60), s: stamp }; picked = k; view = new Date(); touch(); draw();
        const now = new Date();
        if (isNew && monthCount(now.getFullYear(), now.getMonth()) === 10) react('done');
        else react('recorded');
      }
    });
    draw();
    return Object.keys(data.entries).length > 0;
  }

  /* —— 启动 —— */
  const run = { mood, todo: () => list('todo'), idea: () => list('idea'), habit, water, lend, focus, diary }[mode];
  const res = run();
  const has = typeof res === 'object' ? res.has : res;
  NG.introCards(data, () => {
    greet(data.last, has);
    if (typeof res === 'object' && res.worried && has) setTimeout(() => react('worried'), 2600);
  });
})();
