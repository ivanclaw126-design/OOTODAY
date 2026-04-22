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
- Product state: Today recommendation + OOTD feedback MVP is stable, `/shop` now supports links + local uploads + desktop drag-drop with an apparel-only guardrail, and Inspiration has advanced from basic breakdown into a first recreate-my-version MVP
- Superpowers state:
  - Active plans in repo still cover app shell, closet upload, today recommendation, and OOTD feedback MVP
  - Native Superpowers persistence in this repo remains the spec/plan artifact set plus execution checkbox state
  - Shop has moved into a more usable multi-input flow, and the newest mainline development has now started the missing fourth product surface: Inspiration
  - Inspiration now includes local upload / image-link input, AI-generated outfit breakdown, key-item extraction, styling tips, same-category closet matching, and a rule-based "my version" remix plan with gap prompts
  - QA evidence now includes real browser validation for `/today` weather success, real browser validation for `/shop` local upload, user-confirmed real desktop drag-drop success on `/shop`, and test-level verification for Inspiration remix output
- Gstack state:
  - Native Gstack progress flow for this repo continues to use `/context-save` and `/context-restore`
  - Latest saved checkpoint was `~/.gstack/projects/OOTODAY/checkpoints/20260422-132656-shop-local-upload.md` before this round
  - A fresh checkpoint should capture the new Inspiration remix-plan capability together with the synced Shop drag-drop QA result
  - Useful operational note from earlier checkpoints remains valid: importing local Chrome `localhost` cookies is enough to quickly recover an authenticated QA session
- Pending sync work:
  - Dogfood the new Inspiration page in a real browser session
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
