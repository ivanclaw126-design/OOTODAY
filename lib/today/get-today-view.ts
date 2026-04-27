import { getClosetView } from '@/lib/closet/get-closet-view'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { getRecommendationLearningSignals } from '@/lib/recommendation/learning-signal-storage'
import { getCandidateModelScoreMap, getEntityModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { getRecommendationTrendSignals } from '@/lib/recommendation/get-trend-signals'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { getRecentOotdHistory } from '@/lib/today/get-recent-ootd-history'
import { getTodayOotdStatus } from '@/lib/today/get-today-ootd-status'
import { getWeatherForTarget } from '@/lib/today/get-weather'
import type { TodayScene, TodayTargetDate, TodayView } from '@/lib/today/types'

export async function getTodayView({
  userId,
  city,
  accountEmail,
  passwordBootstrapped,
  passwordChangedAt,
  offset = 0,
  targetDate = 'today',
  scene = null
}: {
  userId: string
  city: string | null
  accountEmail: string | null
  passwordBootstrapped: boolean
  passwordChangedAt: string | null
  offset?: number
  targetDate?: TodayTargetDate
  scene?: TodayScene
}): Promise<TodayView> {
  const [closet, ootdStatus, recentOotdHistory, preferenceState, modelScoreMap, entityModelScoreMap, trendSignals, learningSignals] = await Promise.all([
    getClosetView(userId, { limit: 0 }),
    getTodayOotdStatus(userId),
    getRecentOotdHistory(userId),
    getPreferenceState({ userId }),
    getCandidateModelScoreMap({ userId, surface: 'today' }),
    getEntityModelScoreMap({ userId, surface: 'today' }),
    getRecommendationTrendSignals(),
    getRecommendationLearningSignals({ userId, surface: 'today' })
  ])
  const hasCompletedStyleQuestionnaire = preferenceState.hasQuestionnaireAnswers === true
  const recommendationSignalParams = {
    ...(Object.keys(modelScoreMap).length > 0 ? { modelScoreMap } : {}),
    ...(Object.keys(entityModelScoreMap).length > 0 ? { entityModelScoreMap } : {}),
    ...(trendSignals.length > 0 ? { trendSignals } : {}),
    ...(learningSignals.length > 0 ? { learningSignals } : {})
  }

  if (closet.itemCount === 0) {
    return {
      itemCount: 0,
      city,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      targetDate,
      scene,
      weatherState: city ? { status: 'unavailable', city, targetDate } : { status: 'not-set', targetDate },
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
      targetDate,
      scene,
      weatherState: { status: 'not-set', targetDate },
      recommendations: generateTodayRecommendations({
        items: closet.items,
        weather: null,
        offset,
        preferenceState,
        targetDate,
        scene,
        ...recommendationSignalParams
      }),
      recommendationError: false,
      ootdStatus,
      recentOotdHistory
    }
  }

  const weather = await getWeatherForTarget(city, targetDate)

  if (!weather) {
    return {
      itemCount: closet.itemCount,
      city,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
      hasCompletedStyleQuestionnaire,
      targetDate,
      scene,
      weatherState: { status: 'unavailable', city, targetDate },
      recommendations: generateTodayRecommendations({
        items: closet.items,
        weather: null,
        offset,
        preferenceState,
        targetDate,
        scene,
        ...recommendationSignalParams
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
    targetDate,
    scene,
    weatherState: { status: 'ready', weather, targetDate },
    recommendations: generateTodayRecommendations({
      items: closet.items,
      weather,
      offset,
      preferenceState,
      targetDate,
      scene,
      ...recommendationSignalParams
    }),
    recommendationError: false,
    ootdStatus,
    recentOotdHistory
  }
}
