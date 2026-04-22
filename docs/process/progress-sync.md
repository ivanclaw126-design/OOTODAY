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
- Product state: Today recommendation + OOTD feedback MVP is stable, `/today` real weather-success browser QA is complete, and `/shop` now supports product links, extensionless image URLs, local image upload, desktop drag-drop, and an apparel-only guardrail for non-fashion items
- Superpowers state:
  - Active plans in repo still cover app shell, closet upload, today recommendation, and OOTD feedback MVP
  - Native Superpowers persistence in this repo remains the spec/plan artifact set plus execution checkbox state
  - Shop purchase analysis has moved from a link-only MVP into a multi-input flow: major CN commerce platforms now return more accurate site-specific outcomes, local uploads reuse Supabase Storage + the same analysis path, and non-fashion items are blocked before wardrobe scoring
  - QA evidence now includes browser-level validation for `/today` weather success, `/shop` platform-specific behavior, the JD industrial-product rejection path, and component-level verification for local upload + drag-drop
- Gstack state:
  - Native Gstack progress flow for this repo continues to use `/context-save` and `/context-restore`
  - Latest saved checkpoint is now `~/.gstack/projects/OOTODAY/checkpoints/20260422-132656-shop-local-upload.md`
  - This checkpoint captures the new Shop local-upload / drag-drop flow plus the current roadmap decision to keep category scope limited to core apparel
  - Useful operational note from the last checkpoint remains valid: importing local Chrome `localhost` cookies is enough to quickly recover an authenticated QA session
- Pending sync work:
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
