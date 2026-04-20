# OOTODAY 进度追踪

> 最后更新：2026-04-20

## 当前状态

**衣橱上传流 MVP 已完成 QA 验证。**

完整链路已验证通过：
- 图片上传到 Supabase Storage ✓
- AI 分析（通义千问 qwen-vl-max）成功 ✓
- 用户确认后保存到 items 表 ✓
- 页面显示已上传衣物 ✓

数据库已有 2 条衣物记录，用户可在真实浏览器中查看。

## 已完成

### 1. 第一阶段「App Shell + Supabase Foundation」

已完成并落地的基础能力包括：

- Next.js 16 App Router + React 19 + Tailwind CSS 4 基础工程
- Supabase env / browser client / server client / middleware
- magic link 登录回调与受保护路由
- `/today`、`/closet` 页面骨架与未登录重定向
- 初始 schema migration：`profiles`、`items`、`outfits`、`ootd`
- 基础测试与生产构建验证

### 2. 衣橱上传流主链路代码

已完成的核心文件包括：

- `components/closet/closet-upload-card.tsx`
  - 单图选择/拍照上传
  - 上传中状态
  - 调用 AI 分析
  - 确认后保存
  - 成功后刷新页面
  - 预览 object URL 生命周期清理
- `components/closet/closet-upload-form.tsx`
  - AI 建议确认表单
  - 标签输入标准化
  - 避免无意义 draft 变化重置本地编辑
- `app/closet/actions.ts`
  - `analyzeClosetUploadAction`
  - `saveClosetItemAction`
  - 登录态校验
  - upload URL 归属校验
  - `revalidatePath('/closet')`
- `lib/closet/analyze-item-image.ts`
  - 服务端调用 AI API（支持多模型）
  - 只接受 JSON 输出
  - 校验 `category` / `sub_category` / `color_category` / `style_tags`
- `lib/closet/save-closet-item.ts`
  - 将前端 draft 映射到 `items` 表 snake_case 字段
- `app/closet/page.tsx`
  - 已完成 server action 接线
  - 登录态下渲染 `ClosetPage`

### 3. 测试覆盖

已补齐并通过的定向测试包括：

- `tests/components/closet-upload-card.test.tsx` (5 tests)
- `tests/app/closet/actions.test.ts` (5 tests)
- `tests/lib/closet/analyze-item-image.test.ts` (8 tests)
- `tests/lib/closet/save-closet-item.test.ts` (3 tests)
- `tests/components/closet-page.test.tsx` (2 tests)
- 其他组件测试

**当前测试状态：35/35 通过**

### 4. QA 验证结果

已通过的本地验证包括：

- `/closet` 页面正常渲染（200）
- 图片上传到 Supabase Storage 成功
- AI 分析返回正确的衣物分类信息
- 数据保存到 `items` 表成功
- 页面刷新后显示已上传衣物

### 5. 本次修复内容

**Next.js 16 cookies 问题：**
- `lib/supabase/server.ts` 中 `setAll` 添加 try-catch
- Server Components 不能写入 cookies，由 middleware 处理

**Supabase 数据库配置：**
- 通过 Dashboard SQL Editor 执行 migration 创建 `profiles`、`items`、`outfits`、`ootd` 表
- 创建 Storage bucket `ootd-images` 并设置为 public
- 添加 Storage RLS policies（上传到用户自己的文件夹）

**AI 多模型支持：**
- `lib/env.ts` 新增 `getAiEnv()` 函数
- 支持 OpenAI、z.ai、通义千问、DeepSeek 等多模型
- 配置：`OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`
- 当前使用：通义千问 qwen-vl-max

**修复的问题：**
- Base URL trailing slash 导致 404（移除末尾 `/`）

## 当前配置

### AI 配置（通义千问）
```
OPENAI_API_KEY=<DashScope API Key>
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-vl-max
```

### Supabase 配置
- Storage bucket: `ootd-images` (public)
- 表：`profiles`、`items`、`outfits`、`ootd`（均已创建 RLS policies）

## 下一步

1. 提交本次修复代码
2. 继续开发下一个功能（如 Today 页面的穿搭推荐）
3. 或根据产品规划推进其他 MVP 功能

## 本次修改涉及文件

- `lib/supabase/server.ts` - cookies setAll try-catch
- `lib/env.ts` - 新增 getAiEnv()
- `lib/closet/analyze-item-image.ts` - 使用 getAiEnv()
- `.env.local` - AI 配置更新（配置文件不提交）
- `supabase/migrations/20260419_initial_schema.sql` - 已有
- `PROGRESS.md` - 进度更新