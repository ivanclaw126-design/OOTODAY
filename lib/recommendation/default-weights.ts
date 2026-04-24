import type { PreferenceProfile, ScoreWeights } from '@/lib/recommendation/preference-types'

export const DEFAULT_RECOMMENDATION_WEIGHTS: ScoreWeights = {
  colorHarmony: 0.18,
  silhouetteBalance: 0.18,
  layering: 0.14,
  focalPoint: 0.12,
  sceneFit: 0.14,
  weatherComfort: 0.1,
  completeness: 0.08,
  freshness: 0.06
}

export const DEFAULT_PREFERENCE_PROFILE: PreferenceProfile = {
  preferredScenes: ['casual'],
  silhouettePreference: [],
  colorPreference: {
    saturation: 'medium',
    contrast: 'medium',
    palette: 'oneAccent',
    accentTolerance: 1
  },
  layeringPreference: {
    complexity: 1,
    allowNonWeatherOuterwear: true
  },
  focalPointPreference: 'subtle',
  practicalityPreference: {
    comfortPriority: 2,
    stylePriority: 2
  },
  slotPreference: {
    outerwear: true,
    shoes: true,
    bag: true,
    accessories: false
  },
  exploration: {
    enabled: true,
    rate: 0.06,
    maxDistanceFromDailyStyle: 0.45
  },
  hardAvoids: []
}
