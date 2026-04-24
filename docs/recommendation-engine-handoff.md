# Recommendation Engine Handoff

## Current Phase Completed

Phase 1 Today recommendation generator contract fix completed on 2026-04-24.

Today now exposes the object-parameter recommendation generator contract as the public API, returns the complete recommendation shape required by the Preference Engine and Today UI, and keeps complete outfit scoring active for top/bottom, dress, optional outerLayer, shoes, bag, and accessories.

## Phase 1 Today Contract Fix

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
- `lib/inspiration/match-closet-to-inspiration.ts` is not category-only. It scores category, slot, color compatibility, silhouette tokens, shared style tags, layer role, and importance-weighted color.
- `tests/lib/inspiration/*.test.ts` and `tests/components/inspiration-page.test.tsx` expect the formula fields, key-item metadata, match reasons, and substitute suggestions.
- P0 blocker: none found for Inspiration. The Phase 8C completion claim matches current code.

### C. Supabase

- `types/database.ts` declares `recommendation_preferences` and `outfit_feedback_events`.
- `supabase/migrations/20260424143000_add_recommendation_preferences_feedback.sql` creates both tables, index, RLS, and policies.
- Code reads/writes both tables through `lib/recommendation/get-preference-state.ts`, `save-preference-state.ts`, and `apply-feedback.ts`.
- P0 blocker: none found locally. Remote application is still unverified and remains a landing risk.

### D. CI

- `.github/workflows/app-quality.yml` exists in the current worktree and runs `npm run lint`, `npm test`, and `npm run build`.
- `.github/workflows/pages.yml` remains Pages-only and does not cover app quality, which is fine now that App Quality exists separately.
- P0 blocker: none in the current worktree. If auditing only pushed `origin/main`, the App Quality workflow still needs to be committed/pushed and observed on GitHub.

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

Phase 7 changes are also present in the current worktree:

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
  - `generateTodayRecommendations({ items, weather, offset?, preferenceState?, explorationSeed? })`
- Shop APIs:
  - `supportedFashionCategories`
  - `getUnsupportedShopCategoryMessage(category)`
  - `analyzePurchaseCandidate(candidate, closetItems)`
- Inspiration APIs:
  - `analyzeInspirationImage(imageUrl)`
  - `matchClosetToInspiration(breakdown, closetItems)`
  - `buildInspirationRemixPlan(breakdown, closetMatches)`
- Travel APIs:
  - `buildTravelPackingPlan({ destinationCity, days, scenes, items, weather })`
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
- Travel keeps generating a plan without shoe or bag data.
- Travel commute/formal scenes prioritize formal shoes and bags when available.
- Travel outdoor, walking-heavy, or longer trips prioritize comfortable shoes.
- Travel long trips can add backup shoes when there is another available pair.
- Travel cold-weather and long-trip plans still preserve outerwear handling.
- Travel missing hints explicitly explain missing shoes, bags, and outerwear impact.
- Inspiration AI output includes outfit formulas: color, silhouette, layering, and focal point.
- Inspiration key items can carry slot, silhouette, layer role, importance, and alternatives.
- Inspiration closet matching is formula-weighted instead of category-only.
- Inspiration can recommend substitutes when no same-category closet item exists.

## Tests Added Or Updated

- Inspiration tests cover:
  - AI parsing for formula fields and key-item metadata
  - weighted formula matching by category/slot/color/silhouette/style/layer
  - substitute suggestions when no same-category item exists
  - remix summary copy based on formulas
  - formula and substitute UI rendering
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
- `npm test` passed: 59 test files, 237 tests.
- `npm run build` passed, with `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

## Known Limitations

- The new App Quality GitHub Actions workflow has not run on GitHub in this session.
- The Supabase migration for recommendation storage still has not been pushed/applied remotely in this phase.
- Shop accessory analysis is still deterministic and rule-based; it does not yet use learned user preference weights.
- Bag and accessory scoring uses existing closet metadata only; it does not yet infer detailed occasion constraints from calendars, travel plans, or OOTD history.
- Accessories still share the old `estimatedOutfitCount` display slot for compatibility, even though the recommendation reason frames them as visual/style reinforcement.
- Travel shoe and bag selection is still deterministic and metadata-based; it does not yet use learned recommendation preference weights.
- Travel scenes do not yet include explicit `步行` or `旅行` options, so the algorithm treats `户外`, `休闲`, and longer trips as walking-heavy signals.
- Inspiration formula matching still depends on image-analysis metadata quality; weak AI output falls back to generic formula text.
- Closet items do not yet store explicit silhouette/layer-role fields, so the matcher infers them from category, subcategory, and style tags.

## Recommended Next Prompt

Continue the Recommendation Engine landing audit with the next non-8D phase: verify remote Supabase migration status for `recommendation_preferences` and `outfit_feedback_events`, confirm the new App Quality workflow on GitHub after push, and then clean up stale project-status wording such as the old Shop core-clothing limitation in `PROGRESS.md`.
