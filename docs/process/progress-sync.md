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
- Branch / theme: shared recommendation methodology evaluator
- Latest checkpoint: not written in-session; use this snapshot if native Gstack context is missing.
- Current blocker: no code blocker; local implementation, tests, lint, and build pass. Browser visual regression screenshots are still a follow-up.
- Next plan to read: `docs/superpowers/plans/2026-04-23-outfit-taxonomy-color-strategy.md`
- Intended summary if `/context-save` fails: Added `lib/recommendation/outfit-evaluator.ts` and wired Today, Shop, Inspiration, and Travel to shared scoring. The evaluator uses colors, tonal clusters, visual weight, silhouette, layer role, warmth, fabric weight, formality, comfort, pattern, scene, weather, completeness, freshness, `seasonTags`, and `algorithmMeta`, with category/subcategory/style fallback. Today and Travel now avoid 15-degree shorts/sandals when alternatives exist; Shop counts purchase value through scored outfit drafts; Inspiration reads metadata and nudges formula matching with `finalWeights`.

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
