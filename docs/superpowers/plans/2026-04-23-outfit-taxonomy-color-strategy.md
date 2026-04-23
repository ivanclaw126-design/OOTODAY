# Outfit Taxonomy And Color Strategy Plan

**Goal:** Turn the current closet taxonomy and lightweight color matching logic into a shared outfit-rule layer that can power Today recommendations, Shop purchase analysis, Inspiration remake guidance, and Travel packing decisions.

**Architecture:** Keep the existing category and color dictionary as the stable base, add a small set of derived visual attributes and color-intensity concepts, and layer explainable deterministic scoring on top before considering any heavier personalization.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, repo-local taxonomy dictionaries, deterministic recommendation helpers, Vitest

## File Structure

### Create

- `docs/superpowers/specs/2026-04-23-outfit-taxonomy-color-strategy-design.md`
- `docs/superpowers/plans/2026-04-23-outfit-taxonomy-color-strategy.md`

### Modify

- `lib/closet/taxonomy.ts`
- `lib/today/generate-recommendations.ts`
- `lib/today/types.ts`
- `lib/shop/analyze-purchase-candidate.ts`
- `lib/inspiration/*`
- `lib/travel/build-travel-packing-plan.ts`
- `PROGRESS.md`
- `docs/process/progress-sync.md`

## Task 1: Freeze the shared taxonomy vocabulary

- [ ] Confirm the canonical clothing dimensions beyond category/subcategory:
  - `silhouette`
  - `length_profile`
  - `visual_weight`
  - `material_profile`
  - `pattern_profile`
- [ ] Confirm which dimensions are AI-recognized first vs rule-derived later
- [ ] Expand the color dictionary with business-group semantics:
  - base colors
  - soft colors
  - high-presence colors

## Task 2: Add color-intensity and outfit-role concepts

- [x] Add `color_intensity` mapping in `lib/closet/taxonomy.ts`
- [x] Define outfit-side `color_role` logic:
  - `base`
  - `support`
  - `accent`
- [x] Keep UI-facing color labels simple while recommendation logic uses structured fields

## Task 3: Upgrade Today recommendation scoring

- [ ] Add stable scoring dimensions for:
  - base color anchor
  - color harmony
  - accent control
  - visual-weight balance
  - scene fit
- [ ] Add default preference order:
  - same-family colors
  - adjacent-family colors
  - neutral + single accent
  - controlled contrast last
- [x] Add explanation copy that maps directly to these rules

## Task 4: Reuse the same rule language in Shop, Inspiration, and Travel

- [x] Teach Shop to explain purchases using the same base/support/accent language
- [ ] Teach Inspiration to explain “why the source look works” using the same harmony rules
- [ ] Teach Travel to reason about repeatability through shared base colors and low-conflict combinations

## Task 5: Verify the product language end-to-end

- [ ] Add focused tests for the new deterministic color logic
- [ ] Verify user-facing Chinese explanations stay concise and consistent
- [ ] QA at least one representative scenario for:
  - Today daily recommendation
  - Shop buy / no-buy explanation
  - Inspiration remake explanation
  - Travel reusable packing explanation

## Follow-up

- [ ] Decide whether personal color season / skin-tone systems are worth adding after the shared rule layer is stable
- [ ] Decide whether to introduce a stronger trend layer from Xiaohongshu / Bilibili after the deterministic rule set has shipped
