# OOTODAY 首个开发阶段设计：应用骨架 + Supabase 真连接

## 目标

在不实现完整业务功能的前提下，搭出一个真实可运行的 Web MVP 地基。这个阶段结束后，项目应当具备：

1. 可运行的 Next.js 应用骨架
2. 基于 `DESIGN.md` 的全局样式与基础组件
3. 已连接的 Supabase 项目、环境变量和客户端封装
4. 已创建的核心数据表结构
5. 可进入的基础页面壳子，后续功能可以直接往里填

这不是 demo 壳子，而是后续衣橱上传、Today 推荐、OOTD 记录都能直接接着开发的真实起点。

## 范围

### 本阶段包含

- 使用 Next.js App Router 初始化 Web 项目
- 配置 TypeScript、Tailwind CSS、基础 lint 脚本
- 落地 `DESIGN.md` 中的颜色、字体、间距和常用 UI token
- 建立应用主结构与导航骨架
- 创建 Supabase 项目接入所需的环境变量与客户端封装
- 为 MVP 核心实体建立数据库 schema：`profiles`、`items`、`outfits`、`ootd`
- 建立最小认证与会话流转能力，确保后续数据天然按用户隔离
- 在 Today 和 Closet 两个页面展示真实数据库驱动的空状态

### 本阶段不包含

- 衣物图片识别、去背景、拼图拆分
- 天气 API 接入
- 推荐算法与穿搭规则
- 电商链接抓取
- OOTD 完整提交流程
- Inspiration、Shop 页面正式内容

## 推荐方案

采用“前端骨架 + Supabase 真连接”方案。

原因很直接：如果现在只做假数据页面，下一阶段做衣橱上传时还得补数据库、认证、环境变量、数据边界，等于把地基重浇一次。现在一次搭好，后面每个功能都能沿着同一条数据链长出来。

## 架构设计

### 技术栈

- Next.js 16，App Router，TypeScript
- Tailwind CSS 4，按 `DESIGN.md` 映射设计 token
- Supabase，承担 Postgres、Auth、Storage
- npm 作为默认包管理器，优先兼容 Vercel 默认部署路径

### 目录边界

代码结构保持小而清晰，按职责拆分：

- `app/`：路由、布局、页面
- `components/`：可复用 UI 组件与页面骨架组件
- `lib/`：Supabase 客户端、环境变量校验、通用 helper
- `types/`：数据库和页面共享类型
- `supabase/`：schema 或 SQL 初始化文件

目标是让后续每个功能都能往已有边界里落，不需要先重构目录。

### 路由结构

第一阶段只搭真正会承接后续开发的路由：

- `/`：入口页，未登录时显示欢迎与登录入口，已登录则跳转 `/today`
- `/today`：Today 页面骨架，显示天气区块占位、3 张穿搭卡占位或空状态
- `/closet`：Closet 页面骨架，显示衣橱统计、空状态、上传入口按钮占位
- `/auth/callback`：Supabase 登录回调

`/inspiration` 和 `/shop` 这阶段不建正式页面，只在导航设计中预留扩展位置，避免把范围做散。

## 组件设计

### 基础组件

- `AppShell`：统一包住已登录页面的整体布局
- `BottomNav`：底部导航，当前阶段只展示 Today 与 Closet 两个主入口
- `PageHeader`：页面标题和说明区
- `PrimaryButton`、`SecondaryButton`：复用 `DESIGN.md` 按钮规范
- `Card`：通用卡片容器
- `EmptyState`：空页面提示，支持图标、标题、说明和操作按钮
- `StatusBanner`：显示数据库连接错误、环境变量缺失等系统状态

### 页面骨架组件

- `TodayHero`：天气与日期区域的占位模块
- `OutfitCardSkeleton`：推荐卡片占位
- `ClosetSummary`：衣橱数量概览
- `ClosetEmptyState`：无衣物时的主空状态

原则很简单，先把“页面骨架”和“业务能力”分开。这样后面接上传流和推荐引擎时，主要是在骨架里填内容，不是推倒页面重做。

## 数据设计

### 数据表

本阶段直接落 MVP 已确认的四张核心表：

#### `profiles`

- `id`，关联 Supabase Auth 用户
- `city`
- `style_preferences`
- `created_at`
- `updated_at`

#### `items`

- `id`
- `user_id`
- `image_url`
- `category`
- `sub_category`
- `color_category`
- `style_tags`
- `season_tags`
- `brand`
- `last_worn_date`
- `wear_count`
- `created_at`
- `updated_at`

#### `outfits`

- `id`
- `user_id`
- `title`
- `item_ids`
- `scenario`
- `created_at`

#### `ootd`

- `id`
- `user_id`
- `outfit_id`
- `photo_url`
- `satisfaction_score`
- `worn_at`
- `notes`
- `created_at`

### 数据访问原则

- 所有业务表都带 `user_id`
- 读写都以当前登录用户为边界
- 本阶段就配置 RLS，避免后面再补安全边界
- Today 与 Closet 页面只读取最小数据集，避免提前写复杂查询

## 认证与数据流

### 会话流

1. 用户访问 `/`
2. 如果没有会话，显示欢迎与登录入口
3. 登录完成后经过 `/auth/callback`
4. 进入 `/today`
5. 已登录页面通过服务端 Supabase 客户端读取当前用户 session 和最小页面数据

### 页面数据流

#### Today

- 先取当前用户 profile
- 取 `items` 数量和最近数据状态
- 如果衣橱为空，展示空状态，提示去 Closet 上传
- 如果已有衣物但还没推荐逻辑，展示占位卡片和“推荐功能即将接入”的中间态

#### Closet

- 取当前用户的衣物总数
- 若为 0，展示引导上传的主空状态
- 若大于 0，先展示基础网格骨架与数量摘要，为下一阶段上传流接入留位置

这个设计很重要，因为它让页面从第一天开始就是“真数据驱动的空状态”。用户不会看到假装完整的页面，开发也不会陷入先写一套假逻辑再删掉的循环。

## 错误处理

本阶段只处理真实会发生、而且会卡开发的错误：

- **环境变量缺失**：启动时直接报清楚，指出缺哪个值
- **Supabase 连接失败**：页面显示系统状态提示，不静默失败
- **未登录访问受保护页面**：重定向回入口页
- **数据库为空**：显示产品级空状态，不报错

不在这一阶段为未来上传识别失败、天气接口失败之类的问题写额外兜底，因为这些功能还没进场。

## 测试策略

### 自动化

- 对环境变量校验和 Supabase helper 做最小单测
- 对关键页面做渲染 smoke test，确保 `/`、`/today`、`/closet` 至少能稳定渲染

### 手动验证

- 本地启动后确认未登录能进入入口页
- 完成登录后能进入 `/today`
- Today 和 Closet 能根据数据库空状态展示正确内容
- 刷新页面后 session 不丢失

这个阶段的测试目标不是业务正确性，而是确认“应用壳子、认证、数据连接”这三根主电线已经接通。

## 交付标准

完成本阶段后，应满足下面这些结果：

1. 仓库可以本地启动并访问
2. 样式系统已按 `DESIGN.md` 落地到实际页面
3. Supabase 环境变量、客户端、认证回调都已接通
4. 核心 schema 已存在并可读写
5. `/today` 与 `/closet` 使用真实用户数据渲染空状态或基础摘要
6. 后续“衣橱上传流”可以直接在 `Closet` 页面基础上继续开发

## 下一阶段接口

下一阶段是“衣橱上传流”，它会直接复用本阶段产出的：

- `items` 表
- `Closet` 页面骨架
- 登录用户会话
- Supabase Storage 配置
- 基础按钮、卡片、空状态组件

所以这份设计的目标不是把产品做完，而是把最难返工的基础设施一次搭对。