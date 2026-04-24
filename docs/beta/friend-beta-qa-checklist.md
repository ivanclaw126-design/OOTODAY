# Friend Beta QA Checklist

> Goal: verify the first-run loop before inviting 5-10 friends.

## Golden Flow

- [ ] Open Landing while signed out and confirm the three-step beta path is visible.
- [ ] Send a login link or sign in with password.
- [ ] Confirm a signed-in account with `0` closet items lands on `/closet?onboarding=1`.
- [ ] Import one real clothing item through upload or image URL.
- [ ] Confirm the save success state offers a clear CTA to Today.
- [ ] Open Today and confirm recommendations render without a hard dependency on city/weather.
- [ ] Submit one OOTD satisfaction score.
- [ ] Confirm Today locks the other recommendations and shows the recorded state.
- [ ] Open the feedback entrypoint from the app shell or Today/Closet surface.

## Failure Flow

- [ ] Try one invalid image URL and confirm the import failure is recoverable.
- [ ] Confirm the failure path still exposes feedback/reporting.
- [ ] Disable or omit `WEATHER_API_KEY` locally and confirm Today still renders fallback recommendations.
- [ ] Confirm telemetry/reporting failures do not block the user flow.

## Mobile Pass

- [ ] Test Landing, Closet onboarding, Today recommendations, and OOTD feedback at a mobile viewport.
- [ ] Confirm the fixed bottom nav highlights the current tab and does not block primary CTAs.
- [ ] Confirm image cards remain tappable and there is no horizontal scrolling.

## Verification Commands

```bash
npm run lint
npm test
npm run build
```

## Browser Smoke Evidence

Record the date, environment, and result of each smoke run here.

- 2026-04-24 local dev: empty-account bootstrap, image URL import, Today recommendation, OOTD 4/5 feedback, mobile/desktop responsive screenshots passed.
