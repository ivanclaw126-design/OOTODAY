'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { trackServerEvent } from '@/lib/analytics/server'
import { getSession } from '@/lib/auth/get-session'
import { reportBetaIssue, trackBetaEvent } from '@/lib/beta/server-telemetry'
import { validatePassword } from '@/lib/auth/password'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { applyFeedback } from '@/lib/recommendation/apply-feedback'
import { getPreferenceState } from '@/lib/recommendation/get-preference-state'
import { recordRecommendationInteraction } from '@/lib/recommendation/interactions'
import { getRecommendationLearningSignals } from '@/lib/recommendation/learning-signal-storage'
import { getCandidateModelScoreMap, getEntityModelScoreMap } from '@/lib/recommendation/model-score-storage'
import { getRecommendationTrendSignals } from '@/lib/recommendation/get-trend-signals'
import { TODAY_FEEDBACK_REASON_TAGS, type TodayFeedbackReasonTag } from '@/lib/recommendation/preference-types'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { saveTodayOotdFeedback } from '@/lib/today/save-today-ootd-feedback'
import { getWeatherForTarget } from '@/lib/today/get-weather'
import {
  TODAY_CONTEXT_SCENES,
  TODAY_TARGET_DATES,
  type TodayHistoryUpdateInput,
  type TodayOotdFeedbackInput,
  type TodayOotdHistoryEntry,
  type TodayRecommendationRefreshInput,
  type TodayRecommendationRefreshResult,
  type TodayScene,
  type TodayTargetDate,
  type TodayWeatherState
} from '@/lib/today/types'

const todayFeedbackReasonTagSet = new Set<string>(TODAY_FEEDBACK_REASON_TAGS)
const todayTargetDateSet = new Set<string>(TODAY_TARGET_DATES)
const todaySceneSet = new Set<string>(TODAY_CONTEXT_SCENES)

function normalizeTodayTargetDate(value: unknown): TodayTargetDate {
  return typeof value === 'string' && todayTargetDateSet.has(value) ? value as TodayTargetDate : 'today'
}

function normalizeTodayScene(value: unknown): TodayScene {
  return typeof value === 'string' && todaySceneSet.has(value) ? value as TodayScene : null
}

function normalizeTodayRefreshInput(input: number | TodayRecommendationRefreshInput): Required<TodayRecommendationRefreshInput> {
  if (typeof input === 'number') {
    return {
      offset: input,
      targetDate: 'today',
      scene: null
    }
  }

  if (!input || typeof input !== 'object') {
    return {
      offset: 0,
      targetDate: 'today',
      scene: null
    }
  }

  return {
    offset: Number.isFinite(input.offset) ? input.offset : 0,
    targetDate: normalizeTodayTargetDate(input.targetDate),
    scene: normalizeTodayScene(input.scene)
  }
}

function normalizeTodayFeedbackReasonTags(value: unknown): TodayFeedbackReasonTag[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized: TodayFeedbackReasonTag[] = []

  value.forEach((tag) => {
    if (typeof tag === 'string' && todayFeedbackReasonTagSet.has(tag) && !normalized.includes(tag as TodayFeedbackReasonTag)) {
      normalized.push(tag as TodayFeedbackReasonTag)
    }
  })

  return normalized
}

export async function updateTodayCityAction({ city }: { city: string }) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const normalizedCity = city.trim()

  if (!normalizedCity) {
    return { error: '城市不能为空' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('profiles').update({ city: normalizedCity }).eq('id', session.user.id)

  if (error) {
    await reportBetaIssue({
      code: 'today_city_update_failed',
      surface: 'today',
      userId: session.user.id,
      recoverable: true
    })
    return { error: '城市保存失败，请稍后重试' }
  }

  revalidatePath('/today')
  return { error: null }
}

export async function submitTodayOotdAction({
  recommendation,
  satisfactionScore,
  reasonTags = []
}: TodayOotdFeedbackInput) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const normalizedReasonTags = normalizeTodayFeedbackReasonTags(reasonTags)

  const result = await saveTodayOotdFeedback({
    userId: session.user.id,
    recommendation,
    satisfactionScore
  })

  if (!result.error) {
    try {
      await applyFeedback({
        userId: session.user.id,
        rating: satisfactionScore,
        reasonTags: normalizedReasonTags,
        recommendationId: recommendation.id,
        recommendationSnapshot: recommendation,
        componentScores: recommendation.componentScores ?? null,
        context: 'today'
      })
      await recordRecommendationInteraction({
        userId: session.user.id,
        surface: 'today',
        eventType: satisfactionScore >= 4 ? 'rated_good' : 'disliked',
        recommendationId: recommendation.id,
        itemIds: [
          recommendation.top?.id,
          recommendation.bottom?.id,
          recommendation.dress?.id,
          recommendation.outerLayer?.id,
          recommendation.shoes?.id,
          recommendation.bag?.id,
          ...(recommendation.accessories ?? []).map((item) => item.id)
        ].filter((id): id is string => Boolean(id)),
        context: {
          reasonTags: normalizedReasonTags,
          targetDate: recommendation.targetDate ?? 'today',
          scene: recommendation.scene ?? null,
          formulaId: recommendation.formulaId ?? null,
          recallSource: recommendation.recallSource ?? null,
          categoryKeys: [
            recommendation.top?.category,
            recommendation.bottom?.category,
            recommendation.dress?.category,
            recommendation.outerLayer?.category,
            recommendation.shoes?.category,
            recommendation.bag?.category,
            ...(recommendation.accessories ?? []).map((item) => item.category)
          ].filter((value): value is string => Boolean(value)),
          colorKeys: [
            recommendation.top?.colorCategory,
            recommendation.bottom?.colorCategory,
            recommendation.dress?.colorCategory,
            recommendation.outerLayer?.colorCategory,
            recommendation.shoes?.colorCategory,
            recommendation.bag?.colorCategory,
            ...(recommendation.accessories ?? []).map((item) => item.colorCategory)
          ].filter((value): value is string => Boolean(value))
        },
        scoreBreakdown: recommendation.scoreBreakdown ?? null,
        rating: satisfactionScore
      })
    } catch {
      await reportBetaIssue({
        code: 'today_preference_feedback_failed',
        surface: 'today',
        userId: session.user.id,
        recoverable: true,
        context: {
          recommendationId: recommendation.id,
          reasonTagCount: normalizedReasonTags.length
        }
      })
    }

    await trackBetaEvent({
      event: 'ootd_submitted',
      surface: 'today',
      userId: session.user.id,
      metadata: {
        satisfactionScore,
        reasonTags: normalizedReasonTags.join('|'),
        reasonTagCount: normalizedReasonTags.length
      }
    })
    revalidatePath('/today')
  } else {
    await reportBetaIssue({
      code: 'today_ootd_submit_failed',
      surface: 'today',
      userId: session.user.id,
      recoverable: true,
      context: {
        hasRecommendation: Boolean(recommendation.id)
      }
    })
  }

  return result
}

export async function refreshTodayRecommendationsAction(input: number | TodayRecommendationRefreshInput): Promise<TodayRecommendationRefreshResult> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const { offset, targetDate, scene } = normalizeTodayRefreshInput(input)
  const supabase = await createSupabaseServerClient()
  const [{ data: profile }, closet, preferenceState, modelScoreMap, entityModelScoreMap, trendSignals, learningSignals] = await Promise.all([
    supabase.from('profiles').select('city').eq('id', session.user.id).maybeSingle(),
    getClosetView(session.user.id, { limit: 0 }),
    getPreferenceState({ userId: session.user.id }),
    getCandidateModelScoreMap({ userId: session.user.id, surface: 'today', supabase }),
    getEntityModelScoreMap({ userId: session.user.id, surface: 'today', supabase }),
    getRecommendationTrendSignals({ supabase }),
    getRecommendationLearningSignals({ userId: session.user.id, surface: 'today', supabase })
  ])

  const city = profile?.city ?? null

  if (closet.itemCount === 0) {
    return {
      recommendations: [],
      weatherState: city ? { status: 'unavailable', city, targetDate } : { status: 'not-set', targetDate }
    }
  }

  const weather = city ? await getWeatherForTarget(city, targetDate) : null
  const weatherState: TodayWeatherState = weather
    ? { status: 'ready', weather, targetDate }
    : city
      ? { status: 'unavailable', city, targetDate }
      : { status: 'not-set', targetDate }

  const recommendations = generateTodayRecommendations({
    items: closet.items,
    weather,
    offset,
    preferenceState,
    targetDate,
    scene,
    ...(Object.keys(modelScoreMap).length > 0 ? { modelScoreMap } : {}),
    ...(Object.keys(entityModelScoreMap).length > 0 ? { entityModelScoreMap } : {}),
    ...(trendSignals.length > 0 ? { trendSignals } : {}),
    ...(learningSignals.length > 0 ? { learningSignals } : {})
  })

  await trackServerEvent({
    userId: session.user.id,
    eventName: 'today_recommendation_refreshed',
    module: 'today',
    route: '/today',
    properties: {
      offset,
      targetDate,
      scene,
      recommendationCount: recommendations.length,
      itemCount: closet.itemCount,
      weatherAvailable: Boolean(weather)
    }
  })

  return { recommendations, weatherState }
}

export async function changeTodayPasswordAction({
  password,
  confirmPassword
}: {
  password: string
  confirmPassword: string
}) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const passwordError = validatePassword(password)

  if (passwordError) {
    return { error: passwordError }
  }

  if (password !== confirmPassword) {
    return { error: '两次输入的密码不一致' }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const { error: updateUserError } = await supabase.auth.updateUser({
    password,
    data: {
      ...(user?.user_metadata ?? {}),
      password_bootstrapped: true,
      password_changed_at: new Date().toISOString()
    }
  })

  if (updateUserError) {
    return { error: '密码修改失败，请稍后重试' }
  }

  revalidatePath('/today')
  return { error: null }
}

export async function signOutTodayAction() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  redirect('/')
}

export async function updateTodayHistoryEntryAction({
  ootdId,
  satisfactionScore,
  notes
}: TodayHistoryUpdateInput): Promise<{ error: string | null; entry: TodayOotdHistoryEntry | null }> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const normalizedNotes = notes.trim()
  const normalizedScore =
    satisfactionScore === null || satisfactionScore === undefined ? null : Number.parseInt(String(satisfactionScore), 10)

  if (normalizedScore !== null && (!Number.isInteger(normalizedScore) || normalizedScore < 1 || normalizedScore > 5)) {
    return { error: '满意度需要在 1 到 5 分之间', entry: null }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('ootd')
    .update({
      satisfaction_score: normalizedScore,
      notes: normalizedNotes || null
    })
    .eq('user_id', session.user.id)
    .eq('id', ootdId)
    .select('id, worn_at, satisfaction_score, notes')
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return { error: '这条穿搭记录没有找到', entry: null }
  }

  revalidatePath('/today')

  return {
    error: null,
    entry: {
      id: data.id,
      wornAt: data.worn_at,
      satisfactionScore: data.satisfaction_score,
      notes: data.notes
    }
  }
}

export async function deleteTodayHistoryEntryAction({
  ootdId
}: {
  ootdId: string
}): Promise<{ error: string | null }> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('ootd').delete().eq('user_id', session.user.id).eq('id', ootdId)

  if (error) {
    throw error
  }

  revalidatePath('/today')
  return { error: null }
}
