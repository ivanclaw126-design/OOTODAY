# Travel Packing MVP Implementation Plan

**Goal:** Launch the first `/travel` planning flow so a signed-in user can enter a destination, trip length, and trip scenes, then get a wardrobe-backed clothing packing plan with weather-aware guidance.

**Architecture:** Reuse the existing protected route pattern from Today / Shop, keep the planner deterministic and rules-based, and render the result from URL search params so the first version is simple to test and easy to share.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR/Auth/Postgres, Vitest, Testing Library

## File Structure

### Create

- `docs/superpowers/specs/2026-04-22-travel-packing-mvp-design.md`
- `lib/travel/types.ts`
- `lib/travel/build-travel-packing-plan.ts`
- `components/travel/travel-page.tsx`
- `app/travel/page.tsx`
- `tests/lib/travel/build-travel-packing-plan.test.ts`
- `tests/components/travel-page.test.tsx`

### Modify

- `components/bottom-nav.tsx`
- `tests/components/app-shell.test.tsx`
- `app/travel/actions.ts`
- `lib/travel/save-travel-plan.ts`
- `lib/travel/get-recent-travel-plans.ts`
- `lib/travel/persistence.ts`
- `PROGRESS.md`
- `docs/process/progress-sync.md`

## Task 1: Add the Travel domain and packing plan builder

- [x] Create `lib/travel/types.ts`
- [x] Create `lib/travel/build-travel-packing-plan.ts`
- [x] Add `tests/lib/travel/build-travel-packing-plan.test.ts`
- [x] Verify the rule-based planner returns stable checklist, hint, and note output

## Task 2: Add the protected Travel route and page

- [x] Create `app/travel/page.tsx`
- [x] Create `components/travel/travel-page.tsx`
- [x] Use URL search params for city / days / scenes
- [x] Reuse full wardrobe data and optional destination weather
- [x] Add `tests/components/travel-page.test.tsx`

## Task 3: Add navigation and project record sync

- [x] Add `/travel` to primary navigation
- [x] Update `tests/components/app-shell.test.tsx`
- [x] Update `PROGRESS.md`
- [x] Update `docs/process/progress-sync.md`

## Task 4: Save generated travel plans

- [x] Add persistence helpers for saving and reading recent travel plans
- [x] Add a save action and wire it into `app/travel/page.tsx`
- [x] Update `components/travel/travel-page.tsx` to show save CTA plus reopenable recent saved plans
- [x] Add tests for save-plan persistence and action behavior
- [x] Verify the browser flow from generate -> save -> recent saved list render
