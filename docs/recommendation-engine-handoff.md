# Recommendation Engine Handoff

## Current Phase Completed

Phase 9 shared methodology evaluator completed on 2026-04-25.

Today / Shop / Inspiration / Travel now share recommendation copy and a shared deterministic outfit evaluator for color harmony, silhouette balance, layering, focal point, scene fit, weather comfort, completeness, and freshness. Page-specific wording remains intact for Today completion, Shop purchase value, Travel packing completeness, and Inspiration remix guidance.

## Phase 9 Shared Methodology Evaluator

### Files Changed

- `lib/recommendation/outfit-evaluator.ts`
  - Adds the shared evaluator used by Today, Shop, Inspiration, and Travel.
  - Scores real outfit dimensions: base color anchor, tonal relationship, accent control, visual weight, silhouette, layer role, warmth, fabric weight, formality, comfort, pattern, scene fit, weather fit, completeness, and freshness.
  - Tolerates partial metadata by falling back to category, subcategory, style tags, season tags, and item text.
  - Exposes `evaluateOutfit()`, `getWeightedOutfitScore()`, `getItemWeatherSuitability()`, `filterWeatherSuitableItems()`, `rankItemsForRecommendation()`, and `hasTonalColorRelationship()`.
- `lib/closet/types.ts` / `lib/closet/get-closet-view.ts`
  - Adds optional `seasonTags` to closet card data and reads `items.season_tags` so summer-only items can be penalized outside hot weather.
- `lib/today/generate-recommendations.ts`
  - Uses the shared evaluator for component scores and `finalWeights` sorting.
  - Filters/ranks candidates by weather suitability before outfit generation; 15 degree weather no longer prefers shorts or sandals when covered alternatives exist.
- `lib/shop/analyze-purchase-candidate.ts`
  - Estimates purchase outfit count by inserting the candidate into real outfit drafts and scoring through the shared evaluator, while preserving shoe finisher, scene bag, and visual-focus semantics.
- `lib/inspiration/match-closet-to-inspiration.ts`
  - Reads `algorithmMeta.slot`, `layerRole`, `silhouette`, and `length` before text fallbacks.
  - Uses `finalWeights` as a methodology multiplier for formula-substitute ranking.
- `lib/travel/build-travel-packing-plan.ts`
  - Ranks each packing slot by destination weather, scene, warmth, season, comfort, and preference profile before creating entries and daily plans.
- `lib/recommendation/copy.ts`
  - Uses tonal color clusters for same-family copy, so unrelated neutrals such as black/khaki or gray/brown no longer produce the “同色系深浅” explanation.

### Phase 9 Verification

- Targeted tests passed: `tests/lib/recommendation/outfit-evaluator.test.ts`, Today, Shop, Inspiration, Travel, and copy tests: 50 tests.
- `npm test` passed: 62 test files, 285 tests.
- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm run build` passed.

### Phase 9 Remaining Issues

- Browser visual regression screenshots were not added in this phase.
- Shop, Inspiration, and Travel still do not have their own page-specific feedback loops; they consume Today/questionnaire-derived `finalWeights`.

## Supabase Remote Reconciliation

Remote Supabase schema reconciliation completed on 2026-04-24.

### Files Changed

- `supabase/migrations/20260424183000_reconcile_recommendation_remote_schema.sql`
  - Adds `items.algorithm_meta` if the remote database missed the Phase 6 migration.
  - Aligns `outfit_feedback_events.context` default to `today`.
  - Adds the missing `outfit_feedback_events(user_id, context, created_at desc)` and `recommendation_preferences(updated_at)` indexes.
  - Repoints `recommendation_preferences.user_id` and `outfit_feedback_events.user_id` foreign keys to `auth.users(id)` to match the repository migration and current recommendation storage contract.

### Supabase Verification

- `scripts/supabase-db-push-ipv4.sh` applied:
  - `20260424175500_add_items_algorithm_meta.sql`
  - `20260424183000_reconcile_recommendation_remote_schema.sql`
- `supabase db push --dry-run --include-all` reported `Remote database is up to date.`
- A fresh public schema dump confirmed:
  - `items.algorithm_meta jsonb not null default '{}'::jsonb`
  - `outfit_feedback_events.context default 'today'`
  - `outfit_feedback_events_user_id_context_created_at_idx`
  - `recommendation_preferences_updated_at_idx`
  - recommendation preference and feedback event foreign keys reference `auth.users(id)`.

## Phase 8 Cross-Page Recommendation Language QA

### Files Changed

- `lib/recommendation/copy.ts`
  - Adds shared builders for color notes, missing-slot copy, and the `灵感尝试` label.
  - Treats black/white/gray, beige/brown, and navy as foundation colors with stable daily-use language.
  - Uses one shared meaning for tonal depth, one accent, and multiple competing accents.
- `lib/closet/color-strategy.ts`
  - Delegates palette notes to the shared recommendation copy builder.
  - Keeps closet-anchored purchase color hints aligned with one-accent / visual-center language.
- `lib/today/generate-recommendations.ts`
  - Uses shared Today color notes and missing-slot copy.
  - Keeps inspiration recommendations explicitly labeled as low-frequency `灵感尝试`.
- `lib/shop/analyze-purchase-candidate.ts`
  - Uses shared missing shoe, bag, and accessory copy in purchase gap hints.
- `lib/inspiration/build-inspiration-color-strategy.ts`
  - Uses Inspiration-specific shared color notes.
- `lib/inspiration/build-inspiration-remix-plan.ts`
  - Prefixes remix summaries with `灵感尝试`.
  - Uses shared missing-slot wording for missing inspiration substitutes where applicable.
- `lib/travel/build-travel-packing-plan.ts`
  - Uses shared Travel color notes and missing shoe/bag/outer-layer copy.
- Tests updated under `tests/lib/recommendation`, `tests/lib/closet`, `tests/lib/today`, `tests/lib/shop`, `tests/lib/inspiration`, `tests/lib/travel`, and related component tests.

### Phase 8 Verification

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- Targeted Phase 8 tests passed: 11 test files, 64 tests.
- `npm test` passed: 60 test files, 256 tests.
- `npm run build` passed, including `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

### Phase 8 Remaining Issues

- This phase unifies language at helper/generator level; it does not add visual regression screenshots for every copy state.
- GitHub CI/App Quality workflows have not run on GitHub in this session.

## Phase 7 Shop and Travel Preference Awareness

Phase 7 Shop and Travel preference-aware scoring completed on 2026-04-24.

Shop purchase analysis and Travel packing now accept optional `RecommendationPreferenceState`. Preference logic remains optional and falls back to deterministic metadata-based behavior when absent. Shop uses preference profile for comfort, styling, low-key color/focal preferences, and hard avoids. Travel uses preference profile to adjust light packing, complete styling, layering complexity, and comfort-shoe priority while preserving missing-shoe/bag fallback behavior.


### Files Changed

- `lib/shop/analyze-purchase-candidate.ts`
  - Adds optional `preferenceState` to `analyzePurchaseCandidate(candidate, closetItems, preferenceState?)`.
  - Raises comfortable shoes/basic reusable items for comfort-first users.
  - Raises bags/accessories/visual-focus items for styling-first users.
  - Lowers large bright colors, large logo, and multi-focus items for low-key users.
  - Forces `skip` with clear copy when candidate text matches `profile.hardAvoids`.
  - Adds preference-aware notes into `recommendationReason`.
- `lib/shop/types.ts`
  - Adds optional `preferenceNotes` to `ShopPurchaseAnalysis`.
- `app/shop/actions.ts`
  - Reads `getPreferenceState({ userId })` and passes it into `analyzePurchaseCandidate`.
- `lib/travel/build-travel-packing-plan.ts`
  - Accepts `preferenceState` via `TravelPlannerInput`.
  - Light-packing users get reduced backup shoes, non-essential bags, and complex layering.
  - Complete-styling users preserve shoe/bag finishing slots.
  - Comfort-first users get comfort shoes prioritized for walking/outdoor/long trips.
  - Missing shoe/bag hints still generate when data is absent.
- `lib/travel/types.ts`
  - Adds optional `preferenceState` to `TravelPlannerInput`.
- `app/travel/actions.ts`
  - Reads preference state and passes it into `buildTravelPackingPlan`.
- `tests/lib/shop/analyze-purchase-candidate.test.ts`
  - Covers comfort-first, styling-first, low-key, and hard-avoid purchase adjustments.
- `tests/lib/travel/build-travel-packing-plan.test.ts`
  - Covers light packing, complete styling, and comfort-first shoe ranking.
- `tests/app/shop/actions.test.ts` and `tests/app/travel/actions.test.ts`
  - Cover preference-state loading and forwarding.

### Phase 7 Verification

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed on rerun: 59 test files, 253 tests.
- `npm run build` passed, including `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

### Phase 7 Remaining Issues

- Preference-aware Shop/Travel scoring is deterministic and profile-based; it does not yet learn from Shop/Travel-specific feedback.
- Travel still does not use external calendar/itinerary data.
- New CI/App Quality workflows have not run on GitHub in this session.
- Remote Supabase migration status is still unverified in this session.

## Phase 6 Optional Closet Algorithm Metadata

Phase 6 optional Closet algorithm metadata fields completed on 2026-04-24.

Closet items now have optional algorithm metadata support through `algorithm_meta jsonb`. Existing wardrobe data remains valid, save/read paths infer fallback metadata from category/subcategory/style tags, AI analysis can optionally return richer metadata, and recommendation surfaces can continue falling back to existing fields when metadata is missing.


### Files Changed

- `supabase/migrations/20260424175500_add_items_algorithm_meta.sql`
  - Adds `items.algorithm_meta jsonb not null default '{}'::jsonb`.
- `types/database.ts`
  - Adds `algorithm_meta` to `items.Row`, `items.Insert`, and `items.Update`.
- `lib/closet/types.ts`
  - Adds optional `ClosetAlgorithmMeta` and supporting union types for slot, layer role, fabric weight, pattern, and 0-5 scale fields.
  - Adds optional `algorithmMeta` to `ClosetItemCardData` and `ClosetAnalysisResult`.
- `lib/closet/taxonomy.ts`
  - Adds `inferClosetAlgorithmMeta()` fallback inference from category/subcategory/style tags.
  - Adds `normalizeClosetAlgorithmMeta()` to safely normalize AI/user-provided metadata while preserving category-derived slot fallback.
- `lib/closet/analyze-item-image.ts`
  - Updates the AI prompt to allow optional `algorithm_meta`.
  - Parses and normalizes optional AI metadata without requiring it.
- `lib/closet/save-closet-item.ts`
  - Saves normalized/inferred `algorithm_meta`.
  - Keeps fallback insert behavior for databases where the new column is not applied yet.
- `lib/closet/update-closet-item.ts`
  - Updates normalized/inferred `algorithm_meta`.
  - Keeps fallback update behavior for databases where the new column is not applied yet.
- `lib/closet/get-closet-view.ts`
  - Selects and maps `algorithm_meta`, falling back to inferred metadata when missing or when the column is unavailable.
- `app/closet/actions.ts` and `components/closet/closet-workspace.tsx`
  - Preserve algorithm metadata through import, reanalysis, and edit flows without exposing every field in UI.
- `tests/lib/closet/taxonomy.test.ts`
  - Covers fallback inference and optional metadata normalization.
- `tests/lib/closet/analyze-item-image.test.ts`
  - Covers optional AI `algorithm_meta` parsing.
- `tests/lib/closet/save-closet-item.test.ts`
  - Covers `algorithm_meta` insert payload.

### Phase 6 Verification

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 59 test files, 246 tests.
- `npm run build` passed, including `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

### Phase 6 Remaining Issues

- The new `items.algorithm_meta` migration exists locally but has not been verified as applied on the remote Supabase project in this session.
- UI preserves algorithm metadata but does not expose the full metadata editor yet.
- Today / Travel / Shop / Inspiration still need separate phases to consume `algorithmMeta` directly; they continue to work through existing category/subcategory/style tag fallback.
- New CI/App Quality workflows have not run on GitHub in this session.

## Phase 5 / Phase 8D Preference-Aware Inspiration Matching

Phase 5 / Phase 8D Preference-aware Inspiration formula matching completed on 2026-04-24.

Inspiration matching now reads the user's `RecommendationPreferenceState` and uses profile/final weights to gently adjust formula matching without turning Looks into a conservative daily-only recommender. Hard avoids are strictly filtered, final weights only nudge formula weights, medium-distance substitutes remain allowed, and remix copy explains when a look fits the user's preferences or is better treated as an inspiration attempt.


### Files Changed

- `lib/inspiration/match-closet-to-inspiration.ts`
  - Adds optional `preferenceState` to `matchClosetToInspiration(breakdown, closetItems, preferenceState?)`.
  - Uses `profile.colorPreference` to lower bold color substitutes for low-risk color users and boost low-saturation/basic-color options.
  - Uses `profile.silhouettePreference` to nudge silhouette matches.
  - Uses `profile.layeringPreference.complexity` to make multi-layer substitutes easier or harder to accept.
  - Uses `profile.focalPointPreference` to explain visual-center fit or expansion.
  - Uses `profile.practicalityPreference` to nudge comfort-vs-styling choices.
  - Applies `profile.hardAvoids` as strict filtering for disliked style/item terms.
  - Uses `profile.exploration.maxDistanceFromDailyStyle` to downgrade overly distant matches to inspiration reference rather than daily remix.
  - Uses `finalWeights` only as small nudges to color, silhouette, layering, focal-point/style, and slot-coverage weights.
- `lib/inspiration/types.ts`
  - Adds optional `preferenceNote` on closet matches.
  - Adds optional `preferenceAdjustment`, `distanceFromDailyStyle`, and `blockedByHardAvoid` fields on score breakdowns.
- `lib/inspiration/build-inspiration-remix-plan.ts`
  - Carries preference-aware notes into remix step and summary copy.
- `app/inspiration/actions.ts`
  - Reads `getPreferenceState({ userId })` and passes it into `matchClosetToInspiration`.
- `components/inspiration/inspiration-page.tsx`
  - Displays preference-aware explanation text returned by the matcher.
- `tests/lib/inspiration/match-closet-to-inspiration.test.ts`
  - Covers low color-risk ordering, high layering complexity, hard avoids, and medium-distance substitutes.
- `tests/lib/inspiration/build-inspiration-remix-plan.test.ts`
  - Covers preference-aware remix copy.
- `tests/app/inspiration/actions.test.ts`
  - Covers that Inspiration action reads preference state before matching.

### Phase 5 Verification

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 59 test files, 243 tests.
- `npm run build` passed, including `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

### Phase 5 Remaining Issues

- Preference-aware Inspiration matching still infers silhouette/layer-role from existing closet metadata; there are no explicit closet silhouette/layer-role columns yet.
- Distance-from-daily-style is a deterministic heuristic, not learned from Inspiration-specific feedback.
- New CI workflow and App Quality workflow are present locally but have not run on GitHub in this session.
- Recommendation storage migration remote status is still unverified in this session.

## Phase 4 GitHub Actions CI

Phase 4 GitHub Actions CI addition completed on 2026-04-24.

The repository now has a dedicated `.github/workflows/ci.yml` workflow for push-to-main and pull request quality gates. It installs with `npm ci` on Node 22 and runs lint, tests, and production build with safe dummy public Supabase/storage env values. Existing `pages.yml` was not changed.


### Files Changed

- `.github/workflows/ci.yml`
  - Runs on `push` to `main` and on `pull_request`.
  - Uses `ubuntu-latest`.
  - Uses `actions/checkout@v4`.
  - Uses `actions/setup-node@v4` with Node 22 and npm cache.
  - Runs `npm ci`, `npm run lint`, `npm test`, and `npm run build`.
  - Provides safe dummy values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_STORAGE_BUCKET` so `next build` can evaluate protected routes without real secrets.
- Existing `.github/workflows/pages.yml` was left unchanged.

### Phase 4 Verification

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 59 test files, 239 tests.
- `npm run build` passed, including `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

### Phase 4 Remaining Issues

- The new CI workflow is present locally but has not run on GitHub in this session.
- Recommendation storage migration remote status is still unverified in this session.

## Phase 3 Supabase Migration Alignment

Phase 3 Supabase recommendation storage migration alignment completed on 2026-04-24.

The local Supabase migration for recommendation preferences and outfit feedback events now matches the app's actual read/write paths. It creates both tables, references `auth.users(id)`, sets the feedback context default to `today`, enables RLS, restricts user access to own rows, and includes the required feedback indexes. Remote application is not verified in this session.


### Files Changed

- `supabase/migrations/20260424143000_add_recommendation_preferences_feedback.sql`
  - Creates `recommendation_preferences` with `user_id uuid primary key references auth.users(id) on delete cascade`.
  - Creates `outfit_feedback_events` with `user_id uuid not null references auth.users(id) on delete cascade`.
  - Sets `outfit_feedback_events.context` default to `today`.
  - Enables RLS on both tables.
  - Allows users to select/insert/update only their own `recommendation_preferences` rows.
  - Allows users to select/insert only their own `outfit_feedback_events` rows.
  - Does not open feedback update/delete policies.
  - Adds indexes for `outfit_feedback_events(user_id, created_at desc)`, `outfit_feedback_events(user_id, context, created_at desc)`, and `recommendation_preferences(updated_at)`.
- `types/database.ts`
  - Confirms both table shapes match the migration and current `lib/recommendation/*` read/write fields.
  - Adds optional `id` to `outfit_feedback_events.Insert` to reflect the `gen_random_uuid()` default.

### Phase 3 Verification

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 59 test files, 239 tests.
- `npm run build` passed, including `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

### Phase 3 Remaining Issues

- The migration is present and aligned locally, but has not been verified as applied on the remote Supabase project in this session.
- App Quality workflow has not run on GitHub in this session.

## Phase 2 Inspiration Formula Matching Fix

Phase 2 Inspiration formula-based matching fix completed on 2026-04-24.

Inspiration Phase 8C is now actually landed in code, tests, UI, and handoff. The AI breakdown contract includes formula fields, parser fallbacks tolerate incomplete AI output, closet matching uses formula-weighted scoring instead of category-only filtering, substitutes can be recommended when the same category is missing, and the UI shows formula metadata, match reasons, score breakdowns, and substitute guidance.


### Files Changed

- `lib/inspiration/types.ts`
  - Adds explicit inspiration slot, layer-role, importance, and match-score breakdown types.
  - Keeps formula fields on `InspirationBreakdown`.
  - Extends closet matches with `scoreBreakdown`.
- `lib/inspiration/analyze-inspiration-image.ts`
  - Updates the AI prompt to request `scene`, `vibe`, `colorFormula`, `silhouetteFormula`, `layeringFormula`, `focalPoint`, key-item metadata, styling tips, and color strategy notes.
  - Supports camelCase and snake_case AI fields.
  - Adds conservative fallbacks for missing formula fields and incomplete key-item metadata.
- `lib/inspiration/match-closet-to-inspiration.ts`
  - Implements formula-weighted scoring: category 0.35, slot 0.15, color 0.20, silhouette 0.15, style 0.10, layer role 0.05.
  - Uses exact color as the strongest color match, then falls back to existing color compatibility.
  - Returns same-category matches first when strong enough, and formula substitutes when no same-category item exists.
  - Returns `matchReason`, `substituteSuggestion`, and score breakdown data for UI/explanation.
- `lib/inspiration/build-inspiration-remix-plan.ts`
  - Explains color, silhouette, layering, and focal-point formulas in the remix summary.
  - Labels same-category replacements separately from formula substitutes.
- `components/inspiration/inspiration-page.tsx`
  - Displays formula fields, key-item slot/silhouette/layer/importance metadata, alternatives, match reasons, score breakdowns, and substitute suggestions.
- `tests/lib/inspiration/analyze-inspiration-image.test.ts`
  - Covers formula parsing and missing-field fallback.
- `tests/lib/inspiration/match-closet-to-inspiration.test.ts`
  - Covers weighted matching, same-category ranking, formula substitutes, and long dark coat to long dark blazer substitution.
- `tests/lib/inspiration/build-inspiration-remix-plan.test.ts`
  - Covers formula-aware remix copy and same-category/substitute labeling.
- `tests/components/inspiration-page.test.tsx`
  - Covers UI display of formula fields, key-item metadata, alternatives, match reasons, substitute suggestions, and score breakdowns.

### Phase 2 Verification

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 59 test files, 239 tests.
- `npm run build` passed, including `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

### Phase 2 Remaining Issues

- App Quality workflow has not run on GitHub in this session.
- Recommendation storage migration remote status is not verified in this session.
- Inspiration formula matching still depends on image-analysis metadata quality; weak AI output falls back to conservative formula text.
- Closet items do not yet store explicit silhouette/layer-role fields, so formula matching infers them from category, subcategory, color, and style tags.

## Phase 1 Today Contract Fix

Phase 1 Today recommendation generator contract fix completed on 2026-04-24.

Today now exposes the object-parameter recommendation generator contract as the public API, returns the complete recommendation shape required by the Preference Engine and Today UI, and keeps complete outfit scoring active for top/bottom, dress, optional outerLayer, shoes, bag, and accessories.


### Files Changed

- `lib/today/generate-recommendations.ts`
  - Makes `generateTodayRecommendations({ items, weather, offset, preferenceState, explorationSeed })` the only exported call signature.
  - Exports `GenerateTodayRecommendationsParams`.
  - Keeps full outfit candidate generation for separates, one-piece/dress, optional outer layer, shoes, bag, and up to two accessories.
  - Uses `preferenceState.finalWeights` for final scoring, falling back to default weights when preference state is missing.
  - Adds rough scene/weather matching signals for shoes, bags, and outer layers.
  - Adds missing-slot reason copy for missing shoes, bags, accessories, and cold-weather outer layers.
- `lib/today/types.ts`
  - Makes the expanded `TodayRecommendation` contract required: `mode`, `shoes`, `bag`, `accessories`, `missingSlots`, `confidence`, and `componentScores`.
- `tests/lib/today/generate-recommendations.test.ts`
  - Moves generator tests to the object-parameter API.
  - Covers full shoes/bag/accessories output, all component score keys, missing shoes/bags, cold weather without outerwear, final-weight ordering, exploration rate 0, and max-one inspiration recommendation.

### Phase 1 Verification

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 59 test files, 237 tests.
- `npm run build` passed, including `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

### Phase 1 Remaining Issues

- App Quality workflow has not run on GitHub in this session.
- Recommendation storage migration remote status is not verified in this session.
- `PROGRESS.md` still has stale Shop scope wording, but that is project-status drift rather than a Today generator blocker.

## Landing Audit

### A. Today

- `lib/today/generate-recommendations.ts` exports overloads:
  - `generateTodayRecommendations(params: { items, weather, offset?, preferenceState?, explorationSeed? }): TodayRecommendation[]`
- Legacy array-parameter overload removed in Phase 1.
- `app/today/actions.ts` and `lib/today/get-today-view.ts` call the object-parameter form when preference state is needed.
- `TodayRecommendation` includes required `shoes`, `bag`, `accessories`, `missingSlots`, `confidence`, `componentScores`, and `mode: 'daily' | 'inspiration'`.
- `tests/lib/today/generate-recommendations.test.ts` expects the expanded fields, missing-slot fallback behavior, final-weight ordering, and deterministic inspiration insertion.
- P0 blocker: none found for Today.

### B. Inspiration

- `lib/inspiration/types.ts` includes `colorFormula`, `silhouetteFormula`, `layeringFormula`, and `focalPoint`.
- `InspirationKeyItem` includes `slot`, `silhouette`, `layerRole`, `importance`, and `alternatives`.
- `lib/inspiration/match-closet-to-inspiration.ts` is not category-only. It scores category, slot, color compatibility, silhouette tokens, shared style tags, and layer role with explicit score breakdowns.
- `tests/lib/inspiration/*.test.ts` and `tests/components/inspiration-page.test.tsx` expect the formula fields, key-item metadata, match reasons, and substitute suggestions.
- P0 blocker: none found for Inspiration. The Phase 8C completion claim matches current code.

### C. Supabase

- `types/database.ts` declares `recommendation_preferences` and `outfit_feedback_events`.
- `supabase/migrations/20260424143000_add_recommendation_preferences_feedback.sql` creates both tables, required indexes, RLS, and own-row policies.
- The local migration now references `auth.users(id)` for both tables and defaults feedback `context` to `today`.
- Code reads/writes both tables through `lib/recommendation/get-preference-state.ts`, `save-preference-state.ts`, and `apply-feedback.ts`.
- P0 blocker: none found locally. Remote application is still unverified and remains a landing risk.

### D. CI

- `.github/workflows/ci.yml` exists in the current worktree and runs `npm ci`, `npm run lint`, `npm test`, and `npm run build` on push to `main` and pull requests.
- `.github/workflows/app-quality.yml` also exists from the earlier landing-audit work and runs the same app quality commands.
- `.github/workflows/pages.yml` remains Pages-only and does not cover app quality, which is fine now that App Quality exists separately.
- P0 blocker: none in the current worktree. The CI workflow still needs to be committed/pushed and observed on GitHub before claiming remote CI green.

### E. Handoff

- The handoff is no longer ahead of the Today/Inspiration/Supabase code for the checked areas.
- The prior stale test count was corrected to 59 files / 237 tests.
- The old recommendation to start Phase 8D was replaced with a landing-audit continuation prompt.
- P0 blocker: none found in `docs/recommendation-engine-handoff.md` after this audit update.

### P0 Blockers

- None in the current local worktree.

### Remaining Landing Risks

- App Quality workflow has not run on GitHub in this session.
- Recommendation storage migration remote status is not verified in this session.
- `PROGRESS.md` still has stale Shop scope wording, but that is project-status drift rather than a Recommendation Engine P0 blocker.

### Phase 0 Modified Files

- `docs/recommendation-engine-handoff.md`

## Previous Completed Implementation

Phase 8C Inspiration formula-based matching is implemented.

Inspiration now moves beyond simple same-category matching. The AI breakdown extracts outfit formulas, key items carry slot/shape/layer metadata, closet matching uses a weighted formula score, and the UI can explain substitutes when the closet has no same-category item.

## Files Changed

- `lib/inspiration/types.ts`
  - Adds `colorFormula`, `silhouetteFormula`, `layeringFormula`, and `focalPoint` to `InspirationBreakdown`.
  - Extends `InspirationKeyItem` with optional `slot`, `silhouette`, `layerRole`, `importance`, and `alternatives`.
  - Extends closet matches with `matchReason` and `substituteSuggestion`.
- `lib/inspiration/analyze-inspiration-image.ts`
  - Updates the AI prompt to request scene, color formula, silhouette formula, layering formula, focal point, key items, and substitute options.
  - Parses the new formula and key-item metadata with fallbacks for incomplete AI output.
- `lib/inspiration/match-closet-to-inspiration.ts`
  - Replaces category-only filtering with weighted scoring across category, slot, color compatibility, silhouette tokens, style tags, and layer role.
  - Returns formula-based substitutes when no same-category closet item exists.
- `lib/inspiration/build-inspiration-remix-plan.ts`
  - Uses formula fields in the summary.
  - Explains when a matched item is a formula substitute rather than a same-category replacement.
- `components/inspiration/inspiration-page.tsx`
  - Shows color, silhouette, layering, and focal-point formulas.
  - Shows key-item slot/shape/layer/importance metadata and alternatives.
  - Shows match reasons and substitute suggestions.
- `tests/lib/inspiration/*.test.ts`
  - Covers AI parsing, formula scoring, substitute suggestions, remix copy, and color strategy compatibility.
- `tests/components/inspiration-page.test.tsx`
  - Covers formula display, key-item metadata, alternatives, and match explanations.

Earlier Today exploration changes are also present in the current branch:

- `lib/recommendation/exploration.ts`
- `lib/today/types.ts`
- `lib/today/generate-recommendations.ts`
- `components/today/today-recommendation-card.tsx`
- related Today/exploration tests

## Current APIs

- Pure recommendation APIs:
  - `buildFinalWeights(defaultWeights, questionnaireDelta?, ratingDelta?)`
  - `resetRecommendationPreferences(now?)`
  - `buildPreferencesFromQuestionnaire(answers)`
  - `updateRatingDeltaFromFeedback({ currentRatingDelta, rating, reasonTags })`
  - `deterministicSeedToUnit(seed)`
  - `shouldShowInspiration({ profile, deterministicValue?, seed?, candidateCount?, alreadyShownToday? })`
  - `isGoodInspirationCandidate(candidate, profile)`
  - `pickDeterministicInspirationCandidate(candidates, profile, seed?)`
  - `evaluateOutfit(outfit, context?)`
  - `getWeightedOutfitScore(componentScores, weights?)`
  - `getItemWeatherSuitability(item, weather?)`
  - `filterWeatherSuitableItems(items, weather?, threshold?)`
  - `rankItemsForRecommendation(items, context?)`
  - `hasTonalColorRelationship(leftColor, rightColor)`
  - `generateTodayRecommendations({ items, weather, offset?, preferenceState?, explorationSeed? })`
- Shop APIs:
  - `supportedFashionCategories`
  - `getUnsupportedShopCategoryMessage(category)`
  - `analyzePurchaseCandidate(candidate, closetItems, preferenceState?)`
- Inspiration APIs:
  - `analyzeInspirationImage(imageUrl)`
  - `matchClosetToInspiration(breakdown, closetItems, preferenceState?)`
  - `buildInspirationRemixPlan(breakdown, closetMatches)`
- Travel APIs:
  - `buildTravelPackingPlan({ destinationCity, days, scenes, items, weather, preferenceState? })`
  - `TravelPackingEntry.slot`
  - `TravelDailyPlanEntry.shoeSummary`
  - `TravelDailyPlanEntry.bagSummary`
- Storage APIs:
  - `getPreferenceState({ userId, now?, supabase? })`
  - `savePreferenceState({ userId, state, questionnaireAnswers?, supabase? })`
  - `submitQuestionnaire({ userId, answers, now?, supabase? })`
  - `applyFeedback({ userId, rating, reasonTags, recommendationId?, recommendationSnapshot?, componentScores?, context?, now?, supabase? })`
- UI/action APIs:
  - `submitStyleQuestionnaireAction(answers)`
  - `resetRecommendationPreferencesAction()`
  - `restartStyleQuestionnaireAction()`
  - `submitTodayOotdAction({ recommendation, satisfactionScore, reasonTags })`
  - `refreshTodayRecommendationsAction(offset)`
  - `analyzeShopCandidateAction({ sourceUrl, preferredImageUrl? })`

## Behavior Locked In

- `/preferences` and `/settings` are login protected.
- Submitting the questionnaire saves through `submitQuestionnaire()`, which starts from a fresh default preference state and does not stack old questionnaire or feedback deltas.
- Settings reset restores App default recommendation parameters by saving a fresh default preference state.
- Reset does not delete closet items, OOTD records, or old `outfit_feedback_events`.
- Today view and refresh paths read preference state and pass it into the generator.
- Inspiration insertion is deterministic and controlled by `profile.exploration.rate`.
- `exploration.rate = 0` guarantees no inspiration recommendation.
- Each Today recommendation list contains at most one inspiration recommendation.
- Shop rejects non-fashion categories but now accepts shoes, bags, and accessories.
- Shop shoes estimate how many core outfits they can finish.
- Shop bags evaluate scenario completeness and color/style echo.
- Shop accessories are treated as visual focus or style reinforcement rather than direct outfit-count unlocks.
- Shop purchase analysis reads preference state when available and explains comfort, styling, low-key color/focal, and hard-avoid impacts in the recommendation reason.
- Travel keeps generating a plan without shoe or bag data.
- Travel commute/formal scenes prioritize formal shoes and bags when available.
- Travel outdoor, walking-heavy, or longer trips prioritize comfortable shoes.
- Travel long trips can add backup shoes when there is another available pair.
- Travel cold-weather and long-trip plans still preserve outerwear handling.
- Travel missing hints explicitly explain missing shoes, bags, and outerwear impact.
- Travel packing reads preference state when available and adjusts light packing, complete styling, layering complexity, and comfort-shoe priority.
- Today / Shop / Inspiration / Travel share the same core language for foundation colors, tonal depth, single accent, multiple accent competition, missing shoes, missing bags, missing accessories, and inspiration-attempt labeling.
- Today / Shop / Inspiration / Travel share the same core evaluator dimensions: color harmony, silhouette balance, layering, focal point, scene fit, weather comfort, completeness, and freshness.
- Shared evaluator inputs prefer `algorithmMeta` and `seasonTags`, but tolerate missing metadata through category, subcategory, style tags, color category, wear history, and item text.
- 15 degree weather treats summer shorts and sandals/slides as low suitability when covered alternatives exist.
- Tonal copy no longer treats all neutral colors as one family; achromatic neutrals and warm neutrals are separate clusters.
- Inspiration AI output includes outfit formulas: color, silhouette, layering, and focal point.
- Inspiration key items can carry slot, silhouette, layer role, importance, and alternatives.
- Inspiration closet matching is formula-weighted instead of category-only.
- Inspiration can recommend substitutes when no same-category closet item exists.
- Inspiration matching reads preference state, strictly filters hard avoids, and gently nudges formula matching with `finalWeights` without blocking medium-distance inspiration substitutes.
- Closet items can carry optional `algorithmMeta` for slot, layer role, silhouette, length, material, fabric weight, formality, warmth, comfort, visual weight, and pattern; existing algorithms still fall back to category/subcategory/style tags.
- Closet item cards can carry optional `seasonTags`; current Supabase reads include `items.season_tags` where available.

## Tests Added Or Updated

- Inspiration tests cover:
  - AI parsing for formula fields and key-item metadata
  - weighted formula matching by category/slot/color/silhouette/style/layer
  - substitute suggestions when no same-category item exists
  - preference-aware color risk, layering complexity, hard avoids, and medium-distance substitutes
  - remix summary copy based on formulas
  - formula and substitute UI rendering
- Closet metadata tests cover:
  - algorithm metadata fallback inference from existing category/subcategory/style tags
  - optional AI `algorithm_meta` parsing
  - `algorithm_meta` persistence payload
- Shop preference tests cover:
  - comfort-first purchase boosts
  - styling-first bag/accessory boosts
  - low-key preference downgrade for loud items
  - hard-avoid purchase blocking
- Travel preference tests cover:
  - light-packing reduction of backup shoes/non-essential bags
  - complete-styling retention of shoe/bag slots
  - comfort-first shoe ranking for walking-heavy trips
- Shared evaluator tests cover:
  - 15 degree weather filtering of shorts and sandals when alternatives exist
  - fallback scoring without `algorithmMeta` or `seasonTags`
  - full component score coverage for a cool-weather outfit
  - tonal color clusters separating achromatic neutrals from warm neutrals
- Today tests cover 15 degree recommendation avoiding shorts and sandals when alternatives exist.
- Travel tests cover 15 degree packing avoiding shorts and sandals when alternatives exist.
- Shared recommendation copy tests cover:
  - black/white/gray, beige/brown, and navy foundation-color language
  - tonal-depth language
  - one-accent and multiple-accent visual-center language
  - non-blocking missing shoe/bag/accessory copy
  - inspiration-attempt labeling
- Phase 8B Travel tests remain:
  - no-shoe/no-bag fallback plan generation
  - formal shoes for commute/formal trips
  - comfortable shoes for outdoor/walking-heavy trips
  - backup shoes for longer trips
  - bag selection for commute/formal scenarios
  - missing hints for shoes, bags, and outerwear
- Travel component tests cover shoe/bag packing entries and daily chips.
- Phase 8A Shop tests remain:
  - expanded supported category set
  - shoes as outfit finishers
  - bags as scene/color completion
  - accessories as visual focus / style reinforcement
- Phase 7 tests remain:
  - deterministic exploration helpers
  - Today inspiration insertion / no insertion when rate is 0
  - Today inspiration UI labeling

Verification:

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 62 test files, 285 tests.
- `npm run build` passed, with `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

## Known Limitations

- The new CI/App Quality GitHub Actions workflows have not run on GitHub in this session.
- The Supabase migration for recommendation storage still has not been pushed/applied remotely in this phase.
- Shop, Inspiration, and Travel consume the shared evaluator and `finalWeights`, but they still do not have their own page-specific feedback events.
- Bag and accessory scoring uses closet metadata and evaluator fallback only; it does not yet infer detailed occasion constraints from calendars, travel plans, or OOTD history.
- Cross-page language now shares helper copy, but page-level visual QA screenshots were not added in this phase.
- Accessories still share the old `estimatedOutfitCount` display slot for compatibility, even though the recommendation reason frames them as visual/style reinforcement.
- Travel shoe and bag selection now uses preference state and shared evaluator context when available, but it is still deterministic and does not yet learn from Travel-specific feedback.
- Travel scenes do not yet include explicit `步行` or `旅行` options, so the algorithm treats `户外`, `休闲`, and longer trips as walking-heavy signals.
- Inspiration formula matching still depends on image-analysis metadata quality; weak AI output falls back to generic formula text.
- Closet items store explicit algorithm metadata as JSON when available, but old rows can still lack detailed fields, so every recommendation surface keeps category/subcategory/style fallback logic.
- Inspiration preference distance is still a deterministic heuristic and does not yet learn from Looks-specific feedback.

## Recommended Next Prompt

Next phase: push the local Recommendation Engine branch, verify GitHub CI/App Quality runs on GitHub, and verify remote Supabase has both recommendation storage migrations and `items.algorithm_meta` applied. Do not start another recommendation feature until remote CI and migration status are confirmed.
