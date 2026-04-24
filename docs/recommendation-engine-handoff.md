# Recommendation Engine Handoff

## Current Phase Completed

Phase 2 Supabase storage for recommendation preferences and outfit feedback events is implemented.

This phase added persistence and server helpers only. It does not change Today UI, Today server actions, or the recommendation ranking algorithm.

## Files Changed

- `supabase/migrations/20260424143000_add_recommendation_preferences_feedback.sql`
  - Adds `recommendation_preferences` with one current row per user.
  - Adds append-only `outfit_feedback_events`.
  - Enables RLS and policies so users can only read/write their own preference and feedback rows.
- `types/database.ts`
  - Adds `Json`, `recommendation_preferences`, and `outfit_feedback_events` table types.
- `lib/recommendation/preference-state-storage.ts`
  - Serializes `RecommendationPreferenceState` into database payloads and deserializes stored JSON rows back into safe state objects.
- `lib/recommendation/recommendation-supabase.ts`
  - Provides a narrow Supabase client interface for storage helpers so database access stays easy to mock.
- `lib/recommendation/get-preference-state.ts`
  - Returns the stored preference state, or `resetRecommendationPreferences()` when the user has no row.
- `lib/recommendation/save-preference-state.ts`
  - Upserts the current preference state by `user_id`.
- `lib/recommendation/submit-questionnaire.ts`
  - Builds questionnaire preferences from a fresh default state, clears old rating deltas, stores questionnaire answers, and saves a new version.
- `lib/recommendation/apply-feedback.ts`
  - Inserts an `outfit_feedback_events` row, updates `ratingDelta` using Phase 1 feedback learning, recomputes `finalWeights`, and marks source as `adaptive`.
- `tests/lib/recommendation/preference-storage.test.ts`
  - Covers missing-row fallback, upsert payloads, questionnaire reset semantics, and adaptive feedback persistence.

## Current APIs

- Pure Phase 1 APIs remain available:
  - `buildFinalWeights(defaultWeights, questionnaireDelta?, ratingDelta?)`
  - `resetRecommendationPreferences(now?)`
  - `buildPreferencesFromQuestionnaire(answers)`
  - `updateRatingDeltaFromFeedback({ currentRatingDelta, rating, reasonTags })`
  - `shouldShowInspiration(...)`
- Phase 2 storage APIs:
  - `getPreferenceState({ userId, now?, supabase? })`
  - `savePreferenceState({ userId, state, questionnaireAnswers?, supabase? })`
  - `submitQuestionnaire({ userId, answers, now?, supabase? })`
  - `applyFeedback({ userId, rating, reasonTags, recommendationId?, recommendationSnapshot?, componentScores?, context?, now?, supabase? })`

## Behavior Locked In

- If a user has no `recommendation_preferences` row, `getPreferenceState()` returns a default reset state instead of failing.
- `submitQuestionnaire()` always starts from `resetRecommendationPreferences(now)`, so it never stacks old questionnaire deltas or old feedback deltas.
- A reset/questionnaire submission creates a new `version`; old `outfit_feedback_events` remain stored but are separated by `preference_version`.
- `applyFeedback()` stores a feedback event using the current preference version, then updates only the current row's adaptive `ratingDelta` and `finalWeights`.
- Storage helpers accept injectable Supabase clients, keeping database access isolated from pure calculations and testable without live Supabase.

## Tests Added Or Updated

- Existing Phase 1 recommendation tests remain.
- Added `tests/lib/recommendation/preference-storage.test.ts`.

Verification:

- `npm run lint` passed with 0 errors and 4 existing Closet `<img>` warnings.
- `npm test` passed: 53 test files, 198 tests.
- `npm run build` passed.

## Known Limitations

- The new migration has not been pushed to remote Supabase in this phase.
- Today still submits only `satisfactionScore`; no reason tags are collected from the UI yet.
- Today still does not call `getPreferenceState()` or `applyFeedback()`.
- `generateTodayRecommendations()` still ignores `finalWeights` and only returns the legacy slots: `top`, `bottom`, `dress`, and `outerLayer`.
- There is no settings/preferences UI yet for reset or questionnaire submission.

## Recommended Next Prompt

Implement Phase 3 visual questionnaire UI only. Add protected `/preferences` route, action, and components that call `submitQuestionnaire()`. Do not wire preferences into Today ranking or feedback submission yet.
