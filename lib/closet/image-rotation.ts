export const ROTATE_RIGHT_DEGREES = 90
export const RESTORE_WINDOW_MINUTES = 30

export function getRestoreExpiresAt(now: Date) {
  return new Date(now.getTime() + RESTORE_WINDOW_MINUTES * 60 * 1000).toISOString()
}

export function isRestoreWindowActive(expiresAt: string | null | undefined, now: Date = new Date()) {
  if (!expiresAt) {
    return false
  }

  const expiresAtTime = new Date(expiresAt).getTime()

  if (Number.isNaN(expiresAtTime)) {
    return false
  }

  return expiresAtTime > now.getTime()
}

export function normalizeQuarterTurns(turns: number | null | undefined) {
  const normalized = Number(turns ?? 0)

  if (!Number.isFinite(normalized)) {
    return 0
  }

  return ((Math.trunc(normalized) % 4) + 4) % 4
}
