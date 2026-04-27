# Progress Sync Workflow

> Purpose: keep a lightweight repo-local recovery path when native Gstack or Superpowers context is unavailable.

## Source Of Truth

- `PROGRESS.md` is the canonical project status file.
- Superpowers specs/plans remain the source for design and execution detail.
- Gstack `/context-save` and `/context-restore` remain the primary save/restore path for session delta.

## Session Start Checklist

1. Read `PROGRESS.md`.
2. Read only the incomplete or recently modified `docs/superpowers/plans/*.md`.
3. Run Gstack `/context-restore` when available.
4. Read only the latest checkpoint from `.gstack-meta/checkpoints/*.md` or `~/.gstack/projects/OOTODAY/checkpoints/*.md`.
5. Read this file's snapshot only if native Gstack restore failed or checkpoint context is missing.

## Session Close Checklist

1. Update `PROGRESS.md` if stable project status changed.
2. Update any touched Superpowers plans so checkboxes match reality.
3. Run Gstack `/context-save` once per independently recoverable work batch, not for every micro-iteration.
4. Refresh the short snapshot below only as a mirror and fallback index.

## Checkpoint Writing Rules

- Keep checkpoints incremental: only record what changed in this work batch.
- Preferred structure:
  - `Summary`
  - `Verification`
  - `Open items`
  - `Refs`
- Target 15-30 lines per checkpoint.
- Do not restate project-wide background, already-shipped capabilities, or items already stabilized in `PROGRESS.md`.
- Archive superseded or duplicate checkpoints under `checkpoints/archive/` so default reading stays short.

## Latest Sync Snapshot

- Date: 2026-04-27
- Branch / theme: Today mobile decision page iteration
- Latest checkpoint: not created in-session; this snapshot is the repo-local fallback mirror.
- Current blocker: no code blocker; still recommend manual iPhone 12 Pro QA against real demo/login data before beta handoff.
- Next plan to read: `/Users/spicyclaw/Downloads/ootoday_today_mobile_iteration_plan_for_codex.md`
- Intended summary if `/context-save` fails: Completed Today mobile decision-page iteration: `/today` now opens with context chips and first recommendation hero, cards use scene-aware decision roles, Outfit Hero flatlay previews, "就穿这套" creates an unscored same-day OOTD and records `worn`, later scoring updates the selected record, slot-level replacement and pre-choice "不想穿" feedback record recommendation interactions, first-loop guidance is inline, and strategy explanations remain visible. Verification passed with `npm run lint`, full `npm test` (77 files, 349 tests), and `npm run build`; local dev server was started on `http://localhost:3000`.

## Snapshot Template

```md
## Latest Sync Snapshot

- Date: YYYY-MM-DD
- Branch / theme: ...
- Latest checkpoint: ...
- Current blocker: ...
- Next plan to read: ...
- Intended summary if /context-save fails: ...
```
