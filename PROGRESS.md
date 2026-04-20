# OOTODAY 进度追踪

> 最后更新：2026-04-20

## 当前状态

正在推进 OOTODAY 的衣橱上传流 MVP。

代码层面，上传图片、AI 分析、用户确认后保存到 `items`、Closet 最近衣物展示，这条链路的主要实现和主仓测试已经补齐。刚刚确认 `/closet` 的本地 500 不是 Supabase 数据面异常，而是 Turbopack 会因为仓库根目录下的 `.gstack-meta` 符号链接越界扫描而崩溃，导致页面根本没有成功编译。

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
  - 服务端调用 OpenAI `gpt-4o-mini`
  - 只接受 JSON 输出
  - 校验 `category` / `sub_category` / `color_category` / `style_tags`
- `lib/closet/save-closet-item.ts`
  - 将前端 draft 映射到 `items` 表 snake_case 字段
- `app/closet/page.tsx`
  - 已完成 server action 接线
  - 登录态下渲染 `ClosetPage`

### 3. 测试覆盖

已补齐并通过的定向测试包括：

- `tests/components/closet-upload-card.test.tsx`
  - 上传后展示 AI 表单
  - 阻止重复选择导致并发上传
  - 保存成功后调用 `saveItem`
  - 保存成功后触发 `refresh`
  - 保存失败时展示错误
  - abandon flow 时 revoke object URL
- `tests/app/closet/actions.test.ts`
  - analyze action 未登录拒绝
  - analyze action 非法 URL 拒绝
  - save action 未登录拒绝
  - save action 非法 URL 拒绝
  - save action 成功调用 DB 保存并 revalidate
- `tests/lib/closet/analyze-item-image.test.ts`
  - API key 缺失
  - OpenAI 请求失败
  - 空 content
  - invalid JSON
  - 非法 `style_tags`
  - 空字符串字段
  - 正常 trim 与标签裁剪
- `tests/lib/closet/save-closet-item.test.ts`
  - camelCase → snake_case 映射
  - 插入失败抛错
- `tests/components/closet-page.test.tsx`
  - 空状态与 recent items 展示保持可测

### 4. 本地验证结果

已通过的本地验证包括：

- 定向测试曾通过 24/24
- 现在主仓 `npm test` 通过，`35/35` 通过
- `/closet` 在本地 dev server 下不再返回 500

## 已确认的排查结论

### 1. `/closet` 的本地 500 根因不是 Supabase

重新读取 dev server 日志后，真实报错是 Turbopack panic，而不是 `PGRST205`：

```txt
Failed to write app endpoint /closet/page
Caused by:
- [project]/app/globals.css [app-client] (css)
- FileSystemPath("").join("../../.gstack/projects/OOTODAY") leaves the filesystem root
```

也就是说，页面在请求 Supabase 之前就已经因为构建阶段异常而失败。

### 2. 触发 panic 的是仓库根目录下的 `.gstack-meta` 符号链接

`.gstack-meta` 指向 `~/.gstack/projects/OOTODAY`。在 Next.js 16 + Turbopack + Tailwind 4 的组合下，这个仓库外 symlink 会让 CSS 依赖扫描越界，直接把 `/closet` 页面编译打崩。

已采取的修复：

- 删除本地 `.gstack-meta` 符号链接
- 在 `.gitignore` 中加入 `.gstack-meta/`

修复后，访问 `/closet` 会正常返回 `200`，未登录时跳转到登录页，不再是 500。

### 3. `npm test` 的失败也不是业务代码回归

Vitest 原来会把 `.claude/worktrees/` 和 `.worktrees/` 下的历史工作树测试一并扫进去，导致测试结果被旧副本污染。

已采取的修复：

- 在 `vitest.config.ts` 中显式排除 `.claude/worktrees/**` 和 `.worktrees/**`

修复后，主仓测试恢复为只跑当前仓库代码，`11` 个测试文件、`35` 个测试全部通过。

### 4. session pooler 连接串已经配置，但当前执行环境仍无法直连远端 Postgres

我用 `.env.local` 中的 `SUPABASE_DB_URL` 调 `supabase migration list --db-url "$SUPABASE_DB_URL"`，不再是密码错误，而是 TCP/TLS timeout。

这说明 session pooler 配置本身已被正确读取，但当前 Claude 执行环境到 `aws-1-us-east-1.pooler.supabase.com:5432` 仍然不可达，所以远端 schema 核验还不能在这里完成。

## 当前 blocker

### 真实浏览器 QA 还缺登录态

`/closet` 本地页面已经恢复正常，但当前浏览器里还没有有效登录态，所以现在只能验证到未登录跳转登录页，暂时还没跑完完整上传链路。

## 下一步

1. 先在浏览器里完成一次登录，进入真正的 `/closet` 页面。
2. 跑完整衣橱上传 QA：上传图片 → 等待 AI 分析 → 修改至少一个字段 → 保存 → 确认 recent grid 出现新 item。
3. 如果真实上传链路通过，继续开发下一个功能。
4. 如果登录后仍出现远端数据异常，再把远端 Supabase schema 核验放回用户本机网络环境里执行。  
   推荐命令：`supabase migration list --db-url "$SUPABASE_DB_URL"`

## 本次修复涉及文件

- `.gitignore`
- `vitest.config.ts`
- `PROGRESS.md`
