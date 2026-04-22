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

- Date: 2026-04-22
- Product state: Today recommendation + OOTD feedback MVP is stable, and the Today surface has now received a clearer visual decision layout with stronger status rhythm, more distinct recommendation cards, and lighter history presentation; `/shop` now supports links + local uploads + desktop drag-drop with an apparel-only guardrail and has just been visually tightened into a clearer buy-decision flow; Inspiration has advanced into a first recreate-my-version MVP; Closet now shows a first organizing-insights layer with clickable filters plus an ordered action plan, has expanded its low-friction import flow to album batch import, remote link import with Storage rehosting, and a first collage-splitting import, and now also has a cleaner mobile IA with explicit import / insight / grid sections and a more intentional top import area; `/travel` now supports planning, day-by-day rotation, saving, listing, reopening, deleting, and editing/updating saved travel plans with fallback snapshot preservation, and its page hierarchy has now been polished into a more explicit trip-planning flow
- Product state: Today recommendation + OOTD feedback MVP is stable, and the Today surface has now received a clearer visual decision layout with stronger status rhythm, more distinct recommendation cards, and lighter history presentation; `/shop` now supports links + local uploads + desktop drag-drop with an apparel-only guardrail and has just been visually tightened into a clearer buy-decision flow; Inspiration has advanced into a first recreate-my-version MVP; Closet now shows a first organizing-insights layer with clickable filters plus an ordered action plan, has expanded its low-friction import flow to album batch import, remote link import with Storage rehosting, and a first collage-splitting import, and now also has a cleaner mobile IA with explicit import / insight / grid sections and a more intentional top import area; `/travel` now supports planning, day-by-day rotation, saving, listing, reopening, deleting, and editing/updating saved travel plans with fallback snapshot preservation, and its page hierarchy has now been polished into a more explicit trip-planning flow; the repo also now carries a GitHub Pages static progress site deployed via Actions for public sharing
- Superpowers state:
  - Active plans in repo still cover app shell, closet upload, today recommendation, and OOTD feedback MVP
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
  - The fresh QA pass also surfaced two remaining polish issues in Closet import UX: the preview area can temporarily show two stacked large images during queue transitions, and some AI-recognized category/color/tag values still land in English instead of the otherwise Chinese UI vocabulary
  - Fresh automated verification now also covers Closet batch-import queue progression, Closet remote-link import rehosting, Closet collage splitting, Travel snapshot reopening, Travel saved-plan updating in both `travel_plans` and fallback `outfits`, and the post-review fixes for delete/save semantics
  - `/travel` has now also completed a real browser dogfood pass covering idle state, real form submission, result rendering, a weather-note bug fix for mild-weather destinations, a real-browser recheck of the new day-by-day rotation plan, and successful save-plan submission
  - A newer Chrome QA pass now confirms the saved-plan edit flow really works end-to-end after the fix: changing a saved Tokyo trip from 5 days to 6 days and clicking “更新这份方案” directly updates the existing record and recent-plan list without requiring a separate regenerate click
  - Travel save-plan persistence now prefers the new `travel_plans` table, but gracefully falls back to storing lightweight travel metadata in `outfits` when the remote schema has not yet been migrated
- Gstack state:
  - Native Gstack progress flow for this repo continues to use `/context-save` and `/context-restore`
  - Latest saved checkpoint before this round was `~/.gstack/projects/OOTODAY/checkpoints/20260422-150452-travel-daily-plan.md`
  - Intended checkpoint summary for this session: Closet page mobile IA was tightened with explicit import / insight / grid sections, a more intentional top import area, and a denser-to-airier mobile item grid
  - The new repo-local command `npm run travel:db:check` now distinguishes “migration missing” from “current environment cannot reach Supabase Postgres”; in this environment it fails on remote connectivity timeout rather than local migration state
  - Useful operational note from earlier checkpoints remains valid: importing local Chrome `localhost` cookies is enough to quickly recover an authenticated QA session
- Pending sync work:
  - Travel editable saved plans are now shipped; the next step is deciding whether to add “另存为新方案” or unsaved-change protection on top
  - Travel direct-update behavior is no longer pending QA; the remaining follow-up is whether to add unsaved-change protection or “另存为新方案”
  - When remote connectivity allows, push `supabase/migrations/20260422_add_travel_plans.sql` so Travel can move from fallback storage back to its dedicated table
  - If needed, add one manual browser QA pass for the new Travel / Closet delete-confirm interactions
  - Closet import three-flow browser QA is no longer pending; the next pass should focus on fixing and rechecking the preview-stacking issue plus the English-value normalization issue
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
