# 奶油动物镇 · CREAM ANIMAL TOWN

从动物园里消失的动物们居住的小镇。
가톨릭대학교 AX 캐릭터디자인 · STUDIO NULL（第 6 组）角色展示网站。

## 怎么打开

- **电脑**：双击 `index.html`，用 Chrome / Safari / Edge 打开。
- **iPad / 手机**：「文件」App 不能直接打开网页，请用发布后的网址（GitHub Pages）。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `data.js` | ★ **网站上所有文字都在这里**（中文 + 韩文），改字只改这个文件 |
| `index.html` | 首页：开场、世界观、角色目的、分类、目标用户、平台、十件事、角色墙、表情包、幕后、团队 |
| `character.html` | 角色详情页（`character.html?id=naitu` 显示奶兔） |
| `style.css` | 颜色、字号、动画 |
| `script.js` | 页面功能（一般不用改） |
| `assets/` | 图片 |

## 图片文件夹

每个角色一个文件夹，文件夹名就是角色 id：

| id | 角色 |
| --- | --- |
| `naitu` | 奶兔 |
| `naimao` | 奶猫 |
| `naiqi` | 奶企 |
| `naihaibao` | 奶海豹 |
| `naihu` | 奶狐 |
| `naicang` | 奶仓 |
| `naixiong` | 奶熊 |
| `naixiaoxiongmao` | 奶小熊猫 |

每个文件夹里：

- `hero.png`：透明底立绘（从角色卡自动去背）
- `card.jpg`：角色卡原图
- `ai_1.jpg`、`ai_2.jpg`：造型实验（第 6 周）
- `sheet.jpg`：表情表（第 7 周）
- `pose_1.jpg` ~ `pose_3.jpg`：3 种姿势（第 7 周）

`assets/town/` 里是小镇插画、风格比较图和周边图。

想换图片的话，用**同样的文件名**覆盖原文件就行，代码不用改。

## 角色小应用（第 4 周）

每位居民有一个「我的房间」：`characters/角色id/`，里面挂着两个小应用，都能添加到手机主屏幕（PWA）。

| 角色 | 实操 1 · 记录型 `app-a/` | 实操 2 · 游戏型 `app-b/` |
| --- | --- | --- |
| 奶兔 | 深夜心情信（心情日记） | 抱枕解忧（解忧魔法球） |
| 奶猫 | 侦查清单（待办笔记） | 喷嚏反应（反应速度测试） |
| 奶企 | 今日打卡（每日习惯打卡） | 整理翻牌（翻牌配对） |
| 奶海豹 | 云朵热饮（喝水记录） | 焦虑跳一跳（按住蓄力跳过写着焦虑的礁石） |
| 奶狐 | 灵感灯泡（点子待办） | 今日灵感签（今日运势） |
| 奶仓 | 借出登记簿（借还记录） | 守护储藏室（打地鼠） |
| 奶熊 | 守护专注（专注计时） | 软垫接接乐（接掉落物） |
| 奶小熊猫 | 小故事日记（一句话日记 + 月历） | 你是小镇里的谁（性格测试） |

- **改应用里的文字 / 台词**：只改 `app/chars.js`（每种情况 5 句台词，中文 + 韩文）
- 功能代码：`app/record.js`（记录型）、`app/game.js`（游戏型）、`app/room.js`（我的房间）、`app/core.js`（反应规则表 `react()`、存储、语言切换）
- 表情 PNG：`assets/角色id/face/`（happy / proud / sad / surprised / sleep / love，从表情表裁出来的）
- 新增角色或改应用名后，运行 `python3 tools/make_apps.py` 重新生成页面、图标和 manifest
- 记录只存在使用者自己的手机里（localStorage），没有服务器，也不扣分

## 小游戏「奶油镇 · 出门去」（放置旅行）

- 网页版：`trip/`，安卓安装包：`trip/cream-trip.apk`（首页「小镇应用」里有入口）
- 玩法：选一位居民 → 院子收三叶草 → 商店买便当（决定走多远）和道具（决定去哪里）→ 整理行李 → 居民自己出门，中途寄明信片，回来带特产
- 设置里的「演示模式」：1 分钟变 1 秒，录视频用
- 改目的地、道具、台词：只改 `trip/places.js`
- 两个 APK：`trip/cream-trip.apk`（只有小游戏）、`download/cream-town.apk`（小镇应用：8 个房间 + 小游戏，打开后是 `apps.html`）
- 重新打 APK（需要 Android SDK）：`cd android && gradle assembleTripDebug assembleTownDebug`，产物在 `android/app/build/outputs/apk/`，再分别复制到上面两个位置。打包时会自动把网页文件和表情 PNG 拷进 APK
- `apps.html`：小镇应用合集页，可以「添加到主屏幕」；首页「小镇应用」下面的「放到手机主屏幕」卡片在 `app/install.js`
