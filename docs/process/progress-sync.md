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
- Branch / theme: Today strategy differentiation and explanation refinement
- Latest checkpoint: `~/.gstack/projects/OOTODAY/checkpoints/20260427-143156-today-strategy-differentiation.md`.
- Current blocker: real Recommendation Training should only run with `promote=true` after live `recommendation_interactions` reach the default gates; current 90-day dry-run has 6 rows, 0 positive users, and 0 positive candidates.
- Next plan to read: `docs/recommendation-engine-handoff.md`
- Intended summary if `/context-save` fails: Completed Today strategy differentiation: canonical scoring now records `primaryStrategy` / `strategySummaryKeys`, Capsule Wardrobe scoring is less generic, Today batch selection rewards different strategies/colors/outfit kinds/finishers and penalizes repeated shoes/bags/accessories, and adjacent cards get "和上一套拉开差异" highlights. No schema, preference contract, feedback learning, or ML training changes. Verification passed with targeted tests, `npm run lint`, full `npm test` (73 files, 333 tests), `npm run build`, and mobile Playwright QA at 390px on `/today`.

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
