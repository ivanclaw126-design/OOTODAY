import { buildFinalWeights } from '@/lib/recommendation/build-final-weights'
import { DEFAULT_PREFERENCE_PROFILE, DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { clonePreferenceProfile } from '@/lib/recommendation/reset-preferences'
import type { PreferenceProfile, ScoreWeightKey, ScoreWeights, StyleQuestionnaireAnswers } from '@/lib/recommendation/preference-types'

function addDelta(delta: Partial<ScoreWeights>, key: ScoreWeightKey, value: number) {
  delta[key] = (delta[key] ?? 0) + value
}

function uniqueValues<TValue extends string>(values: TValue[]) {
  return [...new Set(values)]
}

function mapColorProfile(profile: PreferenceProfile, colorPalette: StyleQuestionnaireAnswers['colorPalette']) {
  profile.colorPreference.palette = colorPalette

  if (colorPalette === 'neutral') {
    profile.colorPreference.saturation = 'low'
    profile.colorPreference.contrast = 'low'
    profile.colorPreference.accentTolerance = 0
  } else if (colorPalette === 'tonal' || colorPalette === 'softColor') {
    profile.colorPreference.saturation = 'low'
    profile.colorPreference.contrast = 'medium'
    profile.colorPreference.accentTolerance = 1
  } else if (colorPalette === 'boldContrast') {
    profile.colorPreference.saturation = 'high'
    profile.colorPreference.contrast = 'high'
    profile.colorPreference.accentTolerance = 2
  } else {
    profile.colorPreference.saturation = 'medium'
    profile.colorPreference.contrast = 'medium'
    profile.colorPreference.accentTolerance = 1
  }
}

function mapExplorationProfile(profile: PreferenceProfile, exploration: StyleQuestionnaireAnswers['exploration']) {
  const map = {
    stable: { enabled: false, rate: 0.02, maxDistanceFromDailyStyle: 0.2 },
    slight: { enabled: true, rate: 0.05, maxDistanceFromDailyStyle: 0.35 },
    inspiration: { enabled: true, rate: 0.09, maxDistanceFromDailyStyle: 0.45 },
    bold: { enabled: true, rate: 0.14, maxDistanceFromDailyStyle: 0.6 }
  } satisfies Record<StyleQuestionnaireAnswers['exploration'], PreferenceProfile['exploration']>

  profile.exploration = { ...map[exploration] }
}

export function buildPreferencesFromQuestionnaire(answers: StyleQuestionnaireAnswers): {
  questionnaireDelta: Partial<ScoreWeights>
  profile: PreferenceProfile
  finalWeights: ScoreWeights
} {
  const profile = clonePreferenceProfile(DEFAULT_PREFERENCE_PROFILE)
  const questionnaireDelta: Partial<ScoreWeights> = {}

  profile.preferredScenes = uniqueValues(answers.scenes).slice(0, 2)
  profile.silhouettePreference = uniqueValues(answers.silhouettes)
  profile.focalPointPreference = answers.focalPoint
  profile.slotPreference = {
    ...profile.slotPreference,
    ...answers.slots
  }
  profile.hardAvoids = uniqueValues(answers.hardAvoids.map((avoid) => avoid.trim()).filter(Boolean))

  if (answers.scenes.includes('work')) {
    addDelta(questionnaireDelta, 'sceneFit', 0.025)
    addDelta(questionnaireDelta, 'completeness', 0.015)
  }

  if (answers.scenes.includes('travel') || answers.scenes.includes('outdoor')) {
    addDelta(questionnaireDelta, 'weatherComfort', 0.03)
    addDelta(questionnaireDelta, 'sceneFit', 0.015)
  }

  if (answers.scenes.includes('date')) {
    addDelta(questionnaireDelta, 'focalPoint', 0.025)
    addDelta(questionnaireDelta, 'completeness', 0.015)
  }

  if (answers.silhouettes.length > 0) {
    addDelta(questionnaireDelta, 'silhouetteBalance', 0.035)
  }

  mapColorProfile(profile, answers.colorPalette)

  if (answers.colorPalette === 'neutral') {
    addDelta(questionnaireDelta, 'colorHarmony', 0.025)
    addDelta(questionnaireDelta, 'focalPoint', -0.02)
  } else if (answers.colorPalette === 'tonal' || answers.colorPalette === 'softColor') {
    addDelta(questionnaireDelta, 'colorHarmony', 0.035)
  } else if (answers.colorPalette === 'boldContrast') {
    addDelta(questionnaireDelta, 'colorHarmony', 0.015)
    addDelta(questionnaireDelta, 'focalPoint', 0.035)
  } else {
    addDelta(questionnaireDelta, 'colorHarmony', 0.02)
    addDelta(questionnaireDelta, 'focalPoint', 0.015)
  }

  const layeringComplexityMap = {
    simple: 0,
    lightLayer: 1,
    threeLayer: 2,
    textureMix: 3
  } satisfies Record<StyleQuestionnaireAnswers['layeringComplexity'], PreferenceProfile['layeringPreference']['complexity']>

  profile.layeringPreference.complexity = layeringComplexityMap[answers.layeringComplexity]
  profile.layeringPreference.allowNonWeatherOuterwear = answers.layeringComplexity !== 'simple'

  if (answers.layeringComplexity === 'simple') {
    addDelta(questionnaireDelta, 'layering', -0.035)
    addDelta(questionnaireDelta, 'weatherComfort', 0.015)
  } else if (answers.layeringComplexity === 'threeLayer' || answers.layeringComplexity === 'textureMix') {
    addDelta(questionnaireDelta, 'layering', answers.layeringComplexity === 'textureMix' ? 0.05 : 0.035)
    addDelta(questionnaireDelta, 'focalPoint', 0.015)
  }

  if (answers.focalPoint === 'subtle') {
    addDelta(questionnaireDelta, 'focalPoint', -0.02)
    profile.colorPreference.accentTolerance = profile.colorPreference.accentTolerance === 2 ? 1 : profile.colorPreference.accentTolerance
  } else {
    addDelta(questionnaireDelta, 'focalPoint', 0.025)
  }

  if (answers.practicality === 'comfort') {
    profile.practicalityPreference = { comfortPriority: 3, stylePriority: 1 }
    addDelta(questionnaireDelta, 'weatherComfort', 0.035)
    addDelta(questionnaireDelta, 'sceneFit', 0.015)
    addDelta(questionnaireDelta, 'focalPoint', -0.015)
  } else if (answers.practicality === 'style') {
    profile.practicalityPreference = { comfortPriority: 1, stylePriority: 3 }
    addDelta(questionnaireDelta, 'layering', 0.025)
    addDelta(questionnaireDelta, 'focalPoint', 0.025)
    addDelta(questionnaireDelta, 'weatherComfort', -0.015)
  } else if (answers.practicality === 'weekdayComfortWeekendStyle') {
    profile.practicalityPreference = { comfortPriority: 2, stylePriority: 3 }
    addDelta(questionnaireDelta, 'sceneFit', 0.015)
    addDelta(questionnaireDelta, 'completeness', 0.015)
  } else {
    profile.practicalityPreference = { comfortPriority: 2, stylePriority: 2 }
  }

  if (profile.slotPreference.shoes || profile.slotPreference.bag || profile.slotPreference.accessories) {
    addDelta(questionnaireDelta, 'completeness', 0.02)
  }

  if (!profile.slotPreference.accessories) {
    addDelta(questionnaireDelta, 'completeness', -0.01)
  }

  mapExplorationProfile(profile, answers.exploration)

  if (answers.exploration === 'stable') {
    addDelta(questionnaireDelta, 'freshness', -0.025)
  } else if (answers.exploration === 'inspiration' || answers.exploration === 'bold') {
    addDelta(questionnaireDelta, 'freshness', answers.exploration === 'bold' ? 0.04 : 0.025)
  }

  return {
    questionnaireDelta,
    profile,
    finalWeights: buildFinalWeights(DEFAULT_RECOMMENDATION_WEIGHTS, questionnaireDelta, {})
  }
}
