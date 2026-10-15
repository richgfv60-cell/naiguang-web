# 奶光镇 · NAIGWANG TOWN

가톨릭대학교 AX 캐릭터디자인 课程作业 —— 8 位「情绪治愈官」角色展示网站。

## 怎么打开

双击 `index.html`，用浏览器（推荐 Chrome / Safari / Edge）打开即可。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | 首页（开场动画、介绍、角色墙） |
| `character.html` | 角色详情页（`character.html?id=naitu` 显示奶兔） |
| `style.css` | 全站样式（颜色、字号、动画） |
| `script.js` | **所有角色文字都在这个文件最上面**，改文字改这里 |
| `assets/` | 图片 |

## 图片命名规则

编号对应：01 奶兔 · 02 奶猫 · 03 奶仓 · 04 奶熊 · 05 奶企 · 06 奶狐 · 07 奶海 · 08 奶小熊猫

- 立绘：`assets/hero_01.png`
- 三视图：`assets/turn_clean_01.png`
- 7 个精选表情：`assets/emo_01_1.png` ~ `assets/emo_01_7.png`（顺序和 `script.js` 里 `emotes` 的顺序一致）

> 目前的立绘和三视图是从 Week 8 PPT 里提取并放大的临时图，比较模糊。
> 用同样的文件名把高清原图覆盖进 `assets/` 即可自动替换，代码不用改。
