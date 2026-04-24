import { describe, expect, it } from 'vitest'
import { sumScoreWeights } from '@/lib/recommendation/build-final-weights'
import { buildPreferencesFromQuestionnaire } from '@/lib/recommendation/questionnaire-map'
import type { StyleQuestionnaireAnswers } from '@/lib/recommendation/preference-types'

const baseAnswers: StyleQuestionnaireAnswers = {
  scenes: ['casual'],
  silhouettes: [],
  colorPalette: 'oneAccent',
  layeringComplexity: 'lightLayer',
  focalPoint: 'subtle',
  practicality: 'balanced',
  slots: {
    outerwear: true,
    shoes: true,
    bag: true,
    accessories: false
  },
  exploration: 'slight',
  hardAvoids: []
}

describe('buildPreferencesFromQuestionnaire', () => {
  it('maps questionnaire answers into profile and normalized weights from defaults', () => {
    const result = buildPreferencesFromQuestionnaire({
      ...baseAnswers,
      scenes: ['work', 'travel', 'date'],
      silhouettes: ['shortTopHighWaist'],
      colorPalette: 'boldContrast',
      layeringComplexity: 'textureMix',
      focalPoint: 'shoes',
      practicality: 'style',
      slots: { shoes: true, bag: true, accessories: true },
      exploration: 'bold',
      hardAvoids: ['不喜欢高跟鞋', '不喜欢高跟鞋', '  ']
    })

    expect(result.profile.preferredScenes).toEqual(['work', 'travel'])
    expect(result.profile.silhouettePreference).toEqual(['shortTopHighWaist'])
    expect(result.profile.colorPreference.palette).toBe('boldContrast')
    expect(result.profile.colorPreference.accentTolerance).toBe(2)
    expect(result.profile.layeringPreference.complexity).toBe(3)
    expect(result.profile.focalPointPreference).toBe('shoes')
    expect(result.profile.practicalityPreference).toEqual({ comfortPriority: 1, stylePriority: 3 })
    expect(result.profile.slotPreference.accessories).toBe(true)
    expect(result.profile.exploration.rate).toBe(0.14)
    expect(result.profile.hardAvoids).toEqual(['不喜欢高跟鞋'])
    expect(result.questionnaireDelta.layering).toBeGreaterThan(0)
    expect(result.questionnaireDelta.focalPoint).toBeGreaterThan(0)
    expect(sumScoreWeights(result.finalWeights)).toBeCloseTo(1, 6)
  })

  it('starts from defaults each time instead of stacking previous questionnaire results', () => {
    const first = buildPreferencesFromQuestionnaire({
      ...baseAnswers,
      colorPalette: 'boldContrast',
      practicality: 'style'
    })
    const second = buildPreferencesFromQuestionnaire({
      ...baseAnswers,
      colorPalette: 'boldContrast',
      practicality: 'style'
    })

    expect(second.questionnaireDelta).toEqual(first.questionnaireDelta)
    expect(second.finalWeights).toEqual(first.finalWeights)
  })
})
