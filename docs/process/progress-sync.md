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

- Date: 2026-04-24
- Branch / theme: `codex/recommendation-engine-phase-4-5` - Cross-page recommendation language QA Phase 8
- Latest checkpoint: `~/.gstack/projects/OOTODAY/checkpoints/20260424-181500-cross-page-recommendation-language-phase-8.md`
- Current blocker: local Phase 8 work is not pushed; new CI/App Quality workflows have not run on GitHub yet; recommendation storage and closet algorithm metadata migrations are still unverified remotely
- Next plan to read: `docs/recommendation-engine-handoff.md`
- Intended summary if `/context-save` fails: Phase 8 added `lib/recommendation/copy.ts` and connected Today, Shop, Inspiration, Travel, and color strategy helpers to shared Chinese recommendation language for foundation colors, tonal depth, one accent, multiple competing accents, missing shoes/bags/accessories, and inspiration-attempt labeling. Targeted copy tests and lint passed; full test/build were rerun in-session.

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
