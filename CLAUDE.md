# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OOTODAY is an AI-powered personal wardrobe assistant app. Core value proposition:
- Lowest-cost import of real wardrobe
- Convert global outfit trends into actionable personal recommendations
- Daily weather/scene/mood-driven outfit suggestions
- Pre-purchase decision support, post-purchase wardrobe integration

## Target Users

1. **Efficiency-focused urban professionals** - daily outfit decisions, multi-scenario needs
2. **Content learners** - learn from social media, want to recreate influencer looks
3. **Purchase decision users** - frequent online shopping, want to avoid bad purchases

## MVP Scope

From the planning document (初版规划.md), V1 should deliver:
- Wardrobe import (photo, album, e-commerce links, collage splitting)
- Today's outfit recommendation (weather + scene + wardrobe)
- Product purchase analysis (compatibility + outfit count + buy recommendation)
- OOTD recording with satisfaction feedback

## Key Super-Scenarios

1. What to wear tomorrow - weather + schedule + mood → 3 outfit options
2. Should I buy this? - product link → worth buying? repeat? alternatives?
3. Recreate this influencer look - inspiration image → breakdown + my version
4. Organize wardrobe - idle items + duplicates + missing basics + capsule wardrobe
5. Travel packing - city + days + itinerary → optimized packing list

## Product Pages (Planned)

- **Today** - high-frequency daily recommendation page
- **Closet** - wardrobe management and asset storage
- **Inspiration** - learning page with AI-dissected outfit logic
- **Shop** - purchase assistant with product analysis

## Status

**Phase 1 complete.** App shell + Supabase foundation shipped. See PROGRESS.md for current state and next steps.

## Progress Tracking

**Primary progress file:** `PROGRESS.md` (tracked in git, updated by all skills)

**Execution plans:** `docs/superpowers/plans/*.md` (superpowers implementation plans)

**Progress sync workflow:** `docs/process/progress-sync.md`
- Mirrors how this repo uses Gstack and Superpowers native progress mechanisms
- Do not treat it as a replacement for built-in save/restore flows
- If instructions conflict, keep `PROGRESS.md` as the source of truth and prefer native tool flows first

**gstack meta:** `.gstack-meta/` → symlink to ~/.gstack/projects/OOTODAY
- Contains checkpoints, reviews, design docs from gstack skills
- May be broken on fresh clone (run any gstack skill once to initialize)
- Detailed context: `.gstack-meta/checkpoints/*.md`
- Fallback real path when symlink is missing: `~/.gstack/projects/OOTODAY/`

### Session start reading flow

1. Read `PROGRESS.md` for current state and next steps
2. Read `docs/process/progress-sync.md` for the current sync contract
3. Read `docs/superpowers/plans/*.md` for active execution plans
4. Use Gstack `/context-restore` when available to recover the latest checkpointed state
5. If `.gstack-meta/` readable → Read latest checkpoint for detailed context
6. If `.gstack-meta/` broken but `~/.gstack/projects/OOTODAY/` exists → read latest checkpoint there
7. If neither path exists → continue without gstack checkpoint context

### After completing work

1. Update `PROGRESS.md` with new status
2. Update any touched `docs/superpowers/plans/*.md` checkboxes to reflect actual execution status
3. Preserve Superpowers progress in its native artifacts: specs, plans, and plan execution state
4. Run Gstack `/context-save` to checkpoint state
5. Add or refresh the "Latest sync snapshot" section in `docs/process/progress-sync.md` as a mirror only
6. If Gstack cannot be updated in-session, note the intended gstack checkpoint summary in `docs/process/progress-sync.md`

### Recordkeeping policy

- `PROGRESS.md` is the canonical project status file for both Gstack and Superpowers
- Superpowers progress should be tracked through its native artifacts and workflows:
  - `docs/superpowers/specs/*.md`
  - `docs/superpowers/plans/*.md`
  - execution status reflected in plan checkboxes and related implementation docs
- Gstack progress should be tracked through its native workflows first:
  - `/context-save`
  - `/context-restore`
  - planning artifacts in `~/.gstack/projects/OOTODAY/`
- `docs/process/progress-sync.md` is a repo-local mirror and recovery aid, not the primary persistence layer for either system
- Every meaningful development session should leave behind enough written context that a new agent can understand: what changed, what was verified, what is still pending, and which external gstack artifact is the best next read

## gstack

**Use /browse skill for ALL web browsing tasks.** Never use `mcp__claude-in-chrome__*` tools directly.

**Available gstack skills**:

- `/agent-reach` — Give AI agent eyes to see the entire internet
- `/autoplan` — Auto-review pipeline
- `/benchmark` — Performance regression detection
- `/browse` — Fast headless browser for QA testing
- `/canary` — Post-deploy canary monitoring
- `/careful` — Safety guardrails for destructive commands
- `/codex` — OpenAI Codex CLI wrapper
- `/context-restore` — Restore saved working state
- `/context-save` — Save working state checkpoints
- `/cso` — Chief Security Officer mode
- `/design-consultation` — Design consultation
- `/design-html` — Design finalization
- `/design-review` — Designer's eye QA
- `/design-shotgun` — Design shotgun (multiple variants)
- `/devex-review` — Live developer experience audit
- `/document-release` — Post-ship documentation
- `/freeze` — Restrict file edits to specific directory
- `/gstack-upgrade` — Upgrade gstack to latest version
- `/guard` — Full safety mode
- `/health` — Code quality dashboard
- `/investigate` — Systematic debugging with root cause
- `/land-and-deploy` — Land and deploy workflow
- `/learn` — Manage project learnings
- `/office-hours` — YC Office Hours mode
- `/open-gstack-browser` — Launch GStack Browser with sidebar
- `/pair-agent` — Pair remote AI agent with browser
- `/plan-ceo-review` — CEO/founder-mode plan review
- `/plan-design-review` — Designer's eye plan review
- `/plan-devex-review` — Developer experience plan review
- `/plan-eng-review` — Eng manager-mode plan review
- `/plan-tune` — Plan tuning and optimization
- `/qa` — Systematic QA testing
- `/qa-only` — Report-only QA testing
- `/retro` — Weekly engineering retrospective
- `/review` — Pre-landing PR review
- `/setup-browser-cookies` — Import cookies from Chromium
- `/setup-deploy` — Configure deployment settings
- `/ship` — Ship workflow
- `/unfreeze` — Clear freeze boundary

ALWAYS ask questions via mcp__spokenly__ask_user_dictation (load via ToolSearch if needed), never as plain text. I use Spokenly for voice input.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint → invoke context-save
- Resume, restore state → invoke context-restore
- Code quality, health check → invoke health
- Plan tuning, optimize plan → invoke plan-tune
- Pair agent, remote browser → invoke pair-agent
