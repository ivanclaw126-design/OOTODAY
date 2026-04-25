# 自建 Analytics 看板计划

**Goal:** 把现有 console-only beta telemetry 升级成 Supabase-backed 产品看板，回答用户是否完成 `Closet -> Today -> OOTD feedback` 闭环、功能使用情况、卡点和推荐质量。

**Decision:** 首期只做登录用户业务事件，不接 PostHog / Vercel Analytics，不做匿名增长平台。复用现有 `getSession()`、Supabase server/admin client、`outfit_feedback_events` 和 beta telemetry 入口。

## Scope

- [x] 新增 `analytics_events` migration、RLS 和类型定义
- [x] 新增 analytics payload 校验、client `trackEvent()`、server `trackServerEvent()` 和 `/api/analytics/track`
- [x] 保留 `/api/beta/track` 与 `/api/beta/report`，通过 adapter 写入新 analytics 事件
- [x] 埋点核心页面与动作：Closet、Today、Travel、Shop、Looks/Inspiration、system issue reporting
- [x] 新增 `ADMIN_EMAILS` env 与 `/admin/analytics` 管理页
- [x] 增加 Overview、Feature Usage、Funnels、Friction、Recommendation Quality
- [x] 增加单元、route/auth、dashboard component 和受影响页面测试

## Implementation Notes

- `analytics_events` 不开放普通 select，authenticated 用户只能 insert 自己的事件；admin 看板通过 server-side service role 读取。
- `/api/analytics/track` 对未登录、非法 payload、写入失败都返回 `{ ok: true }`，避免埋点影响主流程。
- 旧 beta event 会映射到新事件名，例如 `closet_item_saved -> closet_item_created`、`ootd_submitted -> today_ootd_submitted`。
- Shop 的提交/开始分析在客户端记录，成功/失败在 server action 记录，确保品类、颜色和推荐结论来自真实分析结果。
- Recommendation Quality 直接读取 `outfit_feedback_events`，不复制评分数据到 analytics 表。

## Verification

- [x] `npm test`
- [x] `npm run build`
- [x] `npm run lint`，仅剩既有 `<img>` warnings
- [x] `supabase migration list --workdir /Users/spicyclaw/MyProjects/OOTODAY --db-url <6543 + statement_cache_capacity=0>`
- [x] `supabase db push --dry-run --include-all --workdir /Users/spicyclaw/MyProjects/OOTODAY --db-url <6543 + statement_cache_capacity=0>`

## Open Items

- [ ] 部署或远端试用前，正式执行 Supabase migration push；dry-run 当前显示只会推 `20260425120000_add_analytics_events.sql`。
- [ ] 部署环境配置 `ADMIN_EMAILS` 和 `SUPABASE_SERVICE_ROLE_KEY`，否则 admin 看板无法读取全站分析。
- [ ] 后续如果需要匿名 Landing PV，再加 rate limit 后开放 anon insert；首期保持登录用户数据更干净。
