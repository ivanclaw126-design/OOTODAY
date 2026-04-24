import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_RECOMMENDATION_WEIGHTS } from '@/lib/recommendation/default-weights'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { savePreferenceState } from '@/lib/recommendation/save-preference-state'
import { submitQuestionnaire } from '@/lib/recommendation/submit-questionnaire'
import { applyFeedback } from '@/lib/recommendation/apply-feedback'
import { resetRecommendationPreferences } from '@/lib/recommendation/reset-preferences'
import type { RecommendationSupabaseClientLike } from '@/lib/recommendation/recommendation-supabase'
import type { RecommendationPreferenceRow } from '@/lib/recommendation/preference-state-storage'
import type { StyleQuestionnaireAnswers } from '@/lib/recommendation/preference-types'

const maybeSingle = vi.fn()
const eq = vi.fn(() => ({ maybeSingle }))
const select = vi.fn(() => ({ eq }))
const upsert = vi.fn()
const insertFeedback = vi.fn()
const from = vi.fn((table: string) => {
  if (table === 'recommendation_preferences') {
    return { select, upsert }
  }

  if (table === 'outfit_feedback_events') {
    return { insert: insertFeedback }
  }

  throw new Error(`Unexpected table: ${table}`)
})

function supabaseMock() {
  return { from } as unknown as RecommendationSupabaseClientLike
}

const questionnaireAnswers: StyleQuestionnaireAnswers = {
  scenes: ['work', 'travel'],
  silhouettes: ['shortTopHighWaist'],
  colorPalette: 'boldContrast',
  layeringComplexity: 'threeLayer',
  focalPoint: 'shoes',
  practicality: 'style',
  slots: {
    shoes: true,
    bag: true,
    accessories: true
  },
  exploration: 'bold',
  hardAvoids: ['不喜欢高跟鞋']
}

function storedPreferenceRow(overrides: Partial<RecommendationPreferenceRow> = {}): RecommendationPreferenceRow {
  return {
    user_id: 'user-1',
    version: 1000,
    source: 'questionnaire',
    default_weights: DEFAULT_RECOMMENDATION_WEIGHTS,
    questionnaire_delta: { colorHarmony: 0.02 },
    rating_delta: {},
    final_weights: DEFAULT_RECOMMENDATION_WEIGHTS,
    profile: {
      preferredScenes: ['work'],
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
    },
    questionnaire_answers: null,
    created_at: '2026-04-24T01:00:00.000Z',
    updated_at: '2026-04-24T01:00:00.000Z',
    ...overrides
  }
}

describe('recommendation preference storage helpers', () => {
  beforeEach(() => {
    maybeSingle.mockReset()
    eq.mockClear()
    select.mockClear()
    upsert.mockReset()
    insertFeedback.mockReset()
    from.mockClear()
  })

  it('returns a default preference state when the user has no stored row', async () => {
    const now = new Date('2026-04-24T02:00:00.000Z')
    maybeSingle.mockResolvedValue({ data: null, error: null })

    await expect(getPreferenceState({ userId: 'user-1', now, supabase: supabaseMock() })).resolves.toEqual(
      resetRecommendationPreferences(now)
    )

    expect(from).toHaveBeenCalledWith('recommendation_preferences')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('saves preference state with an upsert keyed by user_id', async () => {
    const state = resetRecommendationPreferences(new Date('2026-04-24T03:00:00.000Z'))
    upsert.mockResolvedValue({ data: null, error: null })

    await expect(savePreferenceState({ userId: 'user-1', state, supabase: supabaseMock() })).resolves.toEqual(state)

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        version: state.version,
        source: 'default',
        questionnaire_delta: {},
        rating_delta: {}
      }),
      { onConflict: 'user_id' }
    )
  })

  it('submits questionnaire from a fresh default state without stacking old deltas', async () => {
    const now = new Date('2026-04-24T04:00:00.000Z')
    upsert.mockResolvedValue({ data: null, error: null })

    const state = await submitQuestionnaire({
      userId: 'user-1',
      answers: questionnaireAnswers,
      now,
      supabase: supabaseMock()
    })

    expect(state.version).toBe(now.getTime())
    expect(state.source).toBe('questionnaire')
    expect(state.ratingDelta).toEqual({})
    expect(state.questionnaireDelta.focalPoint).toBeGreaterThan(0)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        version: now.getTime(),
        source: 'questionnaire',
        rating_delta: {},
        questionnaire_answers: questionnaireAnswers
      }),
      { onConflict: 'user_id' }
    )
  })

  it('applies feedback by inserting an event and updating adaptive rating deltas', async () => {
    const now = new Date('2026-04-24T05:00:00.000Z')
    maybeSingle.mockResolvedValue({ data: storedPreferenceRow(), error: null })
    insertFeedback.mockResolvedValue({ data: null, error: null })
    upsert.mockResolvedValue({ data: null, error: null })

    const state = await applyFeedback({
      userId: 'user-1',
      rating: 5,
      reasonTags: ['like_color'],
      recommendationId: 'rec-1',
      recommendationSnapshot: { id: 'rec-1' },
      componentScores: { colorHarmony: 88 },
      now,
      supabase: supabaseMock()
    })

    expect(insertFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        recommendation_id: 'rec-1',
        preference_version: 1000,
        context: 'today',
        rating: 5,
        reason_tags: ['like_color'],
        recommendation_snapshot: { id: 'rec-1' },
        component_scores: { colorHarmony: 88 },
        created_at: now.toISOString()
      })
    )
    expect(state.source).toBe('adaptive')
    expect(state.version).toBe(1000)
    expect(state.ratingDelta.colorHarmony).toBeGreaterThan(0)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        version: 1000,
        source: 'adaptive',
        rating_delta: expect.objectContaining({
          colorHarmony: expect.any(Number)
        })
      }),
      { onConflict: 'user_id' }
    )
  })
})
