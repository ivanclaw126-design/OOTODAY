# OOTODAY 进度追踪

> 最后更新：2026-04-21

## 当前状态

**Today 推荐 + OOTD 反馈 MVP 已完成代码、测试与基础浏览器验证。**

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
- `app/today/actions.ts` 新增城市保存、OOTD 提交与推荐轮换 action
- `app/today/page.tsx` 接入 `profile.city`、weather、offset 轮换与 OOTD 提交 action
- `components/today/*` 从推荐展示升级为可提交反馈的 Today 页面

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

### 4. 测试覆盖

已通过的测试包括：
- `tests/components/closet-upload-card.test.tsx` (5 tests)
- `tests/app/closet/actions.test.ts` (7 tests)
- `tests/lib/closet/analyze-item-image.test.ts` (8 tests)
- `tests/lib/closet/save-closet-item.test.ts` (2 tests)
- `tests/components/closet-page.test.tsx` (2 tests)
- `tests/lib/today/get-weather.test.ts` (2 tests)
- `tests/lib/today/generate-recommendations.test.ts` (2 tests)
- `tests/lib/today/build-ootd-notes.test.ts` (2 tests)
- `tests/lib/today/save-today-ootd-feedback.test.ts` (2 tests)
- `tests/lib/today/get-today-view.test.ts` (2 tests)
- `tests/app/today/actions.test.ts` (4 tests)
- `tests/components/today-page.test.tsx` (6 tests)
- 其他组件测试

**当前测试状态：57/57 通过**

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

当前未完成的 QA：
- “换一批推荐”在当前测试数据下 URL 会变化，但因衣橱只有 2 件同类上衣，推荐文案变化有限
- 真实天气成功返回分支尚未在本地浏览器验证，当前环境缺少 `WEATHER_API_KEY`
- 这个真实数据暴露出一个已修复的问题：只有上衣、没有完整套装时，旧实现会返回空推荐
- 另一个已修复的问题：保存城市后如果未配置天气 key，旧实现会直接抛错而不是降级
- 同日重复提交的真实浏览器分支尚未做二次手工验证，但服务端测试已覆盖重复拦截逻辑
- 真实 `ootd` 表写入结果尚未在 Supabase 控制台手工复核，但 action、服务层与页面刷新结果均已验证一致

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

## 下一步

1. 提交 Today recommendation + OOTD feedback MVP 工作树改动
2. 做同日重复提交与数据库落表的补充手工 QA
3. 进入下一阶段：围绕 OOTD 记录沉淀更多可用反馈信号

## 本次修改涉及文件

- `lib/today/types.ts`
- `lib/today/get-weather.ts`
- `lib/today/generate-recommendations.ts`
- `lib/today/get-today-view.ts`
- `lib/today/build-ootd-notes.ts`
- `lib/today/get-today-ootd-status.ts`
- `lib/today/save-today-ootd-feedback.ts`
- `app/today/actions.ts`
- `app/today/page.tsx`
- `components/today/*`
- `tests/lib/today/build-ootd-notes.test.ts`
- `tests/lib/today/save-today-ootd-feedback.test.ts`
- `tests/lib/today/get-today-view.test.ts`
- `tests/app/today/actions.test.ts`
- `tests/components/today-page.test.tsx`
- `lib/env.ts`
- `.env.example`
- `PROGRESS.md`
