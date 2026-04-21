# Today Recommendation MVP Design

> Date: 2026-04-20
> Scope: Phase 2 of the confirmed execution route. This spec only covers Today recommendation MVP. OOTD feedback and purchase analysis stay as later phases.

## Goal

Turn `/today` from a placeholder screen into a real daily decision page.

The MVP must let a signed-in user with wardrobe items open Today and immediately get 3 outfit recommendations. If the user has a saved city, weather should improve the recommendations. If the user has no city, the page must still work and show non-weather recommendations.

## Why now

The project already has a working wardrobe import flow, real `items` data, passing tests, and QA-verified upload/save/display behavior. The next highest-value step is to convert stored wardrobe data into actionable daily guidance.

This phase completes the core value chain:

`closet data -> recommendation -> better recommendation with weather`

## Product decisions

### Confirmed route

1. First, keep the current Closet Upload completion state as its own commit.
2. Then implement Today recommendation MVP.
3. After that, implement OOTD record and satisfaction feedback.
4. Finally, move into purchase analysis.

### Confirmed Today MVP behavior

- Weather is included in the MVP.
- City is optional, not a blocking requirement.
- If the user does not set a city, Today still shows recommendations.
- If the user sets a city, weather improves the recommendation logic.
- The page should encourage setting a resident city for better results.
- City must remain editable later so future travel scenarios can reuse the same surface.

## User experience

### Main page structure

Today keeps one stable page structure regardless of state.

From top to bottom:

1. **Status card**
   - Shows today’s date
   - Shows city status
   - Shows weather status
2. **City prompt card**
   - Only shown when city is empty
   - Encourages the user to set a resident city
   - Does not block recommendations
3. **Recommendation area**
   - Target state is 3 outfit cards
   - If closet is empty, this area becomes an empty-state prompt to upload items
4. **Action area**
   - `换一批推荐`
   - `设置城市` or `修改城市`

### Supported page states

#### State A: Closet empty

- Show empty-state guidance
- Do not generate recommendations
- Primary action goes to `/closet`

#### State B: Closet has items, city missing

- Show 3 recommendations
- Recommendations do not use weather
- Show a lightweight prompt that setting a city improves accuracy

#### State C: Closet has items, city present, weather available

- Show 3 weather-aware recommendations
- Status card shows city and weather summary

#### State D: Closet has items, city present, weather unavailable

- Show 3 recommendations
- Fall back to non-weather logic
- Status card explains that weather is temporarily unavailable

## Interaction design

### Open Today

When the user opens `/today`:

1. Load session
2. Ensure profile exists
3. Read `profiles.city`
4. Read wardrobe items
5. If city exists, try to fetch weather
6. Generate recommendation set
7. Render the page

### Set or change city

The city interaction stays inside Today. The MVP does not need a separate settings page.

Flow:

1. User taps `设置城市` or `修改城市`
2. A small inline form or card appears on Today
3. User submits a city name
4. Save to `profiles.city`
5. Refresh Today data
6. Recompute weather and recommendations

### Refresh recommendations

`换一批推荐` means: rerun the recommendation logic for another valid set.

It does **not** mean:

- save recommendation history
- log exposure history
- create OOTD records
- persist refresh attempts

That separation is intentional. Recommendation refresh is a temporary browsing action. OOTD is a later feedback action.

## Architecture

### High-level approach

Use a server-first flow with small focused units.

- Route loads data on the server
- Weather fetch happens on the server
- Recommendation generation happens in a dedicated server-side helper
- UI remains mostly presentational
- City update uses a server action

This keeps the MVP simple, testable, and aligned with the existing app structure.

### Proposed units

#### 1. Today route loader

Responsible for orchestrating Today page data.

Inputs:
- authenticated user id

Outputs:
- closet item count
- city value
- weather status and weather summary
- recommendation list
- page state flags

Likely location:
- `app/today/page.tsx`
- or a thin route plus helper in `lib/today/get-today-view.ts`

#### 2. Weather service helper

Responsible for fetching weather only when city exists.

Inputs:
- city string

Outputs:
- normalized weather object
- or an unavailable status

Requirements:
- weather failure must not break Today
- weather response should be normalized into a small internal shape, not leaked raw into UI

#### 3. Recommendation generator

A pure or near-pure helper that turns wardrobe items and optional weather into 3 outfit recommendations.

Inputs:
- wardrobe items
- optional weather context

Outputs:
- 3 recommendation cards
- each card includes the selected pieces and one short recommendation reason

Requirements:
- no live LLM generation in MVP
- deterministic or semi-deterministic rule-based logic
- testable without browser or database

#### 4. City update action

Responsible for saving `profiles.city` from Today.

Inputs:
- user id from session
- city string from form

Outputs:
- updated city value
- trigger for Today reload

Requirements:
- validation only at the boundary
- save failure must not crash the full page

#### 5. Today presentational components

Responsible for rendering the stable Today surface.

Should likely include:
- status card
- city prompt / city form card
- recommendation card list
- empty closet state
- action row

## Data model usage

### Existing data used in MVP

From `profiles`:
- `city`

From `items`:
- `category`
- `sub_category`
- `color_category`
- `style_tags`
- optionally `wear_count` and `last_worn_date` for later phases, but not required in this MVP

### No schema change required for the core MVP

The current schema is sufficient for Today recommendation MVP.

A new schema migration is only needed if implementation later proves that recommendation persistence or weather caching is required. That is outside this spec.

## Recommendation logic

### Recommendation output target

Generate 3 recommendation cards.

Each recommendation should contain:
- a main combination of pieces
- a short reason string
- enough metadata for UI display

### Composition rules

The MVP should support these combinations:

1. **Top + bottom**
2. **Dress or one-piece as a full outfit**
3. **Optional outer layer** when weather or available inventory supports it

### Rule groups

#### Rule group 1: Base outfit assembly

- Match tops with pants or skirts
- Treat dress / one-piece items as complete base looks
- Add an outer layer only when it improves the recommendation

#### Rule group 2: Weather-aware adjustment

When weather exists:
- hot weather prefers lighter and fewer layers
- cold weather prefers longer sleeves, outerwear, or extra layers
- neutral weather keeps the default balance

When weather is absent:
- skip weather scoring entirely
- still generate valid recommendations

#### Rule group 3: Style consistency

- Prefer combinations with overlapping or compatible `style_tags`
- Missing tags must not disqualify items

#### Rule group 4: Diversity across the 3 results

- Avoid showing the exact same main pieces in multiple cards
- Minimize highly repetitive outputs in one batch

### Important non-goals

The MVP recommendation generator does not need to:
- learn user taste yet
- persist recommendation history
- optimize across past OOTD feedback
- use trend or inspiration inputs
- explain fashion theory in depth

## Weather behavior

### Weather as an enhancement, not a dependency

This is the core resilience rule.

- If city is missing, Today still works.
- If weather fetch fails, Today still works.
- If weather succeeds, recommendations become more context-aware.

### Weather UI behavior

Status card should clearly communicate one of these:
- city not set
- weather loaded
- weather temporarily unavailable

The page must never look broken just because weather is missing.

## Error handling

### Empty closet

- Show upload CTA
- Do not attempt recommendation generation

### Missing city

- Show recommendations without weather
- Show a prompt to set city

### Weather fetch failure

- Show non-blocking status message
- Fall back to non-weather recommendations

### Recommendation generation failure

- Show failure state in recommendation area
- Offer a retry action

### City save failure

- Keep the user on Today
- Preserve the page state around the form
- Show inline failure feedback near the city form

## Testing strategy

### 1. Presentational state tests

Cover at least:
- empty closet state
- closet with no city
- closet with city and weather
- closet with city and weather failure

### 2. Recommendation rule tests

Test the generator independently from UI.

Cover at least:
- generates 3 valid recommendations from a usable closet
- works with no weather
- handles dress / one-piece correctly
- reduces repeated outputs within one batch

### 3. City update tests

Cover at least:
- city save succeeds and updates profile
- save failure returns inline error behavior

### 4. Manual browser QA

Cover at least:
- empty closet user
- closet user without city
- closet user with city
- city modification flow
- weather failure fallback
- refresh recommendation flow

## Delivery boundary

### Included in this phase

- Today page structure update
- city prompt and city edit flow
- weather fetch integration
- normalized weather status
- rule-based recommendation generator
- 3 recommendation cards
- refresh recommendation action
- automated tests and browser QA

### Explicitly out of scope

- OOTD record creation
- satisfaction feedback
- recommendation history persistence
- travel mode or temporary city mode
- purchase analysis
- LLM-generated outfit recommendations
- advanced personalization from wear history

## Commit boundary

### Commit 1

Current Closet Upload completion state only.

Purpose:
- preserve the already-verified upload milestone as a clean boundary before Today work starts

### Commit 2

Today recommendation MVP only.

Purpose:
- keep Today implementation isolated from both the Closet completion work and future OOTD / purchase analysis work

## Success criteria

This phase is successful when all of the following are true:

1. A user with wardrobe items can open `/today` and see 3 recommendations.
2. A user without city can still use Today.
3. A user with city gets weather-enhanced recommendations.
4. Weather failure degrades gracefully instead of breaking the page.
5. The user can set or change city from Today.
6. `换一批推荐` produces another valid batch without persisting history.
7. Automated tests pass.
8. Browser QA confirms the golden path and fallback paths.

## Follow-on phases

### Next phase: OOTD record and satisfaction feedback

After Today MVP ships, the next phase should add:
- record what the user actually wore
- optional photo
- satisfaction score
- future recommendation input from feedback

### Later phase: Purchase analysis

After OOTD feedback exists, purchase analysis can reuse:
- wardrobe structure
- recommendation reasoning
- item compatibility signals
- future frequency / gap logic
