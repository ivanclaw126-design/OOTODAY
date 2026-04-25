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

- Date: 2026-04-25
- Branch / theme: self-hosted analytics dashboard
- Latest checkpoint: to be written via `/context-save`; use this snapshot if native Gstack context is missing.
- Current blocker: no code blocker; local implementation, tests, lint, build, Supabase migration list, and dry-run pass. Remote schema still needs the new analytics migration pushed before deployed admin usage.
- Next plan to read: `docs/superpowers/plans/2026-04-25-analytics-dashboard.md`
- Intended summary if `/context-save` fails: Added Supabase `analytics_events`, analytics client/server helpers, `/api/analytics/track`, beta telemetry adapters, product event instrumentation across Closet/Today/Travel/Shop/Looks, and `/admin/analytics` protected by `ADMIN_EMAILS`. Dashboard aggregates overview cards, feature usage, funnels, friction, and recommendation quality from `analytics_events`, `profiles`, and `outfit_feedback_events`. Verification passed locally; Supabase dry-run shows only `20260425120000_add_analytics_events.sql` pending for remote push.

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
