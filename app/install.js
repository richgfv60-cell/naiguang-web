/* ==========================================================================
   「放到手机主屏幕」卡片（首页「小镇应用」和 apps.html 共用）
   - 安卓 Chrome：出现「安装到主屏幕」按钮（浏览器允许时才显示）
   - iPhone：显示 Safari 的三步操作
   - 安卓还可以直接下载 APK 安装包
   用法：InstallCard(容器元素, { root: '' })
   ========================================================================== */
(function () {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const L = v => `<span class="l-zh">${v[0]}</span><span class="l-ko">${v[1]}</span>`;
  let deferred = null;
  const cards = [];
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; cards.forEach(c => { const b = c.querySelector('.ic__ins'); if (b) b.hidden = false; }); });

  window.InstallCard = function (el, opt = {}) {
    const root = opt.root || '';
    const appsLink = `<a href="${root}apps.html" style="color:inherit;font-weight:700">${L(['小镇应用', '마을 앱'])}</a>`;
    el.classList.add('ic');
    el.innerHTML = `
      <style>
        .ic__h{margin:0 0 12px;font-size:17px;font-weight:800;color:var(--ink-2,#6E6567)}
        .ic__ins{width:100%;min-height:56px;border-radius:28px;border:0;background:var(--c-deep,var(--deep,#9A5058));color:#fff;font:inherit;font-size:18px;font-weight:800;cursor:pointer}
        .ic__ins[hidden]{display:none}
        .ic__steps{list-style:decimal;margin:12px 0 0;padding-left:22px;color:var(--ink-2,#6E6567);line-height:1.9;font-size:15px}
        .ic__note{margin:10px 0 0;color:var(--ink-2,#6E6567);font-size:14px;line-height:1.6}
        .ic__apk{margin-top:16px;padding-top:14px;border-top:1px solid rgba(0,0,0,.08)}
        .ic__apk b{display:block;margin-bottom:10px;font-size:15px}
        .ic__btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ic__dl{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:64px;padding:8px 10px;border-radius:18px;text-decoration:none;text-align:center;
          background:#fff;color:var(--c-deep,var(--deep,#9A5058));box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--c-deep,var(--deep,#9A5058)) 40%,#fff);font-weight:800;font-size:15px}
        .ic__dl small{font-weight:500;font-size:12px;color:var(--ink-2,#6E6567)}
        @media (max-width:360px){.ic__btns{grid-template-columns:1fr}}
      </style>
      <div class="ic__h">📲 ${L(['放到手机主屏幕', '홈 화면에 추가'])}</div>
      ${standalone ? `<p class="ic__note">${L(['已经在主屏幕上啦！', '이미 홈 화면에 있어요!'])}</p>` : `
      <button class="ic__ins" type="button" ${deferred ? '' : 'hidden'}>${L(['安装到主屏幕', '홈 화면에 설치'])}</button>
      <ol class="ic__steps">${isIOS
        ? `<li>${L([`用 Safari 打开${appsLink}页面`, `Safari로 ${appsLink} 페이지 열기`])}</li><li>${L(['点底部的「分享」按钮 ⬆️', '아래쪽 「공유」 버튼 ⬆️ 누르기'])}</li><li>${L(['选「添加到主屏幕」', '「홈 화면에 추가」 선택'])}</li>`
        : `<li>${L([`用 Chrome 打开${appsLink}页面`, `Chrome으로 ${appsLink} 페이지 열기`])}</li><li>${L(['点右上角 ⋮ 菜单', '오른쪽 위 ⋮ 메뉴'])}</li><li>${L(['选「添加到主屏幕」或「安装应用」', '「홈 화면에 추가」 또는 「앱 설치」 선택'])}</li>`}</ol>
      <p class="ic__note">${L(['主屏幕上会出现「小镇应用」，8 位居民的房间和小游戏都在里面。只想要某一位的房间，就先进入那个房间再添加。', '홈 화면에 「마을 앱」이 생기고, 8명의 방과 미니게임이 모두 들어 있어요. 한 명의 방만 원하면 그 방에 들어가서 추가하세요.'])}</p>`}
      <div class="ic__apk">
        <b>🤖 ${L(['安卓手机：下载 APK 安装包', '안드로이드: APK 설치 파일 받기'])}</b>
        <div class="ic__btns">
          <a class="ic__dl" href="${root}download/cream-town.apk" download>⬇ ${L(['小镇应用 APK', '마을 앱 APK'])}<small>${L(['8 个房间 + 小游戏', '방 8개 + 미니게임'])}</small></a>
          <a class="ic__dl" href="${root}trip/cream-trip.apk" download>⬇ ${L(['小游戏 APK', '미니게임 APK'])}<small>${L(['奶油镇 · 出门去', '크림 마을 · 다녀올게'])}</small></a>
        </div>
        <p class="ic__note">${L(['安装时手机会提示「未知来源」，允许一次就好。iPhone 不能装 APK，请用上面的「添加到主屏幕」。', '설치할 때 「출처를 알 수 없는 앱」을 한 번 허용해 주세요. iPhone은 APK를 설치할 수 없으니 위의 「홈 화면에 추가」를 써 주세요.'])}</p>
      </div>`;
    const b = el.querySelector('.ic__ins');
    if (b) b.addEventListener('click', () => { if (!deferred) return; deferred.prompt(); deferred = null; b.hidden = true; });
    cards.push(el);
  };
})();
