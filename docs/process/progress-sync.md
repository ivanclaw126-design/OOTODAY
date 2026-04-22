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
- Product state: Today recommendation + OOTD feedback MVP is stable, `/shop` now supports links + local uploads + desktop drag-drop with an apparel-only guardrail, Inspiration has advanced into a first recreate-my-version MVP, Closet now shows a first organizing-insights layer with clickable filters plus an ordered action plan, and `/travel` now supports planning, day-by-day rotation, plus saving, listing, reopening, and deleting recent travel plans with fallback snapshot preservation
- Superpowers state:
  - Active plans in repo still cover app shell, closet upload, today recommendation, and OOTD feedback MVP
  - Native Superpowers persistence in this repo remains the spec/plan artifact set plus execution checkbox state
  - Shop has moved into a more usable multi-input flow, Inspiration now covers the "灵感图 -> 我的版本" path, Closet has started turning stored wardrobe data into organizing guidance, and Travel now has its first MVP spec/plan plus a working `/travel` route
  - Closet organizing v1 currently includes duplicate-item grouping, idle-item reminders, missing-basics prompts, clickable filters that switch the Closet grid into the relevant view, and a new "下一步先做这些" action plan that surfaces the most useful next 3 actions
  - Travel Packing MVP v1 currently supports destination city, trip days, scene selection, optional weather-aware messaging, grouped packing entries, missing hints, reuse strategy notes, a day-by-day rotation plan, plus saving, reopening, and deleting recent travel plans; when the dedicated `travel_plans` table is unavailable remotely, fallback storage now still keeps a full plan snapshot instead of only query parameters
  - Closet saved items now also support deletion with a confirmation step before the server action runs, and the image cleanup step is now best-effort so successful deletes are not misreported as failures
  - QA evidence now includes real browser validation for `/today` weather success, real browser validation for `/shop` local upload, user-confirmed real desktop drag-drop success on `/shop`, real browser validation for Inspiration URL/local-upload analysis plus remix output, real browser validation for Closet organizing cards, and real browser validation for `/travel` generate -> save -> recent-list rendering
  - Fresh automated verification now also covers Travel snapshot reopening and the post-review fixes for delete/save semantics; `npm test` is now 107/107 green and the app builds successfully
  - `/travel` has now also completed a real browser dogfood pass covering idle state, real form submission, result rendering, a weather-note bug fix for mild-weather destinations, a real-browser recheck of the new day-by-day rotation plan, and successful save-plan submission
  - Travel save-plan persistence now prefers the new `travel_plans` table, but gracefully falls back to storing lightweight travel metadata in `outfits` when the remote schema has not yet been migrated
- Gstack state:
  - Native Gstack progress flow for this repo continues to use `/context-save` and `/context-restore`
  - Latest saved checkpoint before this round was `~/.gstack/projects/OOTODAY/checkpoints/20260422-150452-travel-daily-plan.md`
  - A fresh checkpoint should capture the Travel save-plan feature, the real browser save QA, and the fallback persistence strategy while `travel_plans` is not yet live remotely
  - Useful operational note from earlier checkpoints remains valid: importing local Chrome `localhost` cookies is enough to quickly recover an authenticated QA session
- Pending sync work:
  - Continue the Travel mainline by turning saved plans into editable/updatable travel records instead of only reopenable snapshots
  - When remote connectivity allows, push `supabase/migrations/20260422_add_travel_plans.sql` so Travel can move from fallback storage back to its dedicated table
  - If needed, add one manual browser QA pass for the new Travel / Closet delete-confirm interactions
  - TODO backlog: continue improving Shop compatibility specifically for Taobao and Dewu if a stable product-image source can be identified
  - Keep Shop scoped to core apparel for now; no shoes / bags / accessories expansion in the current phase
  - Optionally capture direct duplicate-submission UI or network evidence if stronger proof is needed

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
