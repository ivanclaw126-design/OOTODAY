import type { InspirationCandidateSignals, PreferenceProfile } from '@/lib/recommendation/preference-types'

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function stableSeedToUnit(seed: string) {
  let hash = 2166136261

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) / 4294967295
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase()
}

export function shouldShowInspiration({
  profile,
  deterministicValue,
  seed = 'ootoday-inspiration',
  candidateCount = 1,
  alreadyShownToday = false
}: {
  profile: PreferenceProfile
  deterministicValue?: number
  seed?: string
  candidateCount?: number
  alreadyShownToday?: boolean
}) {
  const rate = clamp01(profile.exploration.rate)

  if (!profile.exploration.enabled || rate <= 0 || candidateCount <= 0 || alreadyShownToday) {
    return false
  }

  const thresholdValue = deterministicValue === undefined
    ? stableSeedToUnit(seed)
    : clamp01(deterministicValue)

  return thresholdValue < rate
}

export function isGoodInspirationCandidate(candidate: InspirationCandidateSignals, profile: PreferenceProfile) {
  if (!profile.exploration.enabled) {
    return false
  }

  const hardAvoids = new Set(profile.hardAvoids.map(normalizeToken))
  const candidateTokens = [...(candidate.hardAvoidTags ?? []), ...(candidate.styleTags ?? [])].map(normalizeToken)

  if (candidateTokens.some((token) => hardAvoids.has(token))) {
    return false
  }

  if ((candidate.distanceFromDailyStyle ?? 0) > profile.exploration.maxDistanceFromDailyStyle) {
    return false
  }

  if ((candidate.weatherComfort ?? 100) < 50 || (candidate.sceneFit ?? 100) < 50) {
    return false
  }

  if ((candidate.colorHarmony ?? 100) < 50) {
    return false
  }

  const maxFocalPoints = profile.colorPreference.accentTolerance + 1

  if ((candidate.focalPointCount ?? 1) > maxFocalPoints) {
    return false
  }

  if ((candidate.isFormalScene || candidate.isSevereWeather) && (candidate.distanceFromDailyStyle ?? 0) > 0.12) {
    return false
  }

  return true
}

export function pickDeterministicInspirationCandidate(
  candidates: InspirationCandidateSignals[],
  profile: PreferenceProfile,
  seed = 'ootoday-inspiration-pick'
) {
  const goodCandidates = candidates.filter((candidate) => isGoodInspirationCandidate(candidate, profile))

  if (goodCandidates.length === 0) {
    return null
  }

  const index = Math.floor(stableSeedToUnit(seed) * goodCandidates.length) % goodCandidates.length
  return goodCandidates[index] ?? null
}
