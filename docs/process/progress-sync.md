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

- Date: 2026-04-21
- Product state: Today recommendation + OOTD feedback MVP complete in code, tests, and basic browser verification
- Superpowers state:
  - Active plans in repo cover app shell, closet upload, today recommendation, and OOTD feedback MVP
  - Native Superpowers persistence in this repo is the spec/plan artifact set plus execution checkbox state
  - The 2026-04-20 Today recommendation plan and spec are now tracked in git alongside the other plan artifacts
- Gstack state:
  - Native Gstack progress flow for this repo should use `/context-save` and `/context-restore`
  - Primary planning artifacts live under `~/.gstack/projects/OOTODAY/`
  - Most relevant files today:
    - `spicyclaw-unknown-design-20260419-122822.md`
    - `spicyclaw-main-eng-review-test-plan-20260419-124838.md`
    - `checkpoints/20260419-133023-mvp-planning-complete.md`
  - Related implementation checkpoint also exists in `~/.gstack/projects/ivanclaw126-design-OOTODAY/checkpoints/20260420-152214-closet-upload-progress.md`
- Pending sync work:
  - Commit current repo-tracked plan/spec additions when the rest of the in-flight work is ready
  - Continue writing end-of-session summaries that mention both repo status and the intended gstack checkpoint outcome

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
