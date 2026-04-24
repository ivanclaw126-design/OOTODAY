# Beta Readiness QA Checklist

> Phase 9 scope: no new product features. Use this checklist to verify the real beta environment before inviting testers.
> Target date: 2026-04-24.

## Status Rules

- Mark an item `[x]` only after it passes in the beta target environment, not only in unit tests.
- Record account, viewport, URL, and date in the evidence notes.
- If an item fails but the user can recover without losing data, mark it `[ ]` and add a follow-up.
- Do not invite new testers until all `Blocker` items pass.

## Current Evidence Snapshot

| Area | Status | Evidence |
| --- | --- | --- |
| Local lint/test/build | Pass | `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings; `npm test` passed 60 files / 257 tests; `npm run build` passed. |
| GitHub Actions CI | Pass on latest pushed `main` | CI and App Quality passed on commit `54ebc25` at 2026-04-24 15:30 UTC. New local docs/script changes still need a post-push CI run. |
| Vercel build | Pending | Vercel connector returned `403 Forbidden`; verify from Vercel dashboard or authenticated CLI. |
| Supabase migrations | Pass | `scripts/supabase-db-push-ipv4.sh` reports remote database up to date; `npm run travel:db:check` reaches remote via transaction pooler and sees `20260422`. |
| Local env keys | Pass locally | `.env.local` contains Supabase public URL/anon key/service role, DashScope/OpenAI-compatible keys/model, weather key, and `SUPABASE_DB_URL`. Values not recorded here. |

## A. Auth

Blocker. Use one fresh beta email account and one account with existing closet items.

- [ ] Magic link login sends email and opens the app successfully.
  - Expected: login email arrives, callback lands in the app, no `?error=unknown`.
  - Evidence:
- [ ] Default password `123456` login works after the account has first entered through magic link.
  - Expected: Landing password login routes through bootstrap.
  - Evidence:
- [ ] After changing the password in Today account settings, the new password works.
  - Expected: old default password no longer works, new password logs in.
  - Evidence:
- [ ] Logout works.
  - Expected: user returns to signed-out Landing and protected routes no longer render app content.
  - Evidence:
- [ ] Signed-out `/today` redirects to `/`.
  - Evidence:
- [ ] Signed-out `/preferences` redirects to `/`.
  - Evidence:
- [ ] Signed-out `/settings` redirects to `/`.
  - Evidence:
- [ ] Signed-in empty-closet user lands on `/closet?onboarding=1`.
  - Evidence:
- [ ] Signed-in user with closet items lands on `/today`.
  - Evidence:

## B. Recommendation Preferences

Blocker. Use an account where resetting preferences is acceptable. Confirm data preservation after reset.

- [ ] First entry to `/preferences` shows the questionnaire and all required question cards are selectable.
  - Evidence:
- [ ] Submitting the questionnaire saves `preferenceState`.
  - Expected: Settings source changes from default to questionnaire/adaptive state as applicable.
  - Evidence:
- [ ] Today reads `preferenceState`.
  - Expected: recommendation reasons reflect selected scenes, slot preferences, hard avoids, or exploration setting.
  - Evidence:
- [ ] Today rating writes a feedback event.
  - Expected: OOTD feedback succeeds and adaptive preference state can be read afterward.
  - Evidence:
- [ ] Settings reset restores default weights.
  - Expected: preference source returns to default and Today still recommends.
  - Evidence:
- [ ] Refill questionnaire starts with reset first.
  - Expected: Settings "重新填写" resets first, then opens `/preferences`.
  - Evidence:
- [ ] Reset does not delete closet items.
  - Evidence:
- [ ] Reset does not delete OOTD records.
  - Evidence:
- [ ] Reset does not delete old feedback events.
  - Evidence:

## C. Today

Blocker. Use seeded closets or real accounts that cover complete and missing-slot wardrobes.

- [ ] Complete closet returns a complete outfit.
  - Expected: top/bottom or dress plus shoes/bag/accessory slots when available.
  - Evidence:
- [ ] Closet with no shoes does not fail.
  - Expected: recommendation renders with a missing-shoes explanation.
  - Evidence:
- [ ] Closet with no bag/accessories does not fail.
  - Expected: recommendation renders with missing bag/accessory explanation.
  - Evidence:
- [ ] Cold weather without outerwear shows a missing outerwear hint.
  - Evidence:
- [ ] Inspiration appears at low frequency when exploration allows it.
  - Evidence:
- [ ] `exploration.rate = 0` produces no inspiration recommendation.
  - Evidence:

## D. Inspiration

High. Run with one real inspiration image and one closet missing a matching item category.

- [ ] Image analysis displays the outfit formula.
  - Expected: color, silhouette, layering, and focal point formula are visible.
  - Evidence:
- [ ] Key item metadata renders normally.
  - Expected: slot/category/color/role labels are understandable.
  - Evidence:
- [ ] Missing same-category item shows a substitute suggestion.
  - Evidence:
- [ ] Preference-aware explanation is visible.
  - Expected: copy explains daily fit, inspiration attempt, or hard-avoid filtering when relevant.
  - Evidence:

## E. Shop

High. Use one sample per category and one intentionally non-fashion sample.

- [ ] Top can be analyzed.
  - Evidence:
- [ ] Bottom can be analyzed.
  - Evidence:
- [ ] Dress/one-piece can be analyzed.
  - Evidence:
- [ ] Outerwear can be analyzed.
  - Evidence:
- [ ] Shoes can be analyzed.
  - Evidence:
- [ ] Bag can be analyzed.
  - Evidence:
- [ ] Accessory can be analyzed.
  - Evidence:
- [ ] Non-fashion category is rejected.
  - Evidence:
- [ ] `hardAvoids` trigger a clear warning or block.
  - Evidence:
- [ ] Preferences affect the buy recommendation.
  - Evidence:

## F. Travel

High. Use formal/commute and outdoor/long-trip scenes.

- [ ] No shoes/bags still generates a plan.
  - Evidence:
- [ ] Formal/commute scene prioritizes formal shoes and bags when available.
  - Evidence:
- [ ] Outdoor/long-trip scene prioritizes comfortable shoes when available.
  - Evidence:
- [ ] Missing shoes hints are shown.
  - Evidence:
- [ ] Missing bags hints are shown.
  - Evidence:
- [ ] Missing outerwear hints are shown.
  - Evidence:

## G. Mobile

Blocker for friend beta. Test at iPhone-sized width and one Android-like width. Use real touch or browser device emulation.

For each route below, check bottom nav coverage, button tap targets, card length, reason tag wrapping, and image-card/question-card click behavior.

- [ ] `/closet`
  - Evidence:
- [ ] `/today`
  - Evidence:
- [ ] `/preferences`
  - Evidence:
- [ ] `/settings`
  - Evidence:
- [ ] `/shop`
  - Evidence:
- [ ] `/inspiration`
  - Evidence:
- [ ] `/travel`
  - Evidence:

Mobile detail checks:

- [ ] Bottom navigation does not cover final primary CTA or form submit button.
- [ ] Buttons are tappable without accidental horizontal swipe navigation.
- [ ] Long cards do not create horizontal scrolling.
- [ ] Today reason tags wrap cleanly.
- [ ] Questionnaire image cards can be tapped reliably and selected state is visible.

## H. CI / Deploy

Blocker. Record the exact run/deployment IDs.

- [ ] GitHub Actions CI passes on the commit intended for beta.
  - Latest observed: `CI` passed on `54ebc25`, run `24897676484`, 2026-04-24 15:30 UTC.
  - Evidence:
- [ ] GitHub Actions App Quality passes on the commit intended for beta.
  - Latest observed: `App Quality` passed on `54ebc25`, run `24897676452`, 2026-04-24 15:30 UTC.
  - Evidence:
- [ ] Vercel build passes for the commit intended for beta.
  - Current blocker: local Vercel CLI is unavailable and Vercel connector returned `403 Forbidden`.
  - Evidence:
- [ ] Supabase migration is applied to the target environment.
  - Latest observed: `supabase db push --include-all` reports remote database up to date; `travel:db:check` sees the `20260422` migration remotely.
  - Evidence:
- [ ] Environment variables are complete in the beta deployment.
  - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server Supabase key, `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `WEATHER_API_KEY`.
  - Evidence:

## Final Go / No-Go

- [ ] A. Auth all blocker items pass.
- [ ] B. Recommendation preferences all blocker items pass.
- [ ] C. Today all blocker items pass.
- [ ] G. Mobile all blocker items pass.
- [ ] H. CI / Deploy all blocker items pass.
- [ ] High-priority D/E/F issues have no data-loss, crash, or misleading recommendation failures.

Decision:

- [ ] Go: invite beta testers.
- [ ] No-go: fix blockers first.
