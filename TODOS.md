# TODOs

Deferred work from `/plan-eng-review` on 2026-04-19.

## V2 Features

### 拼图导入
**What:** Split collage images into individual items, auto-remove background, color correction, merge multi-angle photos.
**Why:** Key differentiator from competitors. Reduces upload friction for users who screenshot outfit collages.
**Pros:** Faster wardrobe building, unique feature.
**Cons:** Requires specialized models (image segmentation, background removal). Maintenance overhead.
**Context:** Design doc lists as "特色能力". Deferred due to ML complexity beyond GPT-4V.
**Depends on:** V1 validation (50 users), decision to invest in specialized CV pipeline.

### 购买分析
**What:** Import product URL → analyze compatibility with wardrobe → suggest buy/don't-buy.
**Why:** Monetization path (affiliate commissions). Completes "decide what to buy" loop.
**Pros:** Revenue potential, high-value feature for purchase-decision users.
**Cons:** Requires e-commerce integration maintenance. Affiliate partnerships needed.
**Context:** Moved from V1 MVP during `/office-hours` scope reduction.
**Depends on:** V1 validation, affiliate partnership negotiation.

## Maintenance

### 淘宝/小红书/抖音 Scraper Maintenance
**What:** Maintain product scrapers for Chinese e-commerce platforms. Anti-scraping walls require ongoing work.
**Why:** Chinese users expect these platforms. Link import is key input method.
**Pros:** Larger addressable market (China-first UX).
**Cons:** Weekly maintenance, CAPTCHA handling, potential legal concerns.
**Context:** Outside voice flagged aggressive anti-scraping. V1 gracefully handles failures, but full support requires maintenance team/process.
**Depends on:** Decision to invest in China market vs. global.

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

## V3 Features

### AI试穿
**What:** Virtual try-on showing user's body with selected outfit.
**Why:** Pre-purchase confidence, differentiator from existing wardrobe apps.
**Pros:** Unique feature, high marketing potential.
**Cons:** Requires body estimation, garment overlay ML, significant compute cost.
**Context:** Planning doc lists as V3. Requires ML pipeline beyond V1/V2 scope.
**Depends on:** V2 validation, ML expertise/partnership, compute budget.