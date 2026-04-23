# Progress Sync Workflow

> Purpose: keep OOTODAY's development record synchronized across the repo, Superpowers artifacts, and Gstack planning context.

## Source Of Truth

`PROGRESS.md` is the canonical status file.

Everything else should either:
- point to the current source of truth,
- break work into executable steps,
- or preserve external Gstack context that is not stored in git.

Native tool persistence comes before repo-local mirrors.

## Systems And Responsibilities

### Repo / shared context

- `PROGRESS.md`
  - Current product and engineering status
  - Verified behavior
  - Outstanding QA
  - Next steps
- `CLAUDE.md`
  - Agent operating rules
  - Session start and session close workflow

### Superpowers

- Native workflow first:
  - `writing-plans`
  - `executing-plans`
  - plan/spec files as the persistent execution artifacts
- `docs/superpowers/specs/*.md`
  - Approved feature or system design
- `docs/superpowers/plans/*.md`
  - Execution checklist and implementation steps

### Gstack

- Native workflow first:
  - `/context-save`
  - `/context-restore`
- Preferred local mirror: `.gstack-meta/`
- Fallback real path: `~/.gstack/projects/OOTODAY/`
- Expected artifacts:
  - `checkpoints/*.md`
  - design or review outputs
  - timeline metadata

## Session Start Checklist

1. Read `PROGRESS.md`
2. Read this file
3. Recover Gstack state with `/context-restore` when available
4. Read active `docs/superpowers/plans/*.md`
5. If available, read latest gstack checkpoint from `.gstack-meta/checkpoints/*.md`
6. If `.gstack-meta/` is missing, read from `~/.gstack/projects/OOTODAY/checkpoints/*.md`

## Session Close Checklist

1. Update `PROGRESS.md`
2. Update touched Superpowers plan files so checkboxes match reality
3. Persist state through native Superpowers artifacts first
4. Run Gstack `/context-save`
5. Add a short sync snapshot below as a mirror
6. If Gstack cannot be updated in-session, write the intended checkpoint summary here so the next session can carry it over

## Latest Sync Snapshot

- Date: 2026-04-23
- Product state: 共享穿搭规则层又往前推进了一步：Shop 购买分析现在也开始复用 `base / support / accent` 颜色角色语言，结果页新增 `Color Strategy` 区块，会解释这件候选单品更适合做基础主轴、过渡层还是整套重点，以及现有基础色是否足够把它托住
- Product state: 新的穿搭分类与配色策略设计不再只是文档，第一段实现已经落到代码：`lib/closet/taxonomy.ts` 现在能推导 `color_intensity`，Today 推荐理由也开始使用更产品化的规则语言，能解释同色系深浅、基础色托底、以及亮色只保留一处重点这类判断
- Product state: repo 内现在补上了一份新的《穿搭分类与配色策略设计》规格，基于 2026-04-23 对 YouTube / B 站高热视频样本的调研，把当前 Closet taxonomy 之上的下一层共用规则语言整理出来，明确了服装扩展维度、颜色强弱、基础色 / 辅助色 / 强调色角色，以及 `60/30/10`、同色系优先、邻近色优先、首尾呼应、视觉重量平衡等默认策略，准备作为 Today / Shop / Inspiration / Travel 后续共用的解释与打分框架
- Product state: Today recommendation + OOTD feedback MVP is stable, and the Today surface has now received a clearer visual decision layout with stronger status rhythm, more distinct recommendation cards, and lighter history presentation; `/shop` now supports links + local uploads + desktop drag-drop with an apparel-only guardrail and has just been visually tightened into a clearer buy-decision flow; Inspiration has advanced into a first recreate-my-version MVP; Closet now shows a first organizing-insights layer with clickable filters plus an ordered action plan, has expanded its low-friction import flow to album batch import, remote link import with Storage rehosting, and a first collage-splitting import, and now also has a cleaner mobile IA with explicit import / insight / grid sections and a more intentional top import area; `/travel` now supports planning, day-by-day rotation, saving, listing, reopening, deleting, and editing/updating saved travel plans with fallback snapshot preservation, and its page hierarchy has now been polished into a more explicit trip-planning flow; Landing and Closet import cards have now received a dedicated iPhone-width hardening pass covering viewport metadata, Safari text scaling, full-width form controls, mobile button wrapping, and bottom-nav shrink behavior
- Product state: Today recommendation + OOTD feedback MVP is stable, and the Today surface has now received a clearer visual decision layout with stronger status rhythm, more distinct recommendation cards, and lighter history presentation; `/shop` now supports links + local uploads + desktop drag-drop with an apparel-only guardrail and has just been visually tightened into a clearer buy-decision flow; Inspiration has advanced into a first recreate-my-version MVP; Closet now shows a first organizing-insights layer with clickable filters plus an ordered action plan, has expanded its low-friction import flow to album batch import, remote link import with Storage rehosting, and a first collage-splitting import, and now also has a cleaner mobile IA with explicit import / insight / grid sections and a more intentional top import area; Closet recognition has now been refit around a standardized category/color taxonomy with dropdown confirmation, unknown fallbacks, saved-item editing, and one-click re-recognition; `/travel` now supports planning, day-by-day rotation, saving, listing, reopening, deleting, and editing/updating saved travel plans with fallback snapshot preservation, and its page hierarchy has now been polished into a more explicit trip-planning flow; Today outfit generation now also understands the new bottom taxonomy and uses basic color/layering compatibility heuristics instead of only old string equality
- Product state: Today recommendation + OOTD feedback MVP is stable, and the Today surface has now received a clearer visual decision layout with stronger status rhythm, more distinct recommendation cards, and lighter history presentation; `/shop` now supports links + local uploads + desktop drag-drop with an apparel-only guardrail and has just been visually tightened into a clearer buy-decision flow; Inspiration has advanced into a first recreate-my-version MVP; Closet now shows a first organizing-insights layer with clickable filters plus an ordered action plan, has expanded its low-friction import flow to album batch import, remote link import with Storage rehosting, and a first collage-splitting import, and now also has a cleaner mobile IA with explicit import / insight / grid sections and a more intentional top import area; Closet recognition has now been refit around a standardized category/color taxonomy with dropdown confirmation, unknown fallbacks, saved-item editing, and one-click re-recognition; Landing auth has now expanded from magic link only to magic link plus email/password, with first-login default password bootstrap and an in-app Today password-change flow; `/travel` now supports planning, day-by-day rotation, saving, listing, reopening, deleting, and editing/updating saved travel plans with fallback snapshot preservation, and its page hierarchy has now been polished into a more explicit trip-planning flow; Today outfit generation now also understands the new bottom taxonomy and uses basic color/layering compatibility heuristics instead of only old string equality
- Superpowers state:
  - Active plans in repo still cover app shell, closet upload, today recommendation, and OOTD feedback MVP
  - Repo 内新增了 `docs/superpowers/specs/2026-04-23-outfit-taxonomy-color-strategy-design.md` 与对应 plan，作为当前 taxonomy / recommendation 之上的统一穿搭规则层设计
  - 该 plan 已经开始进入实现态：`color_intensity` 映射已落地，Today explanation 也完成了第一轮接入，并有对应单元测试覆盖
  - 同一套规则语言现在也已进入 Shop：`color_role` 已落地到 taxonomy helper，购买分析会输出颜色策略提示，前端结果页也已展示
  - Native Superpowers persistence in this repo remains the spec/plan artifact set plus execution checkbox state
  - Shop has moved into a more usable multi-input flow, Inspiration now covers the "灵感图 -> 我的版本" path, Closet has started turning stored wardrobe data into organizing guidance, and Travel now has its first MVP spec/plan plus a working `/travel` route
  - Closet organizing v1 currently includes duplicate-item grouping, idle-item reminders, missing-basics prompts, clickable filters that switch the Closet grid into the relevant view, and a new "下一步先做这些" action plan that surfaces the most useful next 3 actions
  - Closet import v1 is no longer single-image-only: users can now select multiple local photos at once and step through a shared analyze -> confirm -> save queue, paste a product link or image URL into the same confirmation flow, and split one collage image into 2-4 manually boxed item crops that re-enter the same queue
  - Closet remote-link import now rehosts the resolved remote image into the current user's Supabase Storage path before AI analysis and save, with SSRF, redirect, content-type, and size checks on the server side
  - Travel Packing MVP v1 currently supports destination city, trip days, scene selection, optional weather-aware messaging, grouped packing entries, missing hints, reuse strategy notes, a day-by-day rotation plan, plus saving, reopening, deleting, and editing/updating recent travel plans; when the dedicated `travel_plans` table is unavailable remotely, fallback storage now still keeps a full plan snapshot instead of only query parameters
  - Travel saved plans now enter an explicit editing state when reopened, and saving from that state updates the current plan instead of always creating a duplicate
  - Travel edit mode no longer depends on a stale hidden snapshot when saving: the update action now rebuilds the plan from the current city / days / scenes inputs on the server, so users can change fields and click “更新这份方案” directly without manually re-running generation first
  - Closet saved items now also support deletion with a confirmation step before the server action runs, and the image cleanup step is now best-effort so successful deletes are not misreported as failures
  - QA evidence now includes real browser validation for `/today` weather success, real browser validation for `/shop` local upload, user-confirmed real desktop drag-drop success on `/shop`, real browser validation for Inspiration URL/local-upload analysis plus remix output, real browser validation for Closet organizing cards, real browser validation for Closet batch-import / link-import / collage-splitting import flows, and real browser validation for `/travel` generate -> save -> recent-list rendering
  - Today UX polish now also includes the stronger status header, card ranking labels, clearer outfit breakdown blocks, and lighter history rows described in this session
  - Shop now also matches the beta visual direction better: the upload/link input area reads as one clear decision surface, and the result card is grouped into verdict / repeat-risk / outfit-yield plus explanation panels
  - Travel now also matches the beta visual direction better: the setup form, trip summary, save/update action, packing list, daily rotation, and saved plans each read as clearer sequential sections
  - Closet import browser QA evidence is now concrete: multi-select in the native macOS file picker really enters a `1/3 -> 2/3 -> 3/3` queue, link import really saves, and collage splitting with the default 2 crop boxes really hands off into a `1/2` queue and successfully saves at least one crop
  - The latest mobile polish pass specifically targeted iPhone left/right clipping reports: landing auth inputs and Closet import controls now force `w-full/min-w-0`, action rows collapse vertically on narrow widths, collage controls no longer squeeze into near-vertical buttons, and the bottom nav no longer contributes to page-wide horizontal pressure on mobile
  - The fresh QA pass also surfaced two remaining polish issues in Closet import UX: the preview area can temporarily show two stacked large images during queue transitions, and some AI-recognized category/color/tag values still land in English instead of the otherwise Chinese UI vocabulary
  - Closet taxonomy is no longer free-text-first: a repo-local standard dictionary now defines normalized main categories, subcategories, and richer colors; upload confirmation uses dropdowns; and saved items can be edited or reanalyzed to migrate older records into the new schema gradually
  - Today recommendation logic is now aligned with the same taxonomy layer, so `下装 / 裤装 / 裙装 / 连衣裙`-style legacy values are normalized before recommendation, and pairing now factors in neutral anchors, same-family depth contrast, near-family colors, and cold-weather outer-layer compatibility
  - Auth no longer depends on magic link alone: the landing page now exposes a direct email/password path, first successful magic-link login bootstraps password login using Supabase Auth user metadata instead of new profile columns, and Today now includes a self-serve password change card
  - Fresh automated verification now also covers Closet batch-import queue progression, Closet remote-link import rehosting, Closet collage splitting, Travel snapshot reopening, Travel saved-plan updating in both `travel_plans` and fallback `outfits`, and the post-review fixes for delete/save semantics
  - `/travel` has now also completed a real browser dogfood pass covering idle state, real form submission, result rendering, a weather-note bug fix for mild-weather destinations, a real-browser recheck of the new day-by-day rotation plan, and successful save-plan submission
  - A newer Chrome QA pass now confirms the saved-plan edit flow really works end-to-end after the fix: changing a saved Tokyo trip from 5 days to 6 days and clicking “更新这份方案” directly updates the existing record and recent-plan list without requiring a separate regenerate click
  - Travel save-plan persistence now prefers the new `travel_plans` table, but gracefully falls back to storing lightweight travel metadata in `outfits` when the remote schema has not yet been migrated
- Gstack state:
  - Native Gstack progress flow for this repo continues to use `/context-save` and `/context-restore`
  - Latest saved checkpoint for this round is `~/.gstack/projects/OOTODAY/checkpoints/20260423-122640-auth-password-login-bootstrap.md`
  - The new repo-local command `npm run travel:db:check` now distinguishes “migration missing” from “current environment cannot reach Supabase Postgres”; in this environment it fails on remote connectivity timeout rather than local migration state
  - Useful operational note from earlier checkpoints remains valid: importing local Chrome `localhost` cookies is enough to quickly recover an authenticated QA session
- Pending sync work:
  - `color_intensity`、Today explanation、Shop color-role explanation 已落地，下一步应决定是先把同一套解释模板扩到 Inspiration，还是先做 Travel 的复穿导向颜色逻辑
  - Travel editable saved plans are now shipped; the next step is deciding whether to add “另存为新方案” or unsaved-change protection on top
  - Travel direct-update behavior is no longer pending QA; the remaining follow-up is whether to add unsaved-change protection or “另存为新方案”
  - When remote connectivity allows, push `supabase/migrations/20260422_add_travel_plans.sql` so Travel can move from fallback storage back to its dedicated table
  - If needed, add one manual browser QA pass for the new Travel / Closet delete-confirm interactions
  - Closet import three-flow browser QA is no longer pending; the next pass should focus on fixing and rechecking the preview-stacking issue plus the English-value normalization issue
  - The English-value normalization issue is no longer pending in the same form: the next QA pass should verify whether the new standardized taxonomy is sufficient in real-world wardrobe photos or whether the dictionary needs another expansion round
  - The next auth QA pass should verify the whole flow on a real mailbox and deployed Supabase project: first magic link login -> default password available -> direct password login -> in-app password change -> password login with the new password
  - TODO backlog: continue improving Shop compatibility specifically for Taobao and Dewu if a stable product-image source can be identified
  - Keep Shop scoped to core apparel for now; no shoes / bags / accessories expansion in the current phase
  - Optionally capture direct duplicate-submission UI or network evidence if stronger proof is needed
  - The broader wardrobe-import roadmap still has meaningful room left, but collage splitting and imported-image rehosting to Supabase Storage are no longer future iterations; the next likely step is polishing mobile UX and finishing a full manual browser pass
  - Today page visual polish from this session is complete; the next likely follow-up is checking the same treatment against Closet, Shop, and Travel surfaces for consistency

## Update Template

Use this format when refreshing the snapshot:

```md
## Latest Sync Snapshot

- Date: YYYY-MM-DD
- Product state: ...
- Superpowers state:
  - ...
- Gstack state:
  - ...
- Pending sync work:
  - ...
```
