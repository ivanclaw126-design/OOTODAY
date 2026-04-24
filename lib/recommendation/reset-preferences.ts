import { buildFinalWeights } from '@/lib/recommendation/build-final-weights'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import type { PreferenceProfile, RecommendationPreferenceState, ScoreWeights } from '@/lib/recommendation/preference-types'

export function cloneScoreWeights(weights: ScoreWeights): ScoreWeights {
  return { ...weights }
}

export function clonePreferenceProfile(profile: PreferenceProfile): PreferenceProfile {
  return {
    ...profile,
    preferredScenes: [...profile.preferredScenes],
    silhouettePreference: [...profile.silhouettePreference],
    colorPreference: { ...profile.colorPreference },
    layeringPreference: { ...profile.layeringPreference },
    focalPointPreference: profile.focalPointPreference,
    practicalityPreference: { ...profile.practicalityPreference },
    slotPreference: { ...profile.slotPreference },
    exploration: { ...profile.exploration },
    hardAvoids: [...profile.hardAvoids]
  }
}

export function resetRecommendationPreferences(now = new Date()): RecommendationPreferenceState {
  const timestamp = now.toISOString()
  const defaultWeights = cloneScoreWeights(DEFAULT_RECOMMENDATION_WEIGHTS)

  return {
    version: now.getTime(),
    source: 'default',
    defaultWeights,
    questionnaireDelta: {},
    ratingDelta: {},
    finalWeights: buildFinalWeights(defaultWeights, {}, {}),
    profile: clonePreferenceProfile(DEFAULT_PREFERENCE_PROFILE),
    createdAt: timestamp,
    updatedAt: timestamp
  }
}
