# 启用 Google 广告之前的核对

日期：2026-11-10。这是给站点管理者的操作备忘，不是给访客的页面，也不在 sitemap 里。

当前事实：站点没有广告、没有 AdSense 账户、没有 publisher ID、没有 `ads.txt`，也没有安装广告代码。隐私页仍写明目前不展示广告、不使用 AdSense。分析横幅只控制 GA4 `G-X0RVS4D5VV`，不是广告同意，也不是已配置的认证 CMP。

## 已经可以留在站点上的

- 隐私页把「现在没有广告」和「将来若真的加上 Google 广告才会发生的 cookie / 个性化广告 / 退出方式」分开写。
- 退出链接使用 Google 帮助页点名的入口：[Ads Settings](https://adssettings.google.com/) 与 [www.aboutads.info](https://www.aboutads.info/choices)。要求本身见 [Required content](https://support.google.com/adsense/answer/1348695?hl=en)（2026-11-10 核对的公开帮助页）。
- 不在没有广告时加广告横幅，不编造 `pub-` 编号，不上传 `ads.txt`。

## 有账户之后才做

1. 由账户持有人自己确认：是否年满 18 岁、付款国家/地区、是否已有或曾被终止的 AdSense 账户。本文件不收集这些答案。资格说明见 [Eligibility](https://support.google.com/adsense/answer/9724?hl=en)。
2. 若要向欧洲经济区、英国或瑞士的用户投放个性化广告，必须在开始投放之前，于 AdSense 的 Privacy & messaging 里配置 Google 自己的 European regulations message。Google 写明：向这些地区投放个性化广告时，须使用经 Google 认证并接入 IAB TCF 的 CMP；该消息在认证名单中。见 [consent-management requirements](https://support.google.com/adsense/answer/13554116?hl=en)。没有账户时无法在该产品里完成配置，所以现在不能写成 CMP 已完成，也不能因此先投放再等后台提示。
3. 账户里出现真实 publisher ID 之后，再按 [ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en) 放一行 `google.com, pub-……, DIRECT, f08c47fec0942fa0`。官方写明 ads.txt 不是强制，但强烈建议。该页没有把「先验证 ads.txt、再验证 JS」写成政策顺序。ID 必须来自账户，不能先写占位符。
4. 广告代码只在决定实际投放时再放。隐私页里「目前不使用 AdSense」这句，要到广告代码已经上线才可以改掉。在那之前保留。

## 不按知识库口述执行的部分

2026-11-10 的两份哥飞知识库问答都写明没有打开本站，也没有查 Google 官方文档。它们只作经验，不作实施规则。

- 「广告已经投放之后才处理 CMP，等后台提示」不能当作规则。官方要求是：向欧洲经济区、英国或瑞士投放个性化广告时就要有认证 CMP。适用的同意条件要在投放之前满足，不能等广告先跑起来。
- 「ads.txt 和广告 JS 必须按固定顺序验证」是教程转述的后台操作经验，不是这次核对到的官方政策顺序。现在两种都不安装。
- 「必须补 Blog 和服务条款」是社群「三件套」经验，不是官方准入标准。不为此新增页面或条款。
- 「先把广告 JS 放到每个页面」依赖账户里的代码，与当前不装广告冲突，因此不做。
- 单页曾被退回、日访问约 3000、域名满约三个月，都是经验转述，不是这次核对到的官方统一门槛。对照表补 4 小时一行也不是这次广告准备的必改项。

## 送审

创建账户、提交站点审核、广告开始产生收入是三件不同的事。本文件不代替审核，也不预测收入。
