# OOTD 反馈 MVP Design

## Goal

把 Today 推荐页从“只展示建议”推进到“可记录真实穿着结果”的最小闭环。

用户可以直接在 Today 推荐卡里把某条推荐记为“今天已穿”，立刻补一个 1-5 分满意度。系统把这次反馈写入 `ootd` 表，为后续推荐优化和 OOTD 复盘提供第一批真实数据。

## Scope

本轮只做最小必要能力：

- 入口只放在 `Today` 推荐卡内
- 每张推荐卡提供“记为今日已穿”按钮
- 点击后在卡内展开确认态
- 用户必须选择 1-5 分满意度后才能提交
- 提交成功后，Today 页面显示“今日已记录”状态，避免同一天重复记录
- 记录写入 `ootd` 表

本轮明确不做：

- 独立 OOTD 页面
- OOTD 历史列表
- 自拍 / 全身镜 / 相册图片上传
- 场景、舒适度、夸奖数、上镜效果等扩展字段
- `outfits` 持久化建模
- 周报 / 月报 / AI 复盘

## Existing Constraints

当前代码和数据基础已经足够支撑这个 MVP：

- `Today` 页已有推荐卡 UI、server action wiring 和登录态保护
- `ootd` 表已经存在，字段包括：
  - `photo_url`
  - `satisfaction_score`
  - `worn_at`
  - `notes`
  - `outfit_id`
- 当前 `Today` 推荐是运行时生成的推荐摘要，没有持久化到 `outfits` 表

因此这轮不需要先补 outfit 建模，也不需要 migration 才能开始。

## Recommended Approach

### Why this approach

推荐采用“Today 内嵌记录 + 直接写 `ootd`”这条路径。

原因很简单：这是离真实用户动作最近的一步。用户刚看到推荐，马上就能说“我今天穿了这个，而且满意/不满意”。这会把 Today 从静态建议页变成真实反馈页。

如果现在先做独立 OOTD 页面，用户会多一步跳转，MVP 很容易变成“之后再补”。如果现在强行引入 `outfits` 持久化，又会把问题从“收集反馈”变成“设计一套 outfit 数据系统”。那不是这轮该干的事。

## UX Flow

### Today recommendation card

每张推荐卡新增一个主要动作：

- 默认状态：`记为今日已穿`
- 点击后进入卡内确认态
- 确认态展示：
  - 1-5 分满意度选择
  - 提交按钮
  - 取消按钮

### Submission behavior

提交时：

- 用户必须先选满意度
- 提交成功后，不跳转页面
- 当前 Today 页面本地更新为“今日已记录”
- 所有推荐卡都进入不可再次提交状态

原因：这轮的业务规则是“同一天只记录一次 OOTD”。

### Error behavior

如果提交失败：

- 保持在当前卡片确认态
- 卡内显示错误文案
- 用户可以直接重试

不做全局 toast，不做跳转错误页。

## Data Model Decision

### What gets written to `ootd`

每次提交只写最小字段：

- `user_id`
- `worn_at`
- `satisfaction_score`
- `notes`

其中：

- `worn_at` 使用提交当天时间
- `satisfaction_score` 为 1-5
- `notes` 存这次推荐的可读摘要

推荐摘要写入 `notes`，内容应包含：

- 推荐类型：连衣裙 or 上装/下装组合
- 主要单品名称
- 可选外套建议
- 推荐理由

示例：

- `OOTD: T恤 + 待补充下装；理由：先用已有单品起一套思路`
- `OOTD: 针织连衣裙；外层建议：西装外套；理由：一件完成搭配`

### What does NOT get written

这轮不写：

- `outfit_id`
- `photo_url`

`outfit_id` 保持空值。当前 Today 推荐并没有对应的持久化 outfit 记录，强行引入会让 MVP 变重。

## Duplicate Prevention Rule

同一个用户在同一天只允许记录一条 OOTD。

Today 页加载时需要检查：

- 当前用户今天是否已经存在 `ootd` 记录

如果存在：

- 所有推荐卡不再显示“记为今日已穿”可提交态
- 页面显示“今日已记录”状态

这样用户不会重复点，也不会制造多条同日反馈数据。

## Architecture

建议沿用 Today 当前结构，在现有边界上补最少的新能力。

### Server side

新增一个 Today 侧的 OOTD 提交 action，职责只有两件：

1. 检查当前用户今天是否已记录 OOTD
2. 若没有，则向 `ootd` 表插入一条记录

Today route loader 同时补一段“今天是否已记录”的查询，把结果传给页面。

### Client side

Today 推荐卡增加一个轻量交互状态：

- 默认展示 CTA
- 点击后展开评分选择
- 提交中禁用按钮
- 成功后显示已记录
- 失败后显示 inline error

不要新增全局状态管理，不要把这轮变成一个表单系统。

## Files Likely to Change

### Server/data

- `app/today/actions.ts`
  - 新增提交 OOTD action
- `app/today/page.tsx`
  - 读取今日是否已记录，并把 action 传给页面
- `lib/today/get-today-view.ts`
  - 补充 OOTD 当日记录状态
- `lib/today/types.ts`
  - 增加 Today 页面需要的 OOTD 状态类型

### UI

- `components/today/today-page.tsx`
  - 接线 OOTD action 和今日已记录状态
- `components/today/today-recommendation-card.tsx`
  - 新增卡内提交态、评分态、成功态、失败态
- `components/today/today-recommendation-list.tsx`
  - 传递记录相关 props

### Tests

- `tests/app/today/actions.test.ts`
  - 覆盖 OOTD 提交与重复记录拦截
- `tests/components/today-page.test.tsx`
  - 覆盖默认 CTA、展开评分、已记录状态
- 新增 Today view 测试
  - 覆盖已记录 / 未记录两条路径

## Success Criteria

这轮完成后，必须满足：

1. 已登录用户能在 Today 推荐卡上记录“今天已穿”
2. 提交时必须选择满意度 1-5 分
3. 成功后同一天不能重复记录
4. Today 页能正确显示“今日已记录”状态
5. 不需要 `WEATHER_API_KEY` 也不会影响 OOTD 提交
6. 全量测试通过

## Risks and Non-Goals

### Main risk

当前 `notes` 承担了推荐摘要存储，这不是长期最优结构。

但对这轮 MVP 是对的。它让我们先拿到真实反馈，而不是先设计一套 outfit persistence 系统。等用户真的开始产生稳定 OOTD 数据后，再决定是否把推荐摘要结构化迁移到 `outfits`。

### Non-goal reminder

不要在这轮偷偷扩 scope：

- 不做 OOTD feed
- 不做历史页面
- 不做风格分析
- 不做购买建议联动
- 不做图片上传

这轮只解决一件事：把 Today recommendation 变成一个有反馈闭环的页面。
