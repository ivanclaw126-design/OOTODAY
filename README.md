# OOTODAY

OOTODAY 是一个面向真实衣橱的 AI 穿搭助手。它的目标不是做泛泛的灵感瀑布流，而是把用户已经拥有的衣物、当天场景、天气、风格偏好和购买决策放在同一个系统里，回答几个高频问题：

- 今天或明天穿什么
- 这件衣服值不值得买
- 看到一套灵感图后，我的衣橱能不能复刻
- 旅行时怎么少带多穿
- 衣橱里哪些单品重复、闲置或缺基础款

当前项目处于朋友 beta 前的可用 MVP 阶段，主链路是 `Closet -> Today -> OOTD feedback`。

## 已可用功能

### Closet 衣橱

- 本地图片上传、相册批量导入、商品链接或图片链接导入
- 拼图拆分导入
- AI 识别衣物分类、颜色、风格标签
- 保存后浏览、编辑、重新识别、删除
- 图片顺时针右转 90 度，并保留短时间恢复原图窗口
- 重复提醒、闲置提醒、基础缺口和优先动作建议
- 可选算法元数据：slot、层次角色、轮廓、材质重量、正式度、保暖度、舒适度、视觉重量、图案

### Today 今日推荐

- 基于衣橱生成 3 套穿搭建议
- 支持城市天气增强，天气失败时自动降级
- 按天气、季节、暖度、颜色、场景、完整度和新鲜度排序
- 支持换一批推荐
- 支持记录今日已穿、满意度评分、备注、历史查看和编辑
- 评分 reason tags 会进入偏好学习，影响后续推荐权重

### Shop 购买分析

- 支持商品链接、图片链接、本地商品图
- 判断重复风险、预计可搭套数、购买建议
- 商品分析会使用全量衣橱，不只看最近预览的几件
- 已覆盖上装、下装、连体/全身装、外层、鞋履、包袋、配饰
- 对淘宝、得物、京东、拼多多等链接有基础商品图处理和错误提示

### Looks 灵感复刻

- 上传灵感图或图片链接
- 拆解色彩公式、轮廓公式、叠穿关系和视觉中心
- 提取关键单品，并从现有衣橱中找可借用或可替代单品
- 匹配时会结合 slot、类别、颜色、轮廓、风格标签、层次角色和用户偏好
- 避免把配饰误借到上装、下装等核心衣物位置

### Travel 旅行打包

- 输入目的地、天数和场景，生成旅行打包方案
- 输出按天轮换建议、复穿策略、鞋履/包袋/外层缺口提示
- 支持最近方案保存、重开、更新和删除
- 会按天气、场景、轻装偏好、舒适鞋优先级和叠穿复杂度调整方案

### Preferences 偏好引擎

- 风格问卷生成初始偏好
- Today 评分反馈持续学习
- 使用 `defaultWeights + questionnaireDelta + ratingDelta = finalWeights`
- 支持重置和重填问卷
- 远端持久化 `recommendation_preferences` 和 `outfit_feedback_events`

### Settings 与 demo 衣橱

- 支持导入演示衣橱
- 女装演示账号：`test@test.com`
- 男装演示账号：`test-men@test.com`
- 支持清空当前账号的衣橱、OOTD、保存搭配和旅行方案
- `npm run demo:magiclink` 可创建或确认 demo seed 账号并生成维护用 magic link

## 技术栈

- Next.js App Router
- React 19
- Tailwind CSS 4
- Supabase Auth、Postgres、Storage
- OpenAI-compatible 视觉模型接口，当前默认使用 DashScope 兼容模式
- Vitest + Testing Library
- ESLint

## 目录结构

```text
app/                  Next.js 路由与 server actions
components/           页面组件和共享 UI
lib/                  业务逻辑、Supabase client、推荐引擎、AI 输入解析
data/                 demo 衣橱 manifest
supabase/migrations/  数据库迁移
scripts/              demo 账号、demo 衣橱、迁移检查脚本
tests/                单元测试和组件测试
docs/                 beta、流程、规格和执行计划
public/               静态资源与 promo 图片
```

## 本地运行

先安装依赖：

```bash
npm install
```

复制环境变量模板：

```bash
cp .env.example .env.local
```

填入 Supabase、AI 和天气配置后启动开发服务：

```bash
npm run dev
```

默认打开：

```text
http://localhost:3000
```

## 环境变量

必填：

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=
OPENAI_API_KEY=
```

可选：

```text
OPENAI_BASE_URL=
OPENAI_MODEL=
WEATHER_API_KEY=
WEATHER_BASE_URL=
SUPABASE_DB_URL=
SUPABASE_TRANSACTION_POOLER_URL=
```

说明：

- `NEXT_PUBLIC_STORAGE_BUCKET` 当前使用 public bucket，默认项目约定为 `ootd-images`
- 天气能力依赖 `WEATHER_API_KEY`；未配置时 Today 仍可生成基础推荐
- AI 识图当前使用 OpenAI-compatible 接口；项目中常用配置是 DashScope `qwen-vl-max`
- Supabase CLI 在部分网络环境下更适合使用 `SUPABASE_TRANSACTION_POOLER_URL` 的 `:6543` transaction pooler

## 常用脚本

```bash
npm run dev                 # 本地开发
npm run build               # 生产构建
npm run start               # 启动生产构建
npm run lint                # ESLint
npm test                    # Vitest 测试
npm run demo:magiclink      # 创建或确认 demo 账号并生成 magic link
npm run demo:wardrobe:seed  # 写入 demo 衣橱
npm run travel:db:check     # 检查 travel_plans 迁移状态
```

## 数据库与存储

Supabase schema 由 `supabase/migrations/` 管理，核心表包括：

- `profiles`
- `items`
- `outfits`
- `ootd`
- `travel_plans`
- `recommendation_preferences`
- `outfit_feedback_events`

Storage bucket 用于保存衣物图片、商品图和 demo 图片。当前读取逻辑对旧库字段有兼容回退，例如 `image_rotation_quarter_turns`、`algorithm_meta`、`purchase_price` 等字段缺失时不会直接阻断旧数据读取。

## 验证

提交前至少运行：

```bash
npm run lint
npm test
npm run build
```

涉及 Supabase schema 时再运行：

```bash
npm run travel:db:check
```

推荐偏好、Travel 或远端迁移相关改动还应补充 Supabase CLI 的 migration list / dry-run 检查，并确认远端 REST 读写路径。

## 当前 beta 重点

朋友 beta 主要验证第一条闭环：

```text
Landing -> Closet import -> Today recommendation -> OOTD feedback
```

Travel、Shop、Looks 已可用，但当前定位是扩展能力，不是第一轮 beta 的主承诺。下一阶段重点包括：

- 真实邮箱 Auth 和部署环境验证
- 移动端导航手感与截图回归
- Closet 客户端岛继续拆分和懒加载
- Today、Shop、Looks、Travel 的关键文案状态补视觉回归

## 文档

- 项目稳定进度：`PROGRESS.md`
- 当前待办：`TODOS.md`
- beta 验收清单：`docs/beta-readiness-checklist.md`
- 朋友 beta runbook：`docs/beta/friend-beta-runbook.md`
- 推荐/配色/穿搭规则规格：`docs/superpowers/specs/`
- 执行计划：`docs/superpowers/plans/`
