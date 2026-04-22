# Friend Beta Readiness Plan

**Goal:** Get OOTODAY ready for a `5-10` friend beta by tightening one clear first-run loop: `Landing / Onboarding -> Closet import -> Today recommendation -> feedback`.

**Decision:** Scope reduced. Do not expand `Travel`, `Shop`, or `Inspiration` for this phase. Reuse the code that already works and spend the time on onboarding, observability, feedback capture, and QA.

**Why this matters:** The product already has enough surface area to impress people. What it does not yet have is a clean first-time experience that tells a friend what to do first, helps them finish it, and lets us see where they got stuck.

## Step 0: Scope Challenge

### Scope reduction outcome

The broad version of this project would touch the landing page, route gating, closet empty state, Today empty state, feedback channel, observability, QA docs, invite instructions, and possibly more product polish across all five tabs. That is a smell.

For friend beta, the minimum complete version is:

1. Make the home page and first-run states point to one obvious first action.
2. Make logged-in users with an empty closet land in the import flow, not a dead end.
3. Add a lightweight way to capture runtime failures and human feedback.
4. Add one repo-owned QA checklist and one friend-beta runbook.

Everything else is deferred.

### Complexity check

If we tried to also deepen `Travel`, `Shop`, `Inspiration`, beta gating, marketing pages, and analytics dashboards in the same pass, we would blow past `8+` files and create a lot of avoidable coupling. That would be the classic "we built the scaffolding instead of the thing."

This plan keeps the implementation centered on existing route files, a shared first-run content block, a small observability surface, and docs.

### Search check

Recommendation is to lean on built-ins and current project primitives:

- Next.js route rendering and redirects
- existing Supabase auth/session flow
- existing app-shell and empty-state components
- lightweight external feedback form or mailto link, not a custom in-app ticket system

No custom infrastructure is justified here.

### TODOS cross-reference

Existing `TODOS.md` items are still correctly deferred. None of the V2 or V3 items block friend beta.

What matters now is not "more capability," it is "can a friend get value in 5 minutes?"

## What Already Exists

- `app/page.tsx` already serves as the unauthenticated landing entry and redirects authenticated users.
- `components/landing/landing-page.tsx` already has the product headline and magic-link login form.
- `components/closet/closet-page.tsx` already has strong empty-state and import flows, including multi-image, link import, and collage split.
- `components/today/today-page.tsx` already has the correct empty-state boundary: if there are no items, Today tells the user to go upload clothes.
- `Today`, `Closet`, `Travel`, `Shop`, and `Inspiration` already exist inside one shared app shell, so beta work should tune navigation and first-run messaging, not build new pages.
- Real browser QA has already validated the hardest closet import paths and the Travel save/update loop.

## NOT in Scope

- New `Travel` features.
  Friend beta should test whether people get value from `Closet -> Today` first.

- New `Shop` analysis depth or scraper expansion.
  Useful later, but not necessary to learn whether wardrobe import and daily value resonate.

- New `Inspiration` depth.
  Nice showcase feature, not the first thing a friend should do.

- A separate marketing site.
  The existing landing page should become the beta entrypoint.

- Custom in-app support inbox or admin dashboard.
  Too much surface area for `5-10` users. Start with a lightweight external feedback channel plus error logs.

- Mobile app packaging, app-store work, or public SEO.
  Wrong level of ambition for this phase.

## Architecture Review

### Issue 1

`app/page.tsx` currently redirects every authenticated user to `/today`.

That is fine for a mature product. It is wrong for friend beta. A brand-new logged-in user with `0` closet items should land in an onboarding-aware state that pushes them to import clothes first.

**Plan:** Add a lightweight server-side bootstrap decision for signed-in users:

- if `itemCount === 0`, route to `/closet?onboarding=1`
- else route to `/today`

Do not create a new onboarding router or wizard engine. One small bootstrap decision is enough.

### Issue 2

The first-run story is currently split across disconnected copy:

- landing page promise
- Closet empty state
- Today empty state

If these drift, the product feels confused. Friends will not say "the information architecture is inconsistent." They will say "I don't know what to do."

**Plan:** Create one shared first-run content block or config-driven checklist that can be reused in:

- landing page
- Closet empty state / onboarding state
- Today empty state

Recommended checklist:

1. 导入 `3-5` 件常穿衣服
2. 去 `Today` 看推荐
3. 提交一次反馈

### Issue 3

There is no clear product-level observability layer for friend beta.

The app already has many moving parts: auth, storage upload, AI analysis, weather lookup, Supabase writes. For `5-10` users, one silent failure is enough to waste the whole test round.

**Plan:** Add a minimal beta observability layer:

- one client-safe error/reporting entrypoint for key failures
- one friend-visible feedback link in the shell or settings area
- one simple event trail for the core loop:
  - login sent
  - first import started
  - first import saved
  - Today viewed
  - feedback submitted

Keep it lightweight. No heavy analytics stack is required yet.

## Code Quality Review

### Issue 1

Do not spread beta state logic across unrelated pages.

If `app/page.tsx`, `app/today/page.tsx`, and `app/closet/page.tsx` each invent their own "am I new?" rule, the app will drift fast.

**Plan:** Centralize the small amount of bootstrap state we need in one helper, for example:

- auth session exists
- closet item count
- optional city presence
- has any OOTD history or not

This keeps first-run decisions explicit and testable.

### Issue 2

Navigation is currently feature-complete, not beta-curated.

That is good for development. It is not ideal for a tiny friend beta where we want one primary loop. If the shell treats all tabs as equal, we are asking first-time users to do product management for us.

**Plan:** Keep all tabs available, but visually bias the shell toward the main loop:

- `Closet` and `Today` should read as the primary path
- `Travel`, `Shop`, `Inspiration` should remain reachable but secondary
- avoid deleting features, just reduce decision load

### Issue 3

Do not make beta feedback a bespoke UI flow unless the repo can maintain it.

A custom modal, local drafts, retries, and attachment uploads sound nice. They are also how a small beta plan quietly turns into a week of support tooling.

**Plan:** Use a dead-simple reporting path first:

- external form link
- or prefilled email link
- optionally pass route context and user id-ish metadata server-side if easy

The quality bar is "friends can tell us what broke in under 30 seconds."

## Test Review

This plan adds new behavior on top of existing routes, so coverage needs to prove that the first-run loop is actually connected end-to-end.

```text
CODE PATHS                                                    USER FLOWS
[~] app/page.tsx                                              [+] First visit
  └── bootstrap redirect()                                      ├── [GAP] Landing page shows 3-step beta path
      ├── [GAP] signed-out -> landing                           ├── [GAP] Magic-link request sent successfully
      ├── [GAP] signed-in + empty closet -> /closet?onboarding=1└── [GAP] Magic-link sent notice is visible
      └── [GAP] signed-in + items -> /today

[~] components/landing/landing-page.tsx                       [+] First-run onboarding
  ├── [GAP] shared checklist render                             ├── [GAP] Empty closet user understands "import first"
  ├── [GAP] friend-beta copy states                             ├── [GAP] After first save, user knows to go to Today
  └── [GAP] feedback / contact entry visible                    └── [GAP] User can find feedback link from the shell

[~] components/closet/closet-page.tsx                         [+] Core beta loop
  ├── [GAP] onboarding mode copy + CTA                          ├── [GAP] Import first item -> return to Today [→E2E]
  ├── [GAP] post-save next-step CTA                             ├── [GAP] Import 3 items -> Today opens with value [→E2E]
  └── [GAP] feedback / report link visible                      └── [GAP] Import failure shows recoverable help

[~] components/today/today-page.tsx                           [+] Error states
  ├── [GAP] empty-state uses shared checklist                   ├── [GAP] Weather/API failure still leaves clear next action
  ├── [GAP] first-success guidance                              ├── [GAP] Upload/analysis failure gives visible reporting path
  └── [GAP] feedback CTA after recommendation                   └── [GAP] Signed-in user with empty closet is never stranded

[+] beta observability / feedback module                      LLM integration
  ├── [GAP] core events recorded                                 none required in this plan
  ├── [GAP] key server errors recorded
  └── [GAP] route context attached to feedback

COVERAGE: 0/18 planned paths tested (0%)  |  Code paths: 0/11  |  User flows: 0/7
QUALITY: ★★★:0 ★★:0 ★:0  |  GAPS: 18 (2 E2E, 0 eval)
```

### Required test additions

- `tests/app/page.test.tsx` or equivalent route-level coverage
  - signed-out user sees landing page
  - signed-in user with `0` items routes to onboarding-aware Closet
  - signed-in user with items routes to Today

- `tests/components/landing-page.test.tsx`
  - shared first-run checklist renders
  - magic-link sent state still works
  - feedback entrypoint is visible

- `tests/components/closet-page.test.tsx`
  - onboarding mode changes copy and CTA
  - post-save CTA points to Today
  - reporting link remains visible during error states

- `tests/components/today-page.test.tsx`
  - shared checklist appears in empty state
  - first-success CTA or helper copy appears when recommendations exist
  - feedback link remains reachable

- `tests/lib/beta/*.test.ts` or equivalent
  - bootstrap-state helper returns the correct route and flags
  - observability helper safely ignores optional failures

- One browser or E2E smoke flow
  - login -> import item -> visit Today -> submit feedback
  - this is the minimum proof that the friend beta loop works

## Failure Modes

| Codepath | Real production failure | Test planned | Error handling planned | User sees clear outcome? | Critical gap? |
| --- | --- | --- | --- | --- | --- |
| home bootstrap redirect | item-count query fails | yes | yes, fall back to landing or safe route | yes | no |
| landing login form | magic-link send fails | yes | yes | yes | no |
| closet onboarding CTA | upload succeeds but next-step CTA missing | yes | yes | yes | no |
| closet import flow | analysis/save fails mid-onboarding | yes | yes | yes, keep retry/report visible | no |
| Today empty state | signed-in user with no items lands here anyway | yes | yes | yes, redirect/CTA back to Closet | no |
| observability hook | logging vendor or endpoint fails | yes | yes, fail open | yes, no user-facing crash | no |
| feedback entrypoint | external form link broken | yes | partial, shell fallback copy needed | yes if fallback mailto exists | no |

No silent-failure critical gaps are acceptable in this phase. If any of these paths end up with no test, no fallback, and no user-visible recovery, stop and fix that before inviting people.

## Performance Review

### Issue 1

Do not turn first-run routing into a multi-query bootstrap waterfall.

For friend beta, we only need tiny state. Pull the minimum:

- session
- item count
- maybe one "has used Today before" signal if the UX truly needs it

Avoid loading full closet data or recommendation data just to decide where to send the user.

### Issue 2

Do not block page interactivity on feedback tooling.

If the beta feedback link uses an embedded widget, third-party SDK, or slow script, it will make the app feel heavier than it is. That is self-inflicted damage.

Use a lightweight link-based approach first. Defer anything heavier until users actually ask for it.

## Implementation Plan

## Task 1: Tighten the friend-beta entrypoint

- [ ] Update `app/page.tsx` so signed-in users route by bootstrap state, not always to `/today`
- [ ] Extend `components/landing/landing-page.tsx` into a friend-beta entrypoint with a shared 3-step checklist
- [ ] Keep magic-link login behavior unchanged

## Task 2: Add shared first-run guidance

- [ ] Create one shared first-run checklist/content block for landing, Closet empty state, and Today empty state
- [ ] Add onboarding-aware Closet messaging for `?onboarding=1`
- [ ] Add post-import next-step CTA that points users into `Today`

## Task 3: Add lightweight observability and feedback

- [ ] Add one minimal bootstrap-safe observability helper for core beta events and key failures
- [ ] Add a visible feedback/report-problem entrypoint in the app shell or a stable shared location
- [ ] Ensure feedback/reporting is still reachable from empty states and recoverable error states

## Task 4: Add coverage for the first-run loop

- [ ] Add route tests for home bootstrap behavior
- [ ] Add component tests for landing, Closet onboarding state, and Today empty/success guidance
- [ ] Add tests for observability helper behavior
- [ ] Add one real browser smoke flow for `login -> import -> Today -> feedback`

## Task 5: Prepare the beta runbook

- [ ] Add a repo doc for friend-beta QA checklist
- [ ] Add a repo doc for invite instructions, success criteria, and how to collect feedback
- [ ] Record the `5-10` friend-beta goals and stop/go threshold in project docs

## Worktree Parallelization Strategy

### Dependency table

| Step | Modules touched | Depends on |
| --- | --- | --- |
| Entry routing and landing | `app/`, `components/landing/`, shared UI | — |
| First-run shared guidance | `components/`, `app/closet/`, `app/today/` | Entry routing and landing |
| Observability and feedback | `lib/`, shared shell/navigation | — |
| QA and beta runbook docs | `docs/` | decisions from other steps |

### Parallel lanes

- Lane A: entry routing and landing -> first-run shared guidance
- Lane B: observability and feedback
- Lane C: QA and beta runbook docs

### Execution order

Launch Lane A and Lane B in parallel worktrees.

Lane C can start in parallel once the user-visible flow and feedback entrypoint labels are stable enough to document. Merge A + B first if the wording is still moving.

### Conflict flags

- Lanes A and B may both touch shared shell/navigation modules. Keep the feedback entrypoint placement simple to reduce merge pressure.
- Lane A should own user-facing onboarding copy. Lane B should not invent separate copy.

## Completion Summary

- Step 0: Scope Challenge — scope reduced to friend-beta readiness for `Landing -> Closet -> Today -> feedback`
- Architecture Review: `3` issues found
- Code Quality Review: `3` issues found
- Test Review: diagram produced, `18` gaps identified
- Performance Review: `2` issues found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: `0` items proposed, existing deferred list is still correct
- Failure modes: `0` critical gaps flagged if this plan is followed
- Outside voice: skipped
- Parallelization: `3` lanes, `3` parallel-capable workstreams / `1` sequential dependency chain
- Lake Score: `6/6` recommendations chose the complete option over the shortcut
