# 第一批整改质检（发布前）

记录时间：2026-11-21  
仓库基线：`origin/main` = `6cd5d9a42b5764a24f5dae27c6b45999a356abf0`（本轮已 `git fetch origin main`，与本地 `main` 一致）  
范围：B1-1、B1-2、B1-4、B1-5，以及 B1-6 的发布前部分。B1-3 未获单独批准，未做。  
未合并、未部署、未改 DNS / Git 绑定 / Vercel / 账号，未安装广告脚本，未点击申请审核。

本文件不在导航和 sitemap 里。静态托管仍可能让知道路径的人打开它。

这次改动把现有计算器的边界和舍入写成可复核的例子，并修正一处步进缺陷。它不说明 Google 这次拒审的具体触发条件，也不保证再次审核会通过。2026-11-21 的邮件和后台没有给出示例 URL。公开页此前没有 `adsbygoogle`，本次抓取也不能把「广告已经出现在无内容屏幕上」写成观察事实。用户已确认收款信息无误；本批不处理收款。

## 范围对照

| ID | 实际处理 | 证据 |
| --- | --- | --- |
| B1-1 | 用手算核对时长、倍速、节省、百分比、天数和输入边界。只改了已证实的分钟减步缺陷。舍入规则未改。 | 下文用例表；原先 14 项仍通过，2026-11-22 增至 15 项 |
| B1-2 | 在现有 How It Works 增加三段可复核例子和天数说明。未新开 URL，未加对照表行，未改 FAQ 平台档位。 | `index.html` 的 `#how-it-works`；禁用 JS 后正文仍在 |
| B1-3 | 已做。标签改为 “Whole book at this speed”，并说明这是全书收听时间占原时长的比例，不是已听进度。公式未改。 | `index.html` 的 `#length-share-label` 与 `#length-share-note`；仪表 `role="meter"` |
| B1-4 | About 增加一段可从实现核实的说明：浏览器内计算、0.05 步进、分别舍入。没有新的个人身份、公司或团队。 | `about.html`；仍写「there is no team history to tell」 |
| B1-5 | Contact 正文未改。仍只有公开 GitHub Issues，没有新邮箱。 | `contact.html` 与改动前相同；2026-11-21 GitHub API：`has_issues=true`，仓库公开，当时 open issues 为 0 |
| B1-6 发布前 | 本地预览做了下面的检查。生产项全部未执行。 | 见「生产检查：未执行」 |

## B1-1 调查

核心式：总分钟 = 小时 × 60 + 分钟；收听 = 总分钟 ÷ 倍速；节省 = 总分钟 − 收听。时钟先对整个分钟数做一半向上（`Math.round`），再拆小时和分钟，所以 60 分钟显示成 `1h 00m`，不会留下 `0h 60m`。百分比各自四舍五入。天数用舍入前的收听分钟 ÷ 120，再保留一位小数。

已核对、确认不是缺陷、因此没改公式的行为：

- 小时 0–200、分钟 0–59 的每一个整数组合都按原值接受；`0` 小时 `0` 分钟拒绝。测试循环覆盖了全部 201 × 60 组。
- `1.5` 小时、`30.5` 分钟、`1.0`、`1e3` 都拒绝，`totalMinutes` 为 `undefined`，不会变成 90、60 或 30。
- 空字段、负数、小时 201、分钟 60 都拒绝。
- `1h 59m` @ `2.00x`：119 ÷ 2 = 59.5，两个标签都是 `1h 00m`。这与既有生产和测试约定一致，没有改成「凑回 1 小时 59 分」。
- `10h` @ `1.50x`：`6h 40m`，节省 `3h 20m`，33% less time，约 3.3 天。
- 倍速 1.00 和 3.00 接受；0.95 和 3.05 拒绝。滑杆 0.05 步从 1.00 到 3.00 都能规范化。
- 对照表 8/12/20/30 小时 × 1.25/1.50/1.75/2.00 与同一舍入一致，未加行。
- 百分比各自四舍五入时，1.60x 的 62.5% 和 37.5% 会显示成 63 和 38，相加是 101。这是规则的结果，不是算错。已写进例子，未改算法。
- 天数用未舍入的收听分钟。`10h` @ `1.15x` 的时钟是 `8h 42m` 和 `1h 18m`（加回 10 小时），天数是约 4.3 天，而不是用 522 分钟算出的 4.4。未改，因为一位小数的提示更接近真实时长。页面写明了这个差别。

证实并已修改的缺陷：分钟减步只把分钟夹到 0，不向小时借位。`2h 03m` 减 5 分钟原来得到 `2h 00m`；加 5 分钟越过 59 则会进位。现按总分钟计算，并仍限制在 `0h 00m` 到 `200h 59m`。

| 手算 | 期望 | 本批实际 | 是否改代码 |
| --- | --- | --- | --- |
| `1h 59m` @ 2.00x：119 ÷ 2 = 59.5 | `1h 00m` / `1h 00m` / 50% / 约 0.5 天 | node 与本地浏览器一致 | 否 |
| `10h` @ 1.50x：600 ÷ 1.5 = 400 | `6h 40m` / `3h 20m` / 33% / 约 3.3 天 | node 与本地浏览器一致 | 否 |
| `12h 30m` @ 1.50x：750 ÷ 1.5 = 500 | `8h 20m` / `4h 10m` / 约 4.2 天 | 默认静态 HTML 与浏览器一致 | 否 |
| `4h` @ 1.60x：240 ÷ 1.6 = 150 | `2h 30m` / `1h 30m`；62.5%→63%，37.5%→38%；约 1.3 天 | node 与本地浏览器一致 | 否 |
| `3h` @ 3.00x：180 ÷ 3 = 60 | `1h 00m` / `2h 00m` / 67% / 200% faster | node 与本地浏览器一致 | 否 |
| `10h` @ 1.00x | `10h 00m` / `0h 00m` | node 与本地浏览器一致 | 否 |
| `10h` @ 3.00x：600 ÷ 3 = 200 | `3h 20m` / `6h 40m` / 约 1.7 天 | node 一致 | 否 |
| `10h` @ 1.15x：600 ÷ 1.15 = 521.739… | 时钟 `8h 42m` / `1h 18m`；天数约 4.3 | node 一致 | 否 |
| `0h 01m` @ 1 与 @ 3 | `0h 01m`/`0h 00m`；`0h 00m`/`0h 01m` | node 一致 | 否 |
| `0h 59m` @ 1.00x | `0h 59m` / `0h 00m` | node 一致 | 否 |
| `200h 00m` @ 1 与 @ 3 | `200h 00m`；`66h 40m` / `133h 20m` | node 一致 | 否 |
| `200h 59m` @ 1 与 @ 3 | `200h 59m`；`67h 00m` / `133h 59m` | node 一致 | 否 |
| `1.5` 小时、`30.5` 分钟、空、`0h 0m` | 拒绝，不截断，结果为 No result | node 与本地浏览器一致 | 否 |
| `2h 03m` 按分钟减 5 | 总分钟 123 − 5 = 118 = `1h 58m` | 改前为 `2h 00m`；改后 node 为 `1h 58m`。浏览器在 1.50x 下点击减号后字段为 1 和 58，收听 `1h 19m`（118 ÷ 1.5 = 78.666…） | 是 |
| `1h 00m` 减 5 分钟 | `0h 55m` | node 一致 | 是 |
| `200h 00m` 减 5 分钟 | `199h 55m` | node 一致 | 是 |
| `0h 03m` 减 5 分钟、`200h 55m` 加 5 分钟 | `0h 00m`；`200h 59m` | 与改前测试期望相同 | 边界仍成立 |

前导零（如 `01`）和 `+3` 仍被拒绝，不会收成 1 或 3。提示句仍用「小数不会被截断」举例，对前导零略宽，但拒绝本身符合「不截断」。未改文案。

## B1-2 新增的说明

只加在现有 How It Works，禁用 JS 时仍在 HTML 里：

- `1h 59m` @ 2.00x 的 59.5 分钟，以及两个标签相加比原书多 1 分钟。
- `4h` @ 1.60x 的整除时钟，和 63% 与 38% 相加为 101。并写明 38% less time 不是 60% faster。
- 1.00x 不改变时长；本页最快只算到 3.00x，`3h` @ 3.00x 为 `1h 00m` / `2h 00m`，67% less time，200% faster。
- 天数用舍入前的分钟。`10h` @ 1.15x 的时钟加得回 10 小时，天数是约 4.3 天，不是完成日期。

未把这些数字再写进对照表或 README。Step 1 底部原来的 “Compatible with all formats” 与代码不符（页面不读取音频文件），改成 “Uses the length you type, not an audio file”。首页描述里的 “Works for Audible, Spotify, Libby, and more” 也已去掉，避免写成和这些应用对接。

随后一次补丁改了 FAQ 的平台数字和音高句，只保留 2026-11-22 打开的官方页里写明的范围，并在句内给出来源。没有新页面。

| 公开说法 | 来源与范围 | 不写成 |
| --- | --- | --- |
| Audible 可选 0.5x 到 3.5x；Audible.com 云播放器是 0.5x 到 3.5x、步进 0.1；Alexa 是语音指令，没有数字范围 | https://www.audible.com/ep/NarrationSpeed | 所有端都是 0.05 或 0.1 步进；iOS/Android 的步进 |
| Libby 预设或微调滑杆 0.6x 到 3x | https://help.libbyapp.com/en-us/6048.htm | OverDrive 单独档位 |
| Mac 上的“图书”最慢 0.75x、最快 2x | https://support.apple.com/guide/books/listen-to-audiobooks-ibks9a460640/mac | iPhone、iPad 或其他设备 |
| Spotify 手机正在播放、桌面和网页播放器有播放速度控制；该文没有最小、最大或步进 | https://support.spotify.com/us/article/audiobooks-unlock/ | 0.5x 到 3.5x |
| Storytel 播放器里标着 1.0x 的控制用来选速度；该文没有列出速度或步进 | https://support.storytel.com/hc/en-001/articles/360010485739-Audiobook-Player | 可变拨盘或任何数字范围 |
| 本页自己的控件是 1.00x 到 3.00x、步进 0.05 | `index.html` 滑杆 | 把它说成上述应用的限制 |
| 本页不播放音频，也不声称这些应用保持音高 | 上述帮助页都没有跨应用的音高结论 | “不会变调 / chipmunk / 四家应用都做音高修正” |

没有新增理解力、医学或「更快仍能听懂」的说法。

## B1-4 与 B1-5

About 只多一段：数字在浏览器里算，倍速按 0.05 从 1.00x 到 3.00x，收听和节省分别舍入，因此两个时钟标签可以比原书多 1 分钟；百分比也分别舍入；具体数字链到 How it works。原有的独立免费工具、10 小时例子、整数限制、没有公司或团队、不连接账号、每天 2 小时只是提示，都保留。

Contact 没有为了变长而加段落，没有新邮箱。

## 本地预览（不是生产）

预览地址只使用 `http://127.0.0.1:8765/`，由临时静态服务把 `/about`、`/privacy`、`/contact` 映射到对应 HTML。没有请求生产站点，因此没有对生产发分析。

本地 Google Chrome 157.0.8103.50 无头模式，桌面 1280×900，手机 390×844：

- 默认 `12h 30m` @ 1.50x 为 `8h 20m` / `4h 10m`。
- 上表中的 `1h 59m` @ 2.00x、`10h` @ 1.50x、`4h` @ 1.60x、`3h` @ 3.00x、`10h` @ 1.15x、`10h` @ 1.00x 与手算一致。2.00x 预设在样式更新后呈选中态。
- 输入 `1.5` 小时和 `30.5` 分钟时出现 “not truncated”，结果为 No result，小时字段仍显示 1.5，没有收成 1。
- 空和 `0h 0m` 显示对应错误和 No result。
- 锚点 `calculator`、`presets`、`how-it-works`、`faq`、`speed-charts` 都在。手机导航有 How It Works。
- `/about`、`/privacy`、`/contact` 在未同意的新配置里没有 `googletagmanager` 脚本，也没有 `adsbygoogle`。只有首页有 `google-adsense-account` = `ca-pub-6030194077540135`。
- 同意条默认可见。Decline 后横幅关闭，标签仍不加载，`localStorage` 为 `declined`。Accept 后才插入 `https://www.googletagmanager.com/gtag/js?id=G-X0RVS4D5VV`。该请求在本地被拦截，没有送到 Google。
- 禁用 JS 后，`AudioCalc` 不存在；标题、How It Works、三段例子、对照表里的 `6h 24m` / `Save 2h 40m`、FAQ 问题，以及 HTML 里写好的默认 `8h 20m` 仍可读。禁用 JS 时表单不会重算。

`ads.txt` 仍是一行：`google.com, pub-6030194077540135, DIRECT, f08c47fec0942fa0`。标题、H1、首页 canonical 未改。

## 测试

```bash
node --test test/calculator.test.js
```

2026-11-21 首轮：14 项通过。2026-11-22 同一命令：15 项通过，0 项失败。新增的一项锁定 FAQ 来源句和 “Whole book at this speed”。原先 14 项没有失败。没有新依赖。

## 发布清单（只含公开文件）

哈希是 SHA-256，按 2026-11-22 本分支工作区字节计算。`docs/` 和 `test/` 不在此清单里，不要为了上线把它们当成站点页面。上传时要带上 `vercel.json`，否则 `/about` 这类无后缀路径可能对不上；它本身不是公开页面。

| SHA-256 | 字节 | 文件 | 公开路径 |
| --- | --- | --- | --- |
| `9aaed308cf8424f8f601c2963a414fc55127a1c3df3e992ae22cb1536a1c6f2e` | 43231 | `index.html` | `/` |
| `05ce7babab5d616b25d4bf9ba9a2be063f7c18cc161ce387d5c971a561a39c0f` | 7125 | `about.html` | `/about` |
| `9047744ee1dcd4f41bca2618f5b216a1a1dbec500eacb9592e82f5c5852520a5` | 12109 | `privacy.html` | `/privacy` |
| `18783022d8839469f106ea08ad43aab0e1af53c54b2547f70d7955f418c0e9c7` | 5972 | `contact.html` | `/contact` |
| `658d9b1ec39f06590ed765c71140f87c08bf03ca35f0c8f337932ab4358191ee` | 6429 | `calculator.js` | `/calculator.js` |
| `f0451571c1e9d7b56ba926736bf605bcea13c738f31b527f187f0e10d413416b` | 2933 | `analytics-choice.js` | `/analytics-choice.js` |
| `97dd71eee030b6eefda245be3e6148877657ebdd8ec149165f021ff02b2ce29f` | 4503 | `theme.js` | `/theme.js` |
| `8f654adf976f9764dfae55951ee4f14101212618599bbbfcb8e4e257985c2e05` | 1091 | `site.css` | `/site.css` |
| `9f2880c34ab0df1aa951b847eba483fab268489332b3149e71c8e2b99dd91091` | 59 | `ads.txt` | `/ads.txt` |
| `7b5cc70d46c4295b67775c259cbdf352165485c548e1aa28de0de2e8b4a080b7` | 82 | `robots.txt` | `/robots.txt` |
| `04cd89d81a2e742a37bf966d64dde272dfa2ea5faa5dd8ea14d9716a36be40d3` | 669 | `sitemap.xml` | `/sitemap.xml` |
| `0047424b786df91152aceb07e4fe0c1d24d6a6169db831cfe11a0eb1e9ac88a4` | 358 | `favicon.svg` | `/favicon.svg` |

随包配置，不是公开页面：`vercel.json` SHA-256 `f91c66a44fb4186c4d6be9ae89d68c058f5c7abe811b20f60159302b96029c09`，50 字节。`cleanUrls` 为 true，`trailingSlash` 为 false。

上线后把线上这些 URL 的响应体和上表逐字节对照。不一致就不要把它记成已发布。

## 回滚

2026-11-22 用 Vercel 只读接口核对了现网部署，没有改任何设置：

- 部署 ID：`dpl_C8ChkaR9atKoqDjpFVzmDxdQVVAM`
- 状态：READY，target 为 production
- 创建时间：2026-11-10T04:55:51.394Z
- 项目：`audiobook-speed-calculator`（`prj_svJW6P43c9VoOpB0NrHTPmJbOW9J`）
- 别名包含 `audiobookspeedcalculator.net` 和 `www.audiobookspeedcalculator.net`
- 返回记录里没有 git 源。Git 仍视为未绑定。合并本 PR 不会自动部署。

若新的文件部署需要撤回，在 Vercel 里把生产别名重新指回 `dpl_C8ChkaR9atKoqDjpFVzmDxdQVVAM`。不要靠 git revert 代替这一步。这次没有执行回滚，也没有创建新部署。

## 生产检查：未执行

以下各项这次没有做，不能写成通过或失败：

- 生产 HTTPS 上 `/`、`/about`、`/privacy`、`/contact`、`/robots.txt`、`/sitemap.xml`、`/ads.txt` 的状态码。
- 生产首页 canonical 是否仍为 `https://audiobookspeedcalculator.net/`。
- `www` 与 HTTP→HTTPS。规划里提到的 Pingora 500 只是旧环境观察，这里不把它记成线上故障，也不记成已修复。
- 上表哈希与生产响应体的对照。
- 新部署的 ID。没有部署，所以上面的 `dpl_C8ChkaR9atKoqDjpFVzmDxdQVVAM` 仍是当前生产，不是本分支的发布结果。
- 申请审核。未点击。广告脚本未安装。

上线若获批准，继续用现有的文件部署，然后补做上面几项。合并仓库不等于已经上线。这次改动也不保证 AdSense 会通过。
