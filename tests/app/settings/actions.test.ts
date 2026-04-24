import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const ensureProfile = vi.fn()
const savePreferenceState = vi.fn()
const revalidatePath = vi.fn()
const redirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`)
})

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/profiles/ensure-profile', () => ({
  ensureProfile
}))

vi.mock('@/lib/recommendation/save-preference-state', () => ({
  savePreferenceState
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('settings actions', () => {
  beforeEach(() => {
    getSession.mockReset()
    ensureProfile.mockReset()
    savePreferenceState.mockReset()
    revalidatePath.mockReset()
    redirect.mockReset()
    redirect.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`)
    })
  })

  it('resets recommendation preferences for the signed-in user', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    savePreferenceState.mockResolvedValue({ source: 'default' })

    const { resetRecommendationPreferencesAction } = await import('@/app/settings/actions')

    await expect(resetRecommendationPreferencesAction()).resolves.toEqual({ error: null })
    expect(ensureProfile).toHaveBeenCalledWith('user-1')
    expect(savePreferenceState).toHaveBeenCalledWith({
      userId: 'user-1',
      state: expect.objectContaining({
        source: 'default',
        questionnaireDelta: {},
        ratingDelta: {}
      }),
      questionnaireAnswers: null
    })
    expect(revalidatePath).toHaveBeenCalledWith('/settings')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
    expect(revalidatePath).toHaveBeenCalledWith('/preferences')
  })

  it('throws when reset is requested by a signed-out user', async () => {
    getSession.mockResolvedValue(null)

    const { resetRecommendationPreferencesAction } = await import('@/app/settings/actions')

    await expect(resetRecommendationPreferencesAction()).rejects.toThrow('Unauthorized')
    expect(savePreferenceState).not.toHaveBeenCalled()
  })

  it('resets preferences before redirecting to the questionnaire', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    savePreferenceState.mockResolvedValue({ source: 'default' })

    const { restartStyleQuestionnaireAction } = await import('@/app/settings/actions')

    await expect(restartStyleQuestionnaireAction()).rejects.toThrow('redirect:/preferences')
    expect(savePreferenceState).toHaveBeenCalledWith({
      userId: 'user-1',
      state: expect.objectContaining({
        source: 'default',
        questionnaireDelta: {},
        ratingDelta: {}
      }),
      questionnaireAnswers: null
    })
    expect(redirect).toHaveBeenCalledWith('/preferences')
  })

  it('returns an error instead of redirecting when restart reset fails', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    savePreferenceState.mockRejectedValue(new Error('database unavailable'))

    const { restartStyleQuestionnaireAction } = await import('@/app/settings/actions')

    await expect(restartStyleQuestionnaireAction()).resolves.toEqual({
      error: '进入风格问卷失败，请稍后重试'
    })
    expect(redirect).not.toHaveBeenCalled()
  })
})
