# TODOs

Deferred work from `/plan-eng-review` on 2026-04-19.

## Shipped MVP Scope

### 拼图导入
**Status:** First version shipped.
**Current scope:** Users can split collage images into individual item candidates and feed them into the Closet import queue.
**Still deferred:** automatic background removal, color correction, and multi-angle merge remain specialized CV work.
**Depends on:** beta import usage data before investing in a heavier CV pipeline.

### 购买分析
**Status:** First version shipped.
**Current scope:** Shop supports product links, image URLs, and local images, then returns repeat risk, outfit count, and buy / consider / pause guidance.
**Still deferred:** affiliate partnerships, deeper e-commerce integrations, and broader non-core-fashion categories.
**Depends on:** beta validation of purchase-decision demand.

## Maintenance

### 淘宝/小红书/抖音 Scraper Maintenance
**What:** Maintain deeper product / inspiration extraction for Chinese platforms. Anti-scraping walls require ongoing work.
**Why:** Chinese users expect these platforms. Link import is key input method.
**Pros:** Larger addressable market (China-first UX).
**Cons:** Weekly maintenance, CAPTCHA handling, potential legal concerns.
**Context:** Current MVP gracefully handles failures and extracts some supported product/image inputs, but full support requires maintenance team/process.
**Depends on:** Decision to invest in China market vs. global.

### Closet Import Performance
**What:** Split low-frequency import and image-processing paths into lazy client modules.
**Why:** Closet remains the largest high-frequency client island because upload, link import, collage splitting, edit, and reanalysis live close together.
**Pros:** Lighter first render for beta users who mostly browse existing wardrobe.
**Cons:** More component boundaries and loading states to maintain.
**Depends on:** beta usage data and bundle budget after first tester round.

## Post-Validation

### Mobile App (React Native)
**What:** Native mobile app for broader distribution after V1 validation succeeds.
**Why:** Web-first bypasses app store friction for MVP. Mobile expands reach post-validation.
**Pros:** App store distribution, push notifications, camera integration.
**Cons:** Separate codebase maintenance, app store approval process.
**Context:** Binding decision: web-first for MVP. Mobile considered for V2.
**Depends on:** V1 validation succeeds (50 users, >25% 30-day retention).

### Browser Geolocation
**What:** Replace manual city input with automatic GPS-based location for weather.
**Why:** Lower friction, better UX for travel scenarios.
**Pros:** Automatic, handles travel without manual update.
**Cons:** Permission prompt friction, privacy concerns, mobile-first feature.
**Context:** V1 uses manual city input to avoid browser permission friction.
**Depends on:** Mobile app implementation.

### Deployment Auth QA
**What:** Verify deployed magic link, default password login, changed password login, and bootstrap route splitting.
**Why:** Local and automated auth coverage exists, but provider email and deployed callback URLs are environment-sensitive.
**Pros:** Catches the main production-only beta risk before inviting testers.
**Cons:** Requires deployed environment and real inbox checks.
**Depends on:** active deployment URL and test account access.

### Cross-Page Language QA
**What:** Review Today, Shop, Looks, and Travel color-strategy explanations for consistent wording.
**Why:** Shared deterministic helpers are wired, but user-facing language still needs a coherent product voice pass.
**Pros:** Better perceived intelligence and less duplicated explanation language.
**Cons:** Manual QA pass across representative scenarios.
**Depends on:** stable taxonomy / color rule layer.

## V3 Features

### AI试穿
**What:** Virtual try-on showing user's body with selected outfit.
**Why:** Pre-purchase confidence, differentiator from existing wardrobe apps.
**Pros:** Unique feature, high marketing potential.
**Cons:** Requires body estimation, garment overlay ML, significant compute cost.
**Context:** Planning doc lists as V3. Requires ML pipeline beyond V1/V2 scope.
**Depends on:** V2 validation, ML expertise/partnership, compute budget.
