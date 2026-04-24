# Recommendation Engine Handoff

## Current Phase Completed

Phase 6 complete Today outfit slots and preference-weighted scoring is implemented.

Today recommendations now keep the legacy `top` / `bottom` / `dress` / `outerLayer` fields while adding complete outfit slots: `shoes`, `bag`, `accessories`, `missingSlots`, `confidence`, `componentScores`, and `mode`. The generator builds a core outfit first, completes it with weather-aware outerwear and preferred shoe/bag/accessory slots, then ranks candidates with `preferenceState.finalWeights`.

OOTD submission remains compatible with the existing flow. Saved OOTD notes and item wear signals now include the new shoe/bag/accessory slots when present.

## Files Changed

- `lib/closet/taxonomy.ts`
  - Exports `SHOES_CATEGORY`, `BAG_CATEGORY`, and `ACCESSORY_CATEGORY`.
  - Adds `isShoesCategory()`, `isBagCategory()`, `isAccessoryCategory()`, and `isRecommendableCategory()`.
  - Accessory-category checks can recognize both canonical category names and subcategory aliases such as `乐福鞋`.
- `lib/today/types.ts`
  - Extends `TodayRecommendation` with `shoes`, `bag`, `accessories`, `missingSlots`, `confidence`, `componentScores`, and `mode`.
  - Keeps `top`, `bottom`, `dress`, and `outerLayer` for backwards compatibility.
- `lib/today/generate-recommendations.ts`
  - Builds `separates`, `onePiece`, and `partial` candidates.
  - Selects outerwear based on weather and `profile.layeringPreference`.
  - Selects shoes, bag, and accessories from `profile.slotPreference`.
  - Records missing preferred slots instead of failing generation.
  - Computes 0-100 `componentScores` for color harmony, silhouette balance, layering, focal point, scene fit, weather comfort, completeness, and freshness.
  - Ranks candidates using `preferenceState.finalWeights`, falling back to default weights/profile when no preference state is passed.
  - Preserves the old positional function signature and the newer object-parameter signature.
- `components/today/today-recommendation-card.tsx`
  - Shows confidence, full outfit preview, shoes, bag, accessories, and gentle missing-slot hints.
  - Keeps the existing rating and reason-tag OOTD submit flow.
- `lib/today/build-ootd-notes.ts`
  - Includes shoes, bag, and accessories in saved OOTD notes.
- `lib/today/save-today-ootd-feedback.ts`
  - Includes shoes, bag, and accessories in item `last_worn_date` / `wear_count` updates.
- `app/today/actions.ts`
  - Passes `recommendation.componentScores` into `applyFeedback()` so feedback events can retain scoring context.
- Tests updated:
  - `tests/lib/closet/taxonomy.test.ts`
  - `tests/lib/today/generate-recommendations.test.ts`
  - `tests/components/today-page.test.tsx`
  - `tests/lib/today/build-ootd-notes.test.ts`
  - `tests/lib/today/save-today-ootd-feedback.test.ts`
  - `tests/app/today/actions.test.ts`

## Current APIs

- Pure recommendation APIs:
  - `buildFinalWeights(defaultWeights, questionnaireDelta?, ratingDelta?)`
  - `resetRecommendationPreferences(now?)`
  - `buildPreferencesFromQuestionnaire(answers)`
  - `updateRatingDeltaFromFeedback({ currentRatingDelta, rating, reasonTags })`
  - `shouldShowInspiration(...)`
  - `generateTodayRecommendations({ items, weather, offset?, preferenceState? })`
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
  - `<StyleQuestionnairePage submitAnswers={...} />`
  - `<SettingsPage source={...} updatedAt={...} resetPreferences={...} restartQuestionnaire={...} />`

## Behavior Locked In

- `/preferences` and `/settings` are login protected.
- Submitting the questionnaire saves through `submitQuestionnaire()`, which starts from a fresh default preference state and does not stack old questionnaire or feedback deltas.
- Settings reset restores App default recommendation parameters by saving a fresh default preference state.
- Reset does not delete closet items, OOTD records, or old `outfit_feedback_events`.
- Restarting the questionnaire first saves a fresh default state, then redirects to `/preferences`.
- If the user exits the questionnaire after starting a refill, the current stored state remains `default`.
- Today view and refresh paths read preference state and pass it into the generator.
- Today recommendations can be complete or partial; missing preferred slots lower completeness/confidence but do not block output.
- Today OOTD feedback still records the normal daily OOTD result before preference learning runs.
- A preference-learning failure after a successful OOTD save is non-blocking and reported as `today_preference_feedback_failed`.

## Tests Added Or Updated

- Taxonomy tests cover new shoe/bag/accessory category helpers.
- Generator tests cover full slots, missing slots, 0-100 component scores, confidence, and final-weight-driven ordering.
- Today component tests cover rendering shoes, bag, accessories, confidence, and missing-slot hints.
- OOTD note/save tests cover new slots in notes and wear-signal updates.
- Today action tests cover forwarding `componentScores` to `applyFeedback()`.

Verification:

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 59 test files, 222 tests.
- `npm run build` passed, with `/preferences`, `/settings`, and `/today` in the route list.

## Known Limitations

- The Supabase migration for recommendation storage still has not been pushed/applied remotely in this phase.
- Slot-level scoring is still deterministic and rule-based; it does not yet learn per-item affinity or per-slot exclusions.
- Today UI shows score confidence and missing slots, but does not yet expose detailed component-score explanations.
- Accessories are limited to at most two items in a recommendation to keep the card readable.

## Recommended Next Prompt

Implement Phase 7 ranking explanation and feedback quality loop. Add lightweight component-score explanations to Today cards, store richer component score snapshots with feedback, and add tests proving that low ratings with reason tags adjust the next `ratingDelta` without overreacting to a single event.
