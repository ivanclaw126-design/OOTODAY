# OOTODAY 进度追踪

> 最后更新：2026-04-22

## 当前状态

**Today 推荐 + OOTD 反馈 MVP 已完成代码、测试与基础浏览器验证。**

**Shop 购买分析 MVP 第一版已完成代码、测试与构建验证。**

**已补充一轮真实浏览器 QA：`/today` 天气成功分支通过，`/shop` 对淘宝 / 京东 / 拼多多 / 得物链接已补上第一轮站点级处理，并会提前拦截非服饰商品。当前 `/shop` 也已支持本地图片上传与桌面拖拽分析。**

当前主链路状态：
- 衣橱上传流已完成 QA 验证 ✓
- Today 页面已接入规则型推荐 ✓
- 城市现在为可选字段，不阻塞推荐 ✓
- 有城市时尝试加载天气，无天气时自动降级为基础推荐 ✓
- 支持在 Today 页面修改城市与“换一批推荐” ✓
- Today recommendation cards now support "记为今日已穿" feedback ✓
- OOTD feedback writes one same-day row to `ootd` ✓
- Satisfaction score 1-5 is required before submit ✓
- Same-day duplicate OOTD submission is blocked ✓
- OOTD 提交会回写 `items.last_worn_date / wear_count` ✓
- Today 推荐会优先避开最近刚穿过的单品 ✓
- Today 页面会展示最近 OOTD 历史记录 ✓
- Shop 页面已上线商品图片 URL 购买分析第一版 ✓
- 购买分析会输出重复风险、预计可搭套数和买不买建议 ✓
- 天气查询已支持中文城市名 fallback（如 `上海`）✓
- Shop 页面已支持真实商品链接解析，能自动提取主图与标题 ✓
- Shop 现在也支持无文件扩展名的真实图片直链（按 `Content-Type` 识别）✓
- Shop 已补上第一轮平台级兼容规则：京东可提取商品图，拼多多会拦截通用分享图，淘宝 / 得物会返回更准确的站点提示 ✓
- Shop 现在会在购买分析前拦截非服饰类目，避免工业品 / 配件类链接产出误导性的穿搭建议 ✓
- Shop 现在支持本地图片上传分析，兼容电脑端文件选择 / 拖拽与 iOS 端相册或拍照上传 ✓

数据库已有 2 条衣物记录，未登录访问 `/today` 会正确跳回首页登录入口。

## 已完成

### 1. 第一阶段「App Shell + Supabase Foundation」

已完成并落地的基础能力包括：
- Next.js 16 App Router + React 19 + Tailwind CSS 4 基础工程
- Supabase env / browser client / server client / middleware
- magic link 登录回调与受保护路由
- `/today`、`/closet` 页面骨架与未登录重定向
- 初始 schema migration：`profiles`、`items`、`outfits`、`ootd`
- 基础测试与生产构建验证

### 2. 衣橱上传流 MVP

已完成并验证通过：
- 图片上传到 Supabase Storage
- AI 分析衣物分类信息
- 用户确认后保存到 `items` 表
- 页面刷新后展示已上传衣物

核心文件：
- `components/closet/closet-upload-card.tsx`
- `components/closet/closet-upload-form.tsx`
- `app/closet/actions.ts`
- `lib/closet/analyze-item-image.ts`
- `lib/closet/save-closet-item.ts`
- `app/closet/page.tsx`

### 3. Today 推荐 + OOTD 反馈 MVP

已完成并验证通过：
- `lib/today/types.ts` 新增 Today 域类型与 OOTD 状态
- `lib/today/get-weather.ts` 新增天气读取与归一化
- `lib/today/generate-recommendations.ts` 新增规则型推荐生成器
- `lib/today/get-today-view.ts` 新增 Today 服务端视图组装与当日 OOTD 状态读取
- `lib/today/build-ootd-notes.ts` 新增 OOTD 摘要生成
- `lib/today/get-today-ootd-status.ts` 新增当日 OOTD 查询
- `lib/today/save-today-ootd-feedback.ts` 新增 OOTD 保存与重复拦截
- `lib/today/get-recent-ootd-history.ts` 新增最近 OOTD 历史读取
- `lib/closet/get-closet-view.ts` 现在会带出 `last_worn_date / wear_count`
- `app/today/actions.ts` 新增城市保存、OOTD 提交与推荐轮换 action
- `app/today/page.tsx` 接入 `profile.city`、weather、offset 轮换与 OOTD 提交 action
- `components/today/*` 从推荐展示升级为可提交反馈的 Today 页面
- `components/today/today-ootd-history.tsx` 新增最近穿搭记录展示

Today + OOTD MVP 行为：
- 未设置城市时继续给基础推荐
- 设置城市后尝试加载天气增强推荐
- 天气请求失败时自动降级为无天气推荐
- “换一批推荐”通过 `?offset=` 轮换结果
- 推荐历史不持久化
- 推荐卡内可直接“记为今日已穿”
- 提交前必须选择 1-5 满意度
- 提交成功后同页切换为“今日已记录”
- 同一用户同一天只允许记录一条 OOTD
- OOTD 反馈直接写入 `ootd.user_id / worn_at / satisfaction_score / notes`
- OOTD 成功提交后会同步更新本次涉及衣物的 `last_worn_date / wear_count`
- Today 推荐优先选择未穿过或更久没穿的单品，减少连续重复推荐
- Today 页面会展示最近 5 条 OOTD 的时间、满意度和记录摘要

### 4. 测试覆盖

已通过的测试包括：
- `tests/components/closet-upload-card.test.tsx` (5 tests)
- `tests/app/closet/actions.test.ts` (7 tests)
- `tests/lib/closet/analyze-item-image.test.ts` (8 tests)
- `tests/lib/closet/save-closet-item.test.ts` (2 tests)
- `tests/components/closet-page.test.tsx` (2 tests)
- `tests/lib/today/get-weather.test.ts` (4 tests)
- `tests/lib/shop/analyze-purchase-candidate.test.ts` (4 tests)
- `tests/lib/shop/resolve-shop-input.test.ts` (8 tests)
- `tests/lib/today/generate-recommendations.test.ts` (4 tests)
- `tests/lib/today/build-ootd-notes.test.ts` (2 tests)
- `tests/lib/today/save-today-ootd-feedback.test.ts` (4 tests)
- `tests/lib/today/get-today-view.test.ts` (2 tests)
- `tests/lib/today/get-recent-ootd-history.test.ts` (1 test)
- `tests/app/today/actions.test.ts` (4 tests)
- `tests/app/shop/actions.test.ts` (4 tests)
- `tests/components/today-page.test.tsx` (7 tests)
- `tests/components/shop-page.test.tsx` (3 tests)
- 其他组件测试

**当前测试状态：82/82 通过**

### 5. QA 验证结果

已通过的本地验证包括：
- `/closet` 页面正常渲染
- 图片上传到 Supabase Storage 成功
- AI 分析返回正确衣物分类信息
- 数据保存到 `items` 表成功
- 页面刷新后显示已上传衣物
- 未登录访问 `/today` 会重定向到 `/`
- 登录态下 `/today` 可展示推荐卡
- 登录态下“换一批推荐”会切换到 `?offset=1`
- 登录态下可展开城市编辑表单
- 登录态下可保存城市，并在缺少天气配置时显示“天气暂时不可用”而不是报错
- 登录态下推荐卡可展开“记为今日已穿”评分表单
- 未选择满意度前“提交今日记录”保持禁用
- 选择满意度并提交后，同页全部推荐卡切换为“今日已记录”
- 页面刷新后仍保持“今日已记录”状态
- 登录态下 `/shop` 已完成真实手工 QA：UNIQLO 商品页链接可成功解析主图并返回购买建议
- 登录态下 `/shop` 已完成真实手工 QA：Unsplash 这类无扩展名图片直链现在可成功识别并完成分析
- 登录态下 `/shop` 已完成真实手工 QA：`127.0.0.1` 这类本地地址会被明确拦截，SSRF 防护生效
- 登录态下 `/today` 已完成真实天气成功分支浏览器 QA，页面展示 `Shanghai Municipality · 18°C · mist`
- 登录态下 `/shop` 已完成平台链接实测：
  - 淘宝链接现在会明确提示“淘宝链接当前会跳登录拦截，请先贴商品图片链接”
  - 京东链接现在可解析 `imageList` 并走完整分析链路
  - 拼多多链接现在会明确提示“这个链接当前只能拿到站点通用分享图，请直接贴商品图片链接”
  - 得物链接现在会明确提示“得物链接当前无法稳定解析，请先贴商品图片链接”
- 登录态下 `/shop` 已完成真实浏览器 QA：京东工业品链接现在会被直接拦下，并提示“当前只支持上衣、裤装、裙装、连衣裙、外套这类服饰单品分析”
- `/shop` 本地图片上传与桌面拖拽已完成组件级验证：支持直接上传图片后走同一套购买分析链路，iOS 端继续通过 `image/* + capture=environment` 调起相册 / 拍照入口

当前未完成的 QA：
- “换一批推荐”在当前测试数据下 URL 会变化，但因衣橱只有 2 件同类上衣，推荐文案变化有限
- 这个真实数据暴露出一个已修复的问题：只有上衣、没有完整套装时，旧实现会返回空推荐
- 另一个已修复的问题：保存城市后如果未配置天气 key，旧实现会直接抛错而不是降级
- 这次真实 QA 又暴露并修复了一个问题：无扩展名图片 URL 旧实现会误判成商品页链接，现已改为按响应 `Content-Type` 识别图片
- 这次真实 QA 还暴露并修复了几个平台兼容性问题：
  - 京东商品页主图原本未被解析，现已补 `imageList` 提取
  - 拼多多原本会误用站点通用分享图，现已改为显式拦截
  - 淘宝原本只会落成“找不到主图”，现已改为显式提示登录拦截
  - 得物原本只会落成普通打不开，现已改为显式提示站点当前不稳定
- 这次还补了一层输入护栏：非服饰类目现在会在购买分析前直接拦截，避免像京东工业品这样的链接被误做穿搭推荐
- 同日重复提交在浏览器实测中已确认首次提交后与页面刷新后都会稳定显示“今日已记录”，且数据库当天仅写入 1 条 `ootd` 记录；但尚未在浏览器 UI 中直接看到二次提交返回“今天已经记录过穿搭了”的错误文案
- 真实 `ootd` 表写入结果已通过只读数据库查询复核：最新一条记录写入成功，且页面提交后与刷新后的 recorded 状态一致

## 当前配置

### AI 配置（通义千问）

## 当前配置

### AI 配置（通义千问）
```
OPENAI_API_KEY=<DashScope API Key>
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-vl-max
```

### 天气配置
```
WEATHER_API_KEY=<Weather API Key>
# 可选：WEATHER_BASE_URL=https://api.openweathermap.org/data/2.5/weather
```

### Supabase 配置
- Storage bucket: `ootd-images` (public)
- 表：`profiles`、`items`、`outfits`、`ootd`（均已创建 RLS policies）

## 验证过程中的环境发现

- worktree 需要单独安装 `node_modules`
- worktree 本地浏览器验证需要单独提供 `.env.local`

## 记录同步约定

- `PROGRESS.md` 是项目当前进展的唯一事实源
- Superpowers 进度优先使用其原生产物与流程记录：
  - `docs/superpowers/specs/*.md`
  - `docs/superpowers/plans/*.md`
  - plan checkbox 与执行状态
- Gstack 进度优先使用其原生保存与恢复：
  - `/context-save`
  - `/context-restore`
  - `.gstack-meta/` 或 `~/.gstack/projects/OOTODAY/` 下的 checkpoint / planning artifacts
- 每次开发收尾都应同步更新：
  - `PROGRESS.md`
  - 涉及到的 `docs/superpowers/plans/*.md`
  - Gstack `/context-save`
  - `docs/process/progress-sync.md` 中的 latest sync snapshot（作为镜像，不替代原生存储）
- 每次进入新会话都应优先尝试 Gstack `/context-restore`
- 如果当前环境不能直接写入 Gstack checkpoint，至少要把 intended checkpoint summary 写进 `docs/process/progress-sync.md`

## 下一步

1. TODO：后续继续深挖 Shop 平台兼容性，优先评估淘宝与得物是否存在可稳定抓取的商品主图数据源
2. 维持当前 Shop 支持范围为核心服饰类目，现阶段不扩展到鞋包 / 配饰
3. 补做一次更强的同日重复提交复现，直接捕获浏览器 UI 或网络层返回的重复提交错误文案

## 本次修改涉及文件

- `lib/today/types.ts`
- `lib/today/get-weather.ts`
- `lib/today/generate-recommendations.ts`
- `lib/today/get-today-view.ts`
- `lib/today/build-ootd-notes.ts`
- `lib/today/get-today-ootd-status.ts`
- `lib/today/save-today-ootd-feedback.ts`
- `lib/today/get-recent-ootd-history.ts`
- `lib/closet/get-closet-view.ts`
- `app/today/actions.ts`
- `app/today/page.tsx`
- `components/today/*`
- `tests/lib/today/build-ootd-notes.test.ts`
- `tests/lib/today/save-today-ootd-feedback.test.ts`
- `tests/lib/today/get-today-view.test.ts`
- `tests/lib/today/get-recent-ootd-history.test.ts`
- `tests/app/today/actions.test.ts`
- `tests/components/today-page.test.tsx`
- `tests/lib/today/generate-recommendations.test.ts`
- `lib/env.ts`
- `.env.example`
- `PROGRESS.md`
