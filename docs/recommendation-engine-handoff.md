# Recommendation Engine Handoff

## Current Phase Completed

Phase 8A Shop accessory-category purchase analysis is implemented.

Shop now supports purchase analysis for the full recommendable fashion category set:

- `上装`
- `下装`
- `连体/全身装`
- `外层`
- `鞋履`
- `包袋`
- `配饰`

The old Shop result surface still displays `recommendation`, `duplicateRisk`, `estimatedOutfitCount`, and `missingCategoryHints`. Phase 8A adds slot-aware fields so shoes, bags, and accessories are not judged by the same logic as tops/bottoms.

## Files Changed

- `lib/shop/types.ts`
  - Adds `ShopWardrobeGapType`.
  - Extends `ShopPurchaseAnalysis` with:
    - `unlocksOutfitCount`
    - `completesIncompleteOutfitCount`
    - `fillsWardrobeGap`
    - `gapType`
- `lib/shop/analyze-purchase-candidate.ts`
  - Exports `supportedFashionCategories` covering core clothing plus shoes, bags, and accessories.
  - Updates unsupported-category copy for the broader fashion item set.
  - Keeps core clothing logic compatible with previous behavior.
  - Adds shoe logic: estimates how many existing core outfits the shoes can finish.
  - Adds bag logic: evaluates scene completeness plus color/style echo.
  - Adds accessory logic: treats accessories as visual focus or style reinforcement, not a simple outfit-count multiplier.
  - Adds wardrobe gap classification:
    - `coreOutfit`
    - `shoeFinisher`
    - `sceneBag`
    - `visualFocus`
    - `styleReinforcement`
- `components/shop/shop-page.tsx`
  - Keeps the existing recommendation / duplicate-risk / yield / missing-hints layout.
  - Shows slot-aware labels such as `收尾套数`, `场景补全`, and `强化套数`.
  - Adds optional gap metric cards for wardrobe gap type, unlock count, and completion count.
- `tests/lib/shop/analyze-purchase-candidate.test.ts`
  - Covers supported categories, shoes, bags, and accessories.
- `tests/components/shop-page.test.tsx`
  - Covers the new slot-aware gap metrics in the UI.
- `tests/app/shop/actions.test.ts`
  - Updates unsupported-category copy.

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

## Tests Added Or Updated

- Shop analyzer tests cover:
  - expanded supported category set
  - shoes as outfit finishers
  - bags as scene/color completion
  - accessories as visual focus / style reinforcement
- Shop component tests cover slot-aware wardrobe gap metrics.
- Shop action tests cover the updated unsupported-category copy.
- Phase 7 tests remain:
  - deterministic exploration helpers
  - Today inspiration insertion / no insertion when rate is 0
  - Today inspiration UI labeling

Verification:

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 59 test files, 231 tests.
- `npm run build` passed, with `/preferences`, `/settings`, `/shop`, and `/today` in the route list.

## Known Limitations

- The Supabase migration for recommendation storage still has not been pushed/applied remotely in this phase.
- Shop accessory analysis is still deterministic and rule-based; it does not yet use learned user preference weights.
- Bag and accessory scoring uses existing closet metadata only; it does not yet infer detailed occasion constraints from calendars, travel plans, or OOTD history.
- Accessories still share the old `estimatedOutfitCount` display slot for compatibility, even though the recommendation reason frames them as visual/style reinforcement.

## Recommended Next Prompt

Implement Phase 8B preference-aware Shop ranking. Use recommendation preference weights and Today feedback signals to adjust Shop purchase recommendations, especially for shoes, bags, and accessories, while keeping the expanded slot-aware fields from Phase 8A.
