import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StyleQuestionnaireAnswers } from '@/lib/recommendation/preference-types'

const getSession = vi.fn()
const ensureProfile = vi.fn()
const submitQuestionnaire = vi.fn()
const revalidatePath = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/profiles/ensure-profile', () => ({
  ensureProfile
}))

vi.mock('@/lib/recommendation/submit-questionnaire', () => ({
  submitQuestionnaire
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

const answers: StyleQuestionnaireAnswers = {
  scenes: ['work', 'travel'],
  silhouettes: ['shortTopHighWaist'],
  colorPalette: 'boldContrast',
  layeringComplexity: 'threeLayer',
  focalPoint: 'shoes',
  practicality: 'style',
  slots: {
    outerwear: true,
    shoes: true,
    bag: true,
    accessories: true
  },
  exploration: 'bold',
  hardAvoids: ['不喜欢高跟鞋']
}

describe('preferences actions', () => {
  beforeEach(() => {
    getSession.mockReset()
    ensureProfile.mockReset()
    submitQuestionnaire.mockReset()
    revalidatePath.mockReset()
  })

  it('submits the signed-in user questionnaire and revalidates preferences', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    submitQuestionnaire.mockResolvedValue({ source: 'questionnaire' })

    const { submitStyleQuestionnaireAction } = await import('@/app/preferences/actions')

    await expect(submitStyleQuestionnaireAction(answers)).resolves.toEqual({ error: null })
    expect(ensureProfile).toHaveBeenCalledWith('user-1')
    expect(submitQuestionnaire).toHaveBeenCalledWith({
      userId: 'user-1',
      answers
    })
    expect(revalidatePath).toHaveBeenCalledWith('/preferences')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('throws when signed out', async () => {
    getSession.mockResolvedValue(null)

    const { submitStyleQuestionnaireAction } = await import('@/app/preferences/actions')

    await expect(submitStyleQuestionnaireAction(answers)).rejects.toThrow('Unauthorized')
    expect(submitQuestionnaire).not.toHaveBeenCalled()
  })

  it('returns a save error when persistence fails', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    submitQuestionnaire.mockRejectedValue(new Error('database unavailable'))

    const { submitStyleQuestionnaireAction } = await import('@/app/preferences/actions')

    await expect(submitStyleQuestionnaireAction(answers)).resolves.toEqual({
      error: '风格问卷保存失败，请稍后重试'
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
