import { getClosetView } from '@/lib/closet/get-closet-view'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { getCandidateModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { getRecentOotdHistory } from '@/lib/today/get-recent-ootd-history'
import { getTodayOotdStatus } from '@/lib/today/get-today-ootd-status'
import { getWeather } from '@/lib/today/get-weather'
import type { TodayView } from '@/lib/today/types'

export async function getTodayView({
  userId,
  city,
  accountEmail,
  passwordBootstrapped,
  passwordChangedAt,
  offset = 0
}: {
  userId: string
  city: string | null
  accountEmail: string | null
  passwordBootstrapped: boolean
  passwordChangedAt: string | null
  offset?: number
}): Promise<TodayView> {
  const [closet, ootdStatus, recentOotdHistory, preferenceState, modelScoreMap] = await Promise.all([
    getClosetView(userId, { limit: 0 }),
    getTodayOotdStatus(userId),
    getRecentOotdHistory(userId),
    getPreferenceState({ userId }),
    getCandidateModelScoreMap({ userId, surface: 'today' })
  ])
  const hasCompletedStyleQuestionnaire = preferenceState.hasQuestionnaireAnswers === true
  const modelScoreParam = Object.keys(modelScoreMap).length > 0 ? { modelScoreMap } : {}

  if (closet.itemCount === 0) {
    return {
      itemCount: 0,
      city,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      weatherState: city ? { status: 'unavailable', city } : { status: 'not-set' },
      recommendations: [],
      recommendationError: false,
      ootdStatus,
      recentOotdHistory
    }
  }

  if (!city) {
    return {
      itemCount: closet.itemCount,
      city: null,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      weatherState: { status: 'not-set' },
      recommendations: generateTodayRecommendations({
        items: closet.items,
        weather: null,
        offset,
        preferenceState,
        ...modelScoreParam
      }),
      recommendationError: false,
      ootdStatus,
      recentOotdHistory
    }
  }

  const weather = await getWeather(city)

  if (!weather) {
    return {
      itemCount: closet.itemCount,
      city,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      weatherState: { status: 'unavailable', city },
      recommendations: generateTodayRecommendations({
        items: closet.items,
        weather: null,
        offset,
        preferenceState,
        ...modelScoreParam
      }),
      recommendationError: false,
      ootdStatus,
      recentOotdHistory
    }
  }

  return {
    itemCount: closet.itemCount,
    city,
    accountEmail,
    passwordBootstrapped,
    passwordChangedAt,
    hasCompletedStyleQuestionnaire,
    weatherState: { status: 'ready', weather },
    recommendations: generateTodayRecommendations({
      items: closet.items,
      weather,
      offset,
      preferenceState,
      ...modelScoreParam
    }),
    recommendationError: false,
    ootdStatus,
    recentOotdHistory
  }
}
