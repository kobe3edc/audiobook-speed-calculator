# 启用 Google 广告之前的核对

日期：2026-11-10。这是给站点管理者的操作备忘。它不在网站导航里，也不在 sitemap 里。静态托管仍可能让知道路径的人打开这个文件，本备忘不保证该 URL 无法访问。

当前事实限于本站：域名已加到既存 AdSense 做站点验证。首页有 `google-adsense-account` meta，根目录 `ads.txt` 有后台给出的那一行。没有安装 `adsbygoogle.js`，没有 Auto ads，没有在投放广告。审核尚未提交，站点尚未获批。European regulations message 仍未配置。这里不展开持有人的其他账户。隐私页写明正在站点验证/申请且尚未投放。分析横幅只控制 GA4 `G-X0RVS4D5VV`，不是广告同意，也不是已配置的认证 CMP。

## 已经可以留在站点上的

- 隐私页把「现在没有广告」和「将来若真的加上 Google 广告才会发生的 cookie / 个性化广告 / 退出方式」分开写。
- 退出链接使用 Google 帮助页点名的入口：[Ads Settings](https://adssettings.google.com/) 与 [www.aboutads.info](https://www.aboutads.info/choices)。要求本身见 [Required content](https://support.google.com/adsense/answer/1348695?hl=en)（2026-11-10 核对的公开帮助页）。
- 不在没有广告时加广告横幅。`ads.txt` 与首页 meta 使用后台抄录的 publisher ID，不是占位符。

## 接入本站时再做

1. 由账户持有人自己确认：是否年满 18 岁、付款国家/地区、是否已有或曾被终止的 AdSense 账户。本文件不收集这些答案。资格说明见 [Eligibility](https://support.google.com/adsense/answer/9724?hl=en)。
2. 若要向欧洲经济区、英国或瑞士的用户投放个性化广告，必须在开始投放之前满足经 Google 认证并接入 IAB TCF 的 CMP 的适用要求。认证 CMP 不只有 Google 自家一种。本站优先考虑在 AdSense 的 Privacy & messaging 里使用 Google 自己的 European regulations message，这不是唯一合法选项。Google 写明该消息在认证名单中。见 [consent-management requirements](https://support.google.com/adsense/answer/13554116?hl=en)。本站正在做站点验证，该消息仍未配置，所以现在不能写成 CMP 已完成，也不能先投放再等后台提示。
3. 本站 `ads.txt` 已是后台给出的 `google.com, pub-6030194077540135, DIRECT, f08c47fec0942fa0`。首页 meta 是 `ca-pub-6030194077540135`。官方写明 ads.txt 不是强制，但强烈建议。没有要求必须先验证 ads.txt 再验证 JS。
4. 所有权验证可以用 meta、ads.txt 或广告代码。本轮只用 meta 和 ads.txt。不安装 `adsbygoogle.js`。安装验证不等于开始展示广告，也不等于已经送审或获批。隐私页在实际投放前继续写明尚未投放。

## 不按知识库口述执行的部分

2026-11-10 的两份哥飞知识库问答都写明没有打开本站，也没有查 Google 官方文档。它们只作经验，不作实施规则。

- 「广告已经投放之后才处理 CMP，等后台提示」不能当作规则。官方要求是：向欧洲经济区、英国或瑞士投放个性化广告时就要有认证 CMP。适用的同意条件要在投放之前满足，不能等广告先跑起来。
- 「ads.txt 和广告 JS 必须按固定顺序验证」是教程转述的后台操作经验，不是这次核对到的官方政策顺序。现在两种都不安装。
- 「必须补 Blog 和服务条款」是社群「三件套」经验，不是官方准入标准。不为此新增页面或条款。
- 「先把广告 JS 放到每个页面」依赖账户里的代码，与当前不装广告冲突，因此不做。
- 单页曾被退回、日访问约 3000、域名满约三个月，都是经验转述，不是这次核对到的官方统一门槛。对照表补 4 小时一行也不是这次广告准备的必改项。

## 送审

创建账户、提交站点审核、广告开始产生收入是三件不同的事。本文件不代替审核，也不预测收入。
