#!/usr/bin/env python3
"""生成每位居民的「我的房间」+ 两个小应用页面 + PWA 清单 + 图标。

用法（在仓库根目录）：python3 tools/make_apps.py
- 页面内容都在 app/*.js 和 app/chars.js 里，这里只生成很薄的 HTML 外壳
- 图标用 assets/<id>/face/happy.png 叠在角色主色上
"""
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
V = '20261130'

data_js = (ROOT / 'data.js').read_text(encoding='utf-8')
chars_js = (ROOT / 'app/chars.js').read_text(encoding='utf-8')

CHARS = []
for m in re.finditer(r"id: '(\w+)', no: '(\d+)',\s*name: \{ zh: '([^']+)', ko: '([^']+)' \},.*?tint: '(#\w+)', deep: '(#\w+)'", data_js, re.S):
    CHARS.append(dict(id=m[1], no=m[2], zh=m[3], ko=m[4], tint=m[5], deep=m[6]))
assert len(CHARS) == 8, CHARS


def app_names(cid):
    """这个角色的所有应用：[(键, 模式, 中文名, 韩文名, 脚本)]；appC 等组员新增应用按 kind 选脚本"""
    start = chars_js.index(f'  {cid}: {{')
    nxt = re.search(r"\n  \w+: \{\n", chars_js[start + 5:])
    block = chars_js[start: start + 5 + (nxt.start() if nxt else len(chars_js))]
    out = []
    for k in 'ABCD':
        m = re.search(r"app" + k + r": \{ mode: '(\w+)',(?: kind: '(\w+)',)?(?: (?:by|idea): '\w+',)? name: \['([^']+)', '([^']+)'\]", block)
        if not m: continue
        kind = m[2] or ('record' if k == 'A' else 'game')
        out.append((k.lower(), m[1], m[3], m[4], 'app/record.js' if kind == 'record' else 'app/game.js'))
    return out


def page(title, tint, root, cid, app, scripts, manifest=True, icon='../icon-192.png'):
    tags = '\n  '.join(f'<script src="{root}{s}?v={V}"></script>' for s in scripts)
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{title}</title>
  <meta name="theme-color" content="{tint}">
  {'<link rel="manifest" href="manifest.webmanifest">' if manifest else ''}
  <link rel="icon" href="{icon}">
  <link rel="apple-touch-icon" href="{icon}">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="{title.split(' · ')[0]}">
  <link rel="stylesheet" href="{root}app/core.css?v={V}">
</head>
<!-- 自动生成：python3 tools/make_apps.py · 文字请改 app/chars.js -->
<body>
  <noscript>请开启 JavaScript · JavaScript를 켜 주세요</noscript>
  <script>window.NG_ROOT = '{root}'; window.NG_ID = '{cid}'; window.NG_APP = '{app}';</script>
  {tags}
</body>
</html>
'''


def manifest(name, short, tint, icon_prefix):
    return json.dumps({
        'name': name, 'short_name': short, 'start_url': './', 'scope': './', 'display': 'standalone',
        'background_color': tint, 'theme_color': tint, 'lang': 'zh-CN',
        'icons': [
            {'src': f'{icon_prefix}icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
            {'src': f'{icon_prefix}icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
            {'src': f'{icon_prefix}icon-maskable.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }, ensure_ascii=False, indent=2)


def icons(cid, tint, out):
    f = Image.open(ROOT / f'assets/{cid}/face/happy.png').convert('RGBA')
    for size, scale, name, rounded in [(192, .84, 'icon-192.png', True), (512, .84, 'icon-512.png', True), (512, .62, 'icon-maskable.png', False)]:
        bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(bg)
        if rounded:
            d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * .22), fill=tint)
        else:
            d.rectangle([0, 0, size, size], fill=tint)
        im = f.copy(); im.thumbnail((int(size * scale), int(size * scale)), Image.LANCZOS)
        bg.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2 + int(size * .02)))
        bg.save(out / name, optimize=True)


for ch in CHARS:
    cid = ch['id']
    base = ROOT / 'characters' / cid
    (base / 'app-a').mkdir(parents=True, exist_ok=True)
    (base / 'app-b').mkdir(parents=True, exist_ok=True)
    icons(cid, ch['tint'], base)
    apps = app_names(cid)
    common = ['data.js', 'app/chars.js', 'app/core.js']
    # 我的房间
    (base / 'index.html').write_text(page(f"{ch['zh']}的房间 · 奶油动物镇", ch['tint'], '../../', cid, 'room', common + ['app/room.js'], icon='icon-192.png'), encoding='utf-8')
    (base / 'manifest.webmanifest').write_text(manifest(f"{ch['zh']}的房间 · {ch['ko']}의 방", f"{ch['zh']}的房间", ch['tint'], ''), encoding='utf-8')
    # 实操 1 / 实操 2
    for k, mode, zh, ko, js in apps:
        d = base / f'app-{k}'
        d.mkdir(parents=True, exist_ok=True)
        (d / 'index.html').write_text(page(f"{zh} · {ch['zh']}", ch['tint'], '../../../', cid, k, common + [js]), encoding='utf-8')
        (d / 'manifest.webmanifest').write_text(manifest(f"{zh} · {ch['zh']} · {ko}", zh, ch['tint'], '../'), encoding='utf-8')
    print(cid, ' '.join(f'{k}:{m}' for k, m, *_ in apps))
