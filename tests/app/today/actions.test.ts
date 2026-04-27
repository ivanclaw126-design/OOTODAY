import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const eq = vi.fn(() => Promise.resolve({ error: null }))
const maybeSingle = vi.fn(() => Promise.resolve({ data: { city: 'Shanghai' } }))
const selectProfiles = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }))
const updateProfiles = vi.fn(() => ({ eq }))
const from = vi.fn((table: string) => {
  if (table === 'profiles') {
    return {
      update: updateProfiles,
      select: selectProfiles
    }
  }

  return { update: () => ({ eq }) }
})
const updateUser = vi.fn(() => Promise.resolve({ error: null }))
const getUser = vi.fn(() => Promise.resolve({ data: { user: { user_metadata: {} } } }))
const signOut = vi.fn(() => Promise.resolve({ error: null }))
const createSupabaseServerClient = vi.fn(async () => ({ from, auth: { updateUser, getUser, signOut } }))
const revalidatePath = vi.fn()
const redirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`)
})
const reportBetaIssue = vi.fn()
const trackBetaEvent = vi.fn()
const trackServerEvent = vi.fn()
const recordRecommendationInteraction = vi.fn()
const chooseTodayOotd = vi.fn()
const saveTodayOotdFeedback = vi.fn()
const replaceRecommendationSlot = vi.fn()
const applyFeedback = vi.fn()
const getPreferenceState = vi.fn()
const getClosetView = vi.fn()
const getWeather = vi.fn()
const getWeatherForTarget = vi.fn()
const generateTodayRecommendations = vi.fn()
const getCandidateModelScoreMap = vi.fn()
const getEntityModelScoreMap = vi.fn()
const getRecommendationTrendSignals = vi.fn()
const getRecommendationLearningSignals = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

vi.mock('@/lib/beta/server-telemetry', () => ({
  reportBetaIssue,
  trackBetaEvent
}))

vi.mock('@/lib/today/save-today-ootd-feedback', () => ({
  chooseTodayOotd,
  saveTodayOotdFeedback
}))

vi.mock('@/lib/today/replace-recommendation-slot', () => ({
  replaceRecommendationSlot
}))

vi.mock('@/lib/recommendation/apply-feedback', () => ({
  applyFeedback
}))

vi.mock('@/lib/recommendation/get-preference-state', () => ({
  getPreferenceState
}))

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/today/get-weather', () => ({
  getWeather,
  getWeatherForTarget
}))

vi.mock('@/lib/today/generate-recommendations', () => ({
  generateTodayRecommendations
}))

vi.mock('@/lib/recommendation/model-score-storage', () => ({
  getCandidateModelScoreMap,
  getEntityModelScoreMap
}))

vi.mock('@/lib/recommendation/get-trend-signals', () => ({
  getRecommendationTrendSignals
}))

vi.mock('@/lib/recommendation/learning-signal-storage', () => ({
  getRecommendationLearningSignals
}))

vi.mock('@/lib/analytics/server', () => ({
  trackServerEvent
}))

vi.mock('@/lib/recommendation/interactions', () => ({
  recordRecommendationInteraction
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('today actions', () => {
  beforeEach(() => {
    getSession.mockReset()
    eq.mockClear()
    maybeSingle.mockReset()
    maybeSingle.mockResolvedValue({ data: { city: 'Shanghai' } })
    selectProfiles.mockClear()
    updateProfiles.mockClear()
    from.mockClear()
    createSupabaseServerClient.mockClear()
    updateUser.mockReset()
    updateUser.mockResolvedValue({ error: null })
    getUser.mockReset()
    getUser.mockResolvedValue({ data: { user: { user_metadata: {} } } })
    signOut.mockReset()
    signOut.mockResolvedValue({ error: null })
    redirect.mockReset()
    redirect.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`)
    })
    reportBetaIssue.mockReset()
    reportBetaIssue.mockResolvedValue(undefined)
    trackBetaEvent.mockReset()
    trackBetaEvent.mockResolvedValue(undefined)
    trackServerEvent.mockReset()
    trackServerEvent.mockResolvedValue(undefined)
    recordRecommendationInteraction.mockReset()
    recordRecommendationInteraction.mockResolvedValue(undefined)
    revalidatePath.mockReset()
    chooseTodayOotd.mockReset()
    chooseTodayOotd.mockResolvedValue({ error: null, wornAt: '2026-04-21T08:00:00.000Z' })
    saveTodayOotdFeedback.mockReset()
    replaceRecommendationSlot.mockReset()
    replaceRecommendationSlot.mockReturnValue(null)
    applyFeedback.mockReset()
    applyFeedback.mockResolvedValue({ source: 'adaptive' })
    getPreferenceState.mockReset()
    getPreferenceState.mockResolvedValue({ source: 'default' })
    getClosetView.mockReset()
    getWeather.mockReset()
    getWeatherForTarget.mockReset()
    generateTodayRecommendations.mockReset()
    getCandidateModelScoreMap.mockReset()
    getCandidateModelScoreMap.mockResolvedValue({})
    getEntityModelScoreMap.mockReset()
    getEntityModelScoreMap.mockResolvedValue({})
    getRecommendationTrendSignals.mockReset()
    getRecommendationTrendSignals.mockResolvedValue([])
    getRecommendationLearningSignals.mockReset()
    getRecommendationLearningSignals.mockResolvedValue([])
  })

  it('updates the signed-in user city and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { updateTodayCityAction } = await import('@/app/today/actions')

    await expect(updateTodayCityAction({ city: 'Shanghai' })).resolves.toEqual({ error: null })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('saves today ootd feedback and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    const recommendation = {
      id: 'rec-1',
      reason: '基础组合稳定不出错',
      top: {
        id: 'top-1',
        imageUrl: null,
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '白色',
        styleTags: ['通勤']
      },
      bottom: {
        id: 'bottom-1',
        imageUrl: null,
        category: '裤装',
        subCategory: '西裤',
        colorCategory: '黑色',
        styleTags: ['通勤']
      },
      dress: null,
      outerLayer: null,
      componentScores: {
        colorHarmony: 88,
        silhouetteBalance: 80,
        layering: 70,
        focalPoint: 65,
        sceneFit: 82,
        weatherComfort: 76,
        completeness: 90,
        freshness: 72
      }
    }

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(submitTodayOotdAction({
      recommendation,
      satisfactionScore: 4,
      reasonTags: ['like_color', 'like_scene_fit']
    })).resolves.toEqual({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    expect(saveTodayOotdFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      recommendation,
      satisfactionScore: 4
    })
    expect(applyFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      rating: 4,
      reasonTags: ['like_color', 'like_scene_fit'],
      recommendationId: 'rec-1',
      recommendationSnapshot: recommendation,
      componentScores: recommendation.componentScores,
      context: 'today'
    })
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('chooses a recommendation and applies worn preference feedback', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    const recommendation = {
      id: 'rec-choose',
      reason: '基础组合稳定不出错',
      top: {
        id: 'top-1',
        imageUrl: null,
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '白色',
        styleTags: ['通勤']
      },
      bottom: null,
      dress: null,
      outerLayer: null,
      shoes: null,
      bag: null,
      accessories: [],
      targetDate: 'today',
      scene: 'work'
    }

    const { chooseTodayRecommendationAction } = await import('@/app/today/actions')

    await expect(chooseTodayRecommendationAction({ recommendation, targetDate: 'today', scene: 'work' })).resolves.toEqual({
      error: null,
      wornAt: '2026-04-21T08:00:00.000Z'
    })

    expect(chooseTodayOotd).toHaveBeenCalledWith({
      userId: 'user-1',
      recommendation
    })
    expect(applyFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      rating: 5,
      reasonTags: [],
      recommendationId: 'rec-choose',
      recommendationSnapshot: recommendation,
      componentScores: null,
      context: 'today'
    })
    expect(recordRecommendationInteraction).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'worn',
      recommendationId: 'rec-choose',
      context: expect.objectContaining({
        targetDate: 'today',
        scene: 'work',
        baseRecommendationId: 'rec-choose',
        categoryKeys: ['上衣'],
        colorKeys: ['白色']
      })
    }))
  })

  it('sanitizes malformed reason tags before preference learning and telemetry', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    const recommendation = {
      id: 'rec-1',
      reason: '基础组合稳定不出错',
      top: null,
      bottom: null,
      dress: null,
      outerLayer: null
    }

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(submitTodayOotdAction({
      recommendation,
      satisfactionScore: 5,
      reasonTags: ['like_color', 'unknown_reason', 'like_color', 42, 'dislike_comfort']
    } as unknown as Parameters<typeof submitTodayOotdAction>[0])).resolves.toEqual({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    expect(applyFeedback).toHaveBeenCalledWith(expect.objectContaining({
      reasonTags: ['like_color', 'dislike_comfort']
    }))
    expect(trackBetaEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        reasonTags: 'like_color|dislike_comfort',
        reasonTagCount: 2
      })
    }))
  })

  it('treats non-array reason tags as empty input', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    const recommendation = {
      id: 'rec-1',
      reason: '基础组合稳定不出错',
      top: null,
      bottom: null,
      dress: null,
      outerLayer: null
    }

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(submitTodayOotdAction({
      recommendation,
      satisfactionScore: 4,
      reasonTags: 'like_color'
    } as unknown as Parameters<typeof submitTodayOotdAction>[0])).resolves.toEqual({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    expect(applyFeedback).toHaveBeenCalledWith(expect.objectContaining({
      reasonTags: []
    }))
    expect(trackBetaEvent).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        reasonTags: '',
        reasonTagCount: 0
      })
    }))
  })

  it('keeps a saved ootd successful when preference learning fails', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })
    applyFeedback.mockRejectedValue(new Error('preference write failed'))

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(
      submitTodayOotdAction({
        recommendation: {
          id: 'rec-1',
          reason: '基础组合稳定不出错',
          top: null,
          bottom: null,
          dress: null,
          outerLayer: null
        },
        satisfactionScore: 4,
        reasonTags: ['like_color']
      })
    ).resolves.toEqual({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('returns duplicate error without revalidating when today is already recorded', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: '今天已经记录过穿搭了',
      wornAt: null
    })

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(
      submitTodayOotdAction({
        recommendation: {
          id: 'rec-1',
          reason: '基础组合稳定不出错',
          top: null,
          bottom: null,
          dress: null,
          outerLayer: null
        },
        satisfactionScore: 4,
        reasonTags: []
      })
    ).resolves.toEqual({
      error: '今天已经记录过穿搭了',
      wornAt: null
    })

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('returns a fresh recommendation batch without redirecting the page', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getClosetView.mockResolvedValue({
      itemCount: 2,
      items: [{ id: 'item-1' }, { id: 'item-2' }]
    })
    getWeatherForTarget.mockResolvedValue({ city: 'Shanghai', temperatureC: 18, conditionLabel: '多云', isWarm: false, isCold: false, targetDate: 'tomorrow', sourceLabel: '明天白天预报' })
    generateTodayRecommendations.mockReturnValue([{ id: 'rec-1' }, { id: 'rec-2' }])

    const { refreshTodayRecommendationsAction } = await import('@/app/today/actions')

    await expect(refreshTodayRecommendationsAction({ offset: 3, targetDate: 'tomorrow', scene: 'work' })).resolves.toEqual({
      recommendations: [{ id: 'rec-1' }, { id: 'rec-2' }],
      weatherState: {
        status: 'ready',
        targetDate: 'tomorrow',
        weather: { city: 'Shanghai', temperatureC: 18, conditionLabel: '多云', isWarm: false, isCold: false, targetDate: 'tomorrow', sourceLabel: '明天白天预报' }
      }
    })

    expect(getClosetView).toHaveBeenCalledWith('user-1', { limit: 0 })
    expect(getPreferenceState).toHaveBeenCalledWith({ userId: 'user-1' })
    expect(getWeatherForTarget).toHaveBeenCalledWith('Shanghai', 'tomorrow')
    expect(generateTodayRecommendations).toHaveBeenCalledWith(expect.objectContaining({
      items: [{ id: 'item-1' }, { id: 'item-2' }],
      weather: expect.any(Object),
      offset: 3,
      preferenceState: { source: 'default' },
      targetDate: 'tomorrow',
      scene: 'work'
    }))
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('keeps the selected recommendation locked when refreshing', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getClosetView.mockResolvedValue({
      itemCount: 4,
      items: [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }, { id: 'item-4' }]
    })
    generateTodayRecommendations.mockReturnValue([{ id: 'new-1' }, { id: 'new-2' }, { id: 'new-3' }])

    const lockedRecommendation = { id: 'locked-rec', reason: '已选择' }
    const { refreshTodayRecommendationsAction } = await import('@/app/today/actions')

    await expect(refreshTodayRecommendationsAction({
      offset: 2,
      targetDate: 'today',
      scene: null,
      lockedRecommendation: lockedRecommendation as never,
      lockedRecommendationIndex: 1
    })).resolves.toEqual({
      recommendations: [{ id: 'new-1' }, lockedRecommendation, { id: 'new-2' }],
      weatherState: { status: 'unavailable', city: 'Shanghai', targetDate: 'today' }
    })
  })

  it('replaces one recommendation slot and records the replacement interaction', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    getClosetView.mockResolvedValue({
      itemCount: 2,
      items: [{ id: 'top-1' }, { id: 'top-2' }]
    })
    const replacement = {
      id: 'rec-replacement',
      reason: '替换后更合适',
      top: { id: 'top-2', imageUrl: null, category: '上衣', subCategory: 'T恤', colorCategory: '灰色', styleTags: [] },
      bottom: null,
      dress: null,
      outerLayer: null,
      shoes: null,
      bag: null,
      accessories: []
    }
    replaceRecommendationSlot.mockReturnValue(replacement)

    const { replaceTodayRecommendationSlotAction } = await import('@/app/today/actions')

    await expect(replaceTodayRecommendationSlotAction({
      recommendation: {
        id: 'rec-base',
        reason: '基础',
        top: { id: 'top-1', imageUrl: null, category: '上衣', subCategory: '衬衫', colorCategory: '白色', styleTags: [] },
        bottom: null,
        dress: null,
        outerLayer: null,
        shoes: null,
        bag: null,
        accessories: [],
        scoreBreakdown: null
      },
      slot: 'top',
      rejectedItemIds: ['top-1'],
      reasonTags: ['dislike_item'],
      targetDate: 'today',
      scene: 'casual'
    })).resolves.toEqual({ error: null, recommendation: replacement })

    expect(recordRecommendationInteraction).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'replaced_item',
      recommendationId: 'rec-base',
      candidateId: 'rec-replacement',
      context: expect.objectContaining({
        slot: 'top',
        reasonTags: ['dislike_item'],
        replacementRecommendationId: 'rec-replacement'
      })
    }))
  })

  it('records pre-choice outfit feedback as skipped or disliked', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { submitTodayPreChoiceFeedbackAction } = await import('@/app/today/actions')

    await expect(submitTodayPreChoiceFeedbackAction({
      recommendation: {
        id: 'rec-skip',
        reason: '基础',
        top: null,
        bottom: null,
        dress: null,
        outerLayer: null,
        shoes: null,
        bag: null,
        accessories: []
      },
      scope: 'outfit',
      reasonTags: ['dislike_item', 'unknown' as never],
      targetDate: 'today',
      scene: null
    })).resolves.toEqual({ error: null })

    expect(recordRecommendationInteraction).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'disliked',
      context: expect.objectContaining({
        scope: 'outfit',
        reasonTags: ['dislike_item']
      })
    }))
  })

  it('updates the signed-in user password and records password state', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { changeTodayPasswordAction } = await import('@/app/today/actions')

    await expect(changeTodayPasswordAction({ password: 'newpass123', confirmPassword: 'newpass123' })).resolves.toEqual({
      error: null
    })

    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'newpass123',
        data: expect.objectContaining({
          password_bootstrapped: true
        })
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('signs out the current user and redirects to landing', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { signOutTodayAction } = await import('@/app/today/actions')

    await expect(signOutTodayAction()).rejects.toThrow('redirect:/')
    expect(signOut).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith('/')
  })
})
