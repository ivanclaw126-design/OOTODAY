# Progress Sync Workflow

> Purpose: keep a lightweight repo-local recovery path when native Gstack or Superpowers context is unavailable.

## Source Of Truth

- `PROGRESS.md` is the canonical project status file.
- Superpowers specs/plans remain the source for design and execution detail.
- Gstack `/context-save` and `/context-restore` remain the primary save/restore path for session delta.

## Session Start Checklist

1. Read `PROGRESS.md`.
2. Read only the incomplete or recently modified `docs/superpowers/plans/*.md`.
3. Run Gstack `/context-restore` when available.
4. Read only the latest checkpoint from `.gstack-meta/checkpoints/*.md` or `~/.gstack/projects/OOTODAY/checkpoints/*.md`.
5. Read this file's snapshot only if native Gstack restore failed or checkpoint context is missing.

## Session Close Checklist

1. Update `PROGRESS.md` if stable project status changed.
2. Update any touched Superpowers plans so checkboxes match reality.
3. Run Gstack `/context-save` once per independently recoverable work batch, not for every micro-iteration.
4. Refresh the short snapshot below only as a mirror and fallback index.

## Checkpoint Writing Rules

- Keep checkpoints incremental: only record what changed in this work batch.
- Preferred structure:
  - `Summary`
  - `Verification`
  - `Open items`
  - `Refs`
- Target 15-30 lines per checkpoint.
- Do not restate project-wide background, already-shipped capabilities, or items already stabilized in `PROGRESS.md`.
- Archive superseded or duplicate checkpoints under `checkpoints/archive/` so default reading stays short.

## Latest Sync Snapshot

- Date: 2026-04-27
- Branch / theme: Supabase Phone OTP auth
- Latest checkpoint: not created in-session; this snapshot is the repo-local fallback mirror.
- Current blocker: no code blocker; still need deployment env vars plus a real Supabase Send SMS Hook / Aliyun PNVS smoke.
- Next plan to read: none for this auth batch.
- Intended summary if `/context-save` fails: Added phone verification-code login on Landing with country-code selector defaulting to `+86`, client-side `signInWithOtp({ phone })`, 6-digit `verifyOtp({ phone, token, type: 'sms' })`, loading/error states, resend countdown, duplicate-send prevention, and post-login routing to `/today` for existing profiles or `/closet?onboarding=1` for new profiles. Added `profiles.phone` migration and applied it remotely as `20260427183000`; profile upsert writes phone while authorization continues to rely on `auth.uid()`. Added Supabase Auth Send SMS Hook endpoint `/api/auth/send-sms`, verified via Standard Webhooks secret, extracting `user.phone` and `sms.otp`, allowing only `+86`, mapping `+86138...` to `CountryCode=86` and `PhoneNumber=138...`, and calling Aliyun PNVS `SendSmsVerifyCode` with `TemplateParam={"code": token, "min": "5"}` without calling Aliyun verification. Verification passed with `npm run lint`, `npm test` (80 files, 392 tests), `npm run build`, and remote `supabase migration list`.

## Snapshot Template

```md
## Latest Sync Snapshot

- Date: YYYY-MM-DD
- Branch / theme: ...
- Latest checkpoint: ...
- Current blocker: ...
- Next plan to read: ...
- Intended summary if /context-save fails: ...
```
