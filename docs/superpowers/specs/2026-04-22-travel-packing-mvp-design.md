# Travel Packing MVP Design

## Goal

Add the next major product capability after Today / Closet / Inspiration / Shop: a protected `/travel` page that turns destination, trip length, and trip scenes into a usable clothing packing plan backed by the user's real wardrobe.

## Why This Now

- It is already listed as super-scenario 5 in `AGENTS.md`.
- The current codebase already has the building blocks this feature needs:
  - wardrobe inventory from Closet
  - weather lookup from Today
  - reuse / gap-detection patterns from Shop and Inspiration
- It opens a new decision surface instead of only polishing existing flows.

## MVP Scope

V1 should deliver:

1. A protected `/travel` route with the same authenticated shell as the rest of the app.
2. A lightweight trip form:
   - destination city
   - trip days
   - scene selection from a small fixed set
3. A server-built packing result using the real wardrobe:
   - suggested outfit count
   - grouped packing checklist by category
   - missing basics or risk reminders
   - lightweight notes about how to rotate pieces across the trip
4. Weather-aware messaging when destination weather is available.
5. Graceful degradation when no weather is available or the wardrobe is too small.

Out of scope for this MVP:

- shoes / bags / accessories
- persistent trip saving
- calendar integration
- day-by-day itinerary parsing
- exact laundry cadence optimization

## User Experience

### Empty / First Use

If the user has no wardrobe items, the page should explain that packing suggestions need a basic closet first and send them to `/closet`.

### Planner Form

The page should show a compact form above the result:

- destination city text input
- trip day count number input
- checkbox scenes:
  - 通勤
  - 休闲
  - 正式
  - 约会
  - 户外

Form submission can use URL search params for simplicity and shareability in MVP.

### Result Shape

The result should show:

1. Trip summary
   - destination
   - days
   - selected scenes
   - weather status
2. Packing checklist
   - tops
   - bottoms
   - dresses when relevant
   - outer layer when relevant
3. Missing / risk hints
   - e.g. not enough bottoms
   - no outerwear for cold destination
   - wardrobe too shallow for varied formal scenes
4. Rotation notes
   - a few short suggestions on rewearing and pairing logic

## Data Model

Create a Travel domain with:

- `TravelScene`
- `TravelPackingEntry`
- `TravelPackingPlan`
- `TravelPackingView`

The view should support:

- no trip configured yet
- empty closet
- ready result with optional weather

## Recommendation Logic

The first version should stay rules-based and deterministic.

Inputs:

- destination city
- days
- selected scenes
- wardrobe items
- optional current weather for the destination

Heuristics:

- prefer higher wear-count items as more reliable travel picks
- keep total packed volume smaller than trip days by assuming rewear for tops and bottoms
- include outerwear if weather is cold or scene mix implies layering
- include dresses when they exist and the scene mix benefits from them
- add missing hints when category coverage is insufficient

## Route And Architecture

Add:

- `app/travel/page.tsx`
- `components/travel/travel-page.tsx`
- `lib/travel/types.ts`
- `lib/travel/build-travel-packing-plan.ts`

The route should:

- require auth
- ensure profile
- fetch full closet
- optionally fetch destination weather
- build a Travel view from URL params

## Verification

MVP should ship with:

- unit tests for the packing plan builder
- component tests for the Travel page render states
- app-shell navigation coverage updated for the new route
