# PROGRESS

## 当前状态

正在推进 OOTODAY 的衣橱上传流 MVP。

代码层面，上传图片、AI 分析、用户确认后保存到 `items`、Closet 最近衣物展示，这条链路的主要实现和定向测试已经基本补齐。当前真正卡住的不是前端逻辑，而是登录态访问 `/closet` 时后端 Supabase 数据面异常，导致真实浏览器 QA 无法完成。

## 已完成

### 1. 衣橱上传流主链路代码

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

### 2. 测试覆盖

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

## 当前 blocker

### 登录态 `/closet` 真实 500

浏览器登录后访问 `/closet`，本地 dev server 报错：

```txt
PGRST205: Could not find the table 'public.items' in the schema cache
```

进一步验证后，问题不只是 `items`：

我直接用 `.env.local` 里的 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 请求 Supabase REST，结果如下：

- `GET /rest/v1/profiles?...` → `404 PGRST205`
- `GET /rest/v1/items?...` → `404 PGRST205`

这说明当前远端 Supabase 的 REST / PostgREST 层根本看不到这些 public 表，而不是单纯某个前端查询写错了。

## 已确认的排查结论

### 1. 当前 linked Supabase 项目与本地 env 一致

`supabase projects list` 显示当前 linked 项目是：

- `xaoqhaakrzolcyivqutn`

`.env.local` 中的 `NEXT_PUBLIC_SUPABASE_URL` 也指向：

- `https://xaoqhaakrzolcyivqutn.supabase.co/`

所以目前看起来不像“连错 Supabase 项目”。

### 2. 用户已执行远端推送，但结果与运行时矛盾

用户在自己的终端执行了：

```bash
supabase db push --include-all
```

返回：

```txt
Initialising login role...
Connecting to remote database...
Remote database is up to date.
```

这和当前 REST 层仍然看不到 `profiles` / `items` 的事实相矛盾。

### 3. 我本地无法直接拿到远端 migration 明细

我执行：

```bash
supabase migration list --linked
```

失败，报的是直连 Postgres TLS timeout。

所以当前还缺一块关键证据：

- 远端数据库对象是否真实存在
- 还是对象存在但 PostgREST schema cache / API 层异常

## 下一步

1. 继续验证远端数据库里 `public.profiles` 和 `public.items` 是否真实存在。
2. 如果表存在，优先排查 PostgREST schema cache / Supabase API 层状态。
3. 如果表不存在，就按远端真实状态补建或重新应用 migration。
4. 一旦远端 schema 恢复，立刻继续登录态浏览器 QA：
   - 打开 `/closet`
   - 选择图片
   - 等待 AI 分析
   - 修改至少一个字段
   - 保存
   - 确认 recent grid 显示新 item

## 备注

- 当前 worktree 原本没有 `PROGRESS.md`，本文件为本次补建。
- `.gitignore` 里有一行 `.gstack/` 的附带改动，这不是衣橱上传流功能的一部分，后续要单独判断是否保留。
