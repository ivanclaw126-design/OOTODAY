# Recommendation Engine Handoff

## Current Phase Completed

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
- `npm test` passed: 59 test files, 233 tests.
- `npm run build` passed, with `/inspiration`, `/preferences`, `/settings`, `/shop`, `/today`, and `/travel` in the route list.

## Known Limitations

- The Supabase migration for recommendation storage still has not been pushed/applied remotely in this phase.
- Shop accessory analysis is still deterministic and rule-based; it does not yet use learned user preference weights.
- Bag and accessory scoring uses existing closet metadata only; it does not yet infer detailed occasion constraints from calendars, travel plans, or OOTD history.
- Accessories still share the old `estimatedOutfitCount` display slot for compatibility, even though the recommendation reason frames them as visual/style reinforcement.
- Travel shoe and bag selection is still deterministic and metadata-based; it does not yet use learned recommendation preference weights.
- Travel scenes do not yet include explicit `步行` or `旅行` options, so the algorithm treats `户外`, `休闲`, and longer trips as walking-heavy signals.
- Inspiration formula matching still depends on image-analysis metadata quality; weak AI output falls back to generic formula text.
- Closet items do not yet store explicit silhouette/layer-role fields, so the matcher infers them from category, subcategory, and style tags.

## Recommended Next Prompt

Implement Phase 8D: make Inspiration formula matching preference-aware. Use recommendation preference weights and Today feedback signals to adjust formula priorities, especially focal point, color risk, layering complexity, comfort vs styling, and exploration tolerance.
