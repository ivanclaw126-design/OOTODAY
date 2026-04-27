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
import { mergeLockedRecommendation, saveTodayRecommendationCache } from '@/lib/today/recommendation-cache'
import { replaceRecommendationSlot } from '@/lib/today/replace-recommendation-slot'
import { chooseTodayOotd, saveTodayOotdFeedback } from '@/lib/today/save-today-ootd-feedback'
import { getWeatherForTarget } from '@/lib/today/get-weather'
import {
  TODAY_CONTEXT_SCENES,
  TODAY_TARGET_DATES,
  type TodayChooseRecommendationInput,
  type TodayChooseRecommendationResult,
  type TodayHistoryUpdateInput,
  type TodayOotdFeedbackInput,
  type TodayOotdHistoryEntry,
  type TodayPreChoiceFeedbackInput,
  type TodayRecommendationRefreshInput,
  type TodayRecommendationRefreshResult,
  type TodayReplaceableSlot,
  type TodayScene,
  type TodaySlotReplacementInput,
  type TodaySlotReplacementResult,
  type TodayTargetDate,
  type TodayWeatherState
} from '@/lib/today/types'

const todayFeedbackReasonTagSet = new Set<string>(TODAY_FEEDBACK_REASON_TAGS)
const todayTargetDateSet = new Set<string>(TODAY_TARGET_DATES)
const todaySceneSet = new Set<string>(TODAY_CONTEXT_SCENES)
const todayReplaceableSlotSet = new Set<TodayReplaceableSlot>(['top', 'bottom', 'dress', 'outerLayer', 'shoes', 'bag', 'accessories'])

const slotLabels: Record<TodayReplaceableSlot, string> = {
  top: '上装',
  bottom: '下装',
  dress: '主件',
  outerLayer: '外套',
  shoes: '鞋',
  bag: '包',
  accessories: '配饰'
}

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
      scene: null,
      lockedRecommendation: null,
      lockedRecommendationIndex: null
    }
  }

  if (!input || typeof input !== 'object') {
    return {
      offset: 0,
      targetDate: 'today',
      scene: null,
      lockedRecommendation: null,
      lockedRecommendationIndex: null
    }
  }

  return {
    offset: Number.isFinite(input.offset) ? input.offset : 0,
    targetDate: normalizeTodayTargetDate(input.targetDate),
    scene: normalizeTodayScene(input.scene),
    lockedRecommendation: input.lockedRecommendation ?? null,
    lockedRecommendationIndex: typeof input.lockedRecommendationIndex === 'number' ? input.lockedRecommendationIndex : null
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

function normalizeTodayReplaceableSlot(value: unknown): TodayReplaceableSlot | null {
  return typeof value === 'string' && todayReplaceableSlotSet.has(value as TodayReplaceableSlot) ? value as TodayReplaceableSlot : null
}

function getRecommendationItemIds(recommendation: TodayChooseRecommendationInput['recommendation']) {
  return [
    recommendation.top?.id,
    recommendation.bottom?.id,
    recommendation.dress?.id,
    recommendation.outerLayer?.id,
    recommendation.shoes?.id,
    recommendation.bag?.id,
    ...(recommendation.accessories ?? []).map((item) => item.id)
  ].filter((id): id is string => Boolean(id))
}

function getRecommendationCategoryKeys(recommendation: TodayChooseRecommendationInput['recommendation']) {
  return [
    recommendation.top?.category,
    recommendation.bottom?.category,
    recommendation.dress?.category,
    recommendation.outerLayer?.category,
    recommendation.shoes?.category,
    recommendation.bag?.category,
    ...(recommendation.accessories ?? []).map((item) => item.category)
  ].filter((value): value is string => Boolean(value))
}

function getRecommendationColorKeys(recommendation: TodayChooseRecommendationInput['recommendation']) {
  return [
    recommendation.top?.colorCategory,
    recommendation.bottom?.colorCategory,
    recommendation.dress?.colorCategory,
    recommendation.outerLayer?.colorCategory,
    recommendation.shoes?.colorCategory,
    recommendation.bag?.colorCategory,
    ...(recommendation.accessories ?? []).map((item) => item.colorCategory)
  ].filter((value): value is string => Boolean(value))
}

function buildRecommendationInteractionContext({
  recommendation,
  targetDate,
  scene,
  slot = null,
  reasonTags = [],
  baseRecommendationId = recommendation.id,
  replacementRecommendationId = null,
  extra = {}
}: {
  recommendation: TodayChooseRecommendationInput['recommendation']
  targetDate?: TodayTargetDate
  scene?: TodayScene
  slot?: TodayReplaceableSlot | null
  reasonTags?: TodayFeedbackReasonTag[]
  baseRecommendationId?: string | null
  replacementRecommendationId?: string | null
  extra?: Record<string, unknown>
}) {
  return {
    targetDate: targetDate ?? recommendation.targetDate ?? 'today',
    scene: scene === undefined ? recommendation.scene ?? null : scene,
    slot,
    reasonTags,
    formulaId: recommendation.formulaId ?? null,
    recallSource: recommendation.recallSource ?? null,
    baseRecommendationId,
    replacementRecommendationId,
    categoryKeys: getRecommendationCategoryKeys(recommendation),
    colorKeys: getRecommendationColorKeys(recommendation),
    ...extra
  }
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

export async function chooseTodayRecommendationAction({
  recommendation,
  targetDate,
  scene
}: TodayChooseRecommendationInput): Promise<TodayChooseRecommendationResult> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  try {
    const result = await chooseTodayOotd({
      userId: session.user.id,
      recommendation
    })

    if (!result.error) {
      try {
        await applyFeedback({
          userId: session.user.id,
          rating: 5,
          reasonTags: [],
          recommendationId: recommendation.id,
          recommendationSnapshot: recommendation,
          componentScores: recommendation.componentScores ?? null,
          context: 'today'
        })
      } catch {
        await reportBetaIssue({
          code: 'today_worn_preference_feedback_failed',
          surface: 'today',
          userId: session.user.id,
          recoverable: true,
          context: {
            recommendationId: recommendation.id
          }
        })
      }

      await recordRecommendationInteraction({
        userId: session.user.id,
        surface: 'today',
        eventType: 'worn',
        recommendationId: recommendation.id,
        itemIds: getRecommendationItemIds(recommendation),
        context: buildRecommendationInteractionContext({
          recommendation,
          targetDate,
          scene
        }),
        scoreBreakdown: recommendation.scoreBreakdown ?? null
      })
      revalidatePath('/today')
    }

    return result
  } catch {
    await reportBetaIssue({
      code: 'today_choose_recommendation_failed',
      surface: 'today',
      userId: session.user.id,
      recoverable: true,
      context: {
        recommendationId: recommendation.id
      }
    })
    return { error: '今天的选择没有保存成功，请稍后再试。', wornAt: null }
  }
}

export async function undoTodayRecommendationAction(): Promise<{ error: string | null }> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('ootd')
    .delete()
    .eq('user_id', session.user.id)
    .gte('worn_at', start.toISOString())
    .lt('worn_at', end.toISOString())

  if (error) {
    await reportBetaIssue({
      code: 'today_undo_choice_failed',
      surface: 'today',
      userId: session.user.id,
      recoverable: true
    })
    return { error: '撤销今日选择失败，请稍后再试。' }
  }

  await recordRecommendationInteraction({
    userId: session.user.id,
    surface: 'today',
    eventType: 'skipped',
    context: {
      source: 'undo_today_choice'
    }
  })
  revalidatePath('/today')
  return { error: null }
}

export async function submitTodayOotdAction({
  recommendation,
  satisfactionScore,
  reasonTags = [],
  targetDate,
  scene
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
        context: buildRecommendationInteractionContext({
          recommendation,
          targetDate,
          scene,
          reasonTags: normalizedReasonTags
        }),
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

export async function replaceTodayRecommendationSlotAction({
  recommendation,
  slot,
  rejectedItemIds = [],
  reasonTags = [],
  targetDate,
  scene
}: TodaySlotReplacementInput): Promise<TodaySlotReplacementResult> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const normalizedSlot = normalizeTodayReplaceableSlot(slot)
  const normalizedReasonTags = normalizeTodayFeedbackReasonTags(reasonTags)
  const normalizedTargetDate = normalizeTodayTargetDate(targetDate)
  const normalizedScene = normalizeTodayScene(scene)

  if (!normalizedSlot) {
    return { error: '暂时不支持替换这个位置。', recommendation: null }
  }

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
  const weather = city ? await getWeatherForTarget(city, normalizedTargetDate) : null
  const replacement = replaceRecommendationSlot({
    baseRecommendation: recommendation,
    slot: normalizedSlot,
    items: closet.items,
    weather,
    preferenceState,
    ...(Object.keys(modelScoreMap).length > 0 ? { modelScoreMap } : {}),
    ...(Object.keys(entityModelScoreMap).length > 0 ? { entityModelScoreMap } : {}),
    ...(trendSignals.length > 0 ? { trendSignals } : {}),
    ...(learningSignals.length > 0 ? { learningSignals } : {}),
    targetDate: normalizedTargetDate,
    scene: normalizedScene,
    rejectedItemIds: rejectedItemIds.filter((id): id is string => typeof id === 'string')
  })

  if (!replacement) {
    return { error: `暂时没有更合适的${slotLabels[normalizedSlot]}，可以试试换一套。`, recommendation: null }
  }

  await recordRecommendationInteraction({
    userId: session.user.id,
    surface: 'today',
    eventType: 'replaced_item',
    recommendationId: recommendation.id,
    candidateId: replacement.id,
    itemIds: getRecommendationItemIds(recommendation),
    context: buildRecommendationInteractionContext({
      recommendation,
      targetDate: normalizedTargetDate,
      scene: normalizedScene,
      slot: normalizedSlot,
      reasonTags: normalizedReasonTags,
      replacementRecommendationId: replacement.id,
      extra: {
        rejectedItemIds,
        replacementItemIds: getRecommendationItemIds(replacement)
      }
    }),
    scoreBreakdown: recommendation.scoreBreakdown ?? null
  })

  return { error: null, recommendation: replacement }
}

export async function submitTodayPreChoiceFeedbackAction({
  recommendation,
  scope,
  slot,
  itemIds = [],
  reasonTags,
  preferenceSignal,
  targetDate,
  scene
}: TodayPreChoiceFeedbackInput): Promise<{ error: string | null }> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const normalizedReasonTags = normalizeTodayFeedbackReasonTags(reasonTags)
  const normalizedSlot = normalizeTodayReplaceableSlot(slot)
  const signal = preferenceSignal === 'positive' || preferenceSignal === 'negative' ? preferenceSignal : 'none'
  const eventType = signal === 'positive'
    ? 'rated_good'
    : signal === 'negative'
      ? 'disliked'
      : scope === 'slot'
        ? 'replaced_item'
        : normalizedReasonTags.includes('dislike_item') || normalizedReasonTags.length >= 2
          ? 'disliked'
          : 'skipped'
  const rating = signal === 'positive' ? 4 : signal === 'negative' ? 2 : null

  try {
    if (rating !== null) {
      await applyFeedback({
        userId: session.user.id,
        rating,
        reasonTags: normalizedReasonTags,
        recommendationId: recommendation.id,
        recommendationSnapshot: recommendation,
        componentScores: recommendation.componentScores ?? null,
        context: 'today'
      })
    }

    await recordRecommendationInteraction({
      userId: session.user.id,
      surface: 'today',
      eventType,
      recommendationId: recommendation.id,
      itemIds: itemIds.filter((id): id is string => typeof id === 'string' && Boolean(id)),
      context: buildRecommendationInteractionContext({
        recommendation,
        targetDate: normalizeTodayTargetDate(targetDate),
        scene: normalizeTodayScene(scene),
        slot: normalizedSlot,
        reasonTags: normalizedReasonTags,
        extra: {
          scope,
          preferenceSignal: signal
        }
      }),
      scoreBreakdown: recommendation.scoreBreakdown ?? null,
      rating
    })

    return { error: null }
  } catch {
    await reportBetaIssue({
      code: 'today_pre_choice_feedback_failed',
      surface: 'today',
      userId: session.user.id,
      recoverable: true,
      context: {
        recommendationId: recommendation.id,
        scope
      }
    })
    return { error: '反馈没有保存成功，请稍后再试。' }
  }
}

export async function recordTodayRecommendationOpenedAction({
  recommendation,
  targetDate,
  scene,
  source
}: TodayChooseRecommendationInput & { source: 'details' | 'quick_feedback' }): Promise<{ error: string | null }> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  await recordRecommendationInteraction({
    userId: session.user.id,
    surface: 'today',
    eventType: 'opened',
    recommendationId: recommendation.id,
    itemIds: getRecommendationItemIds(recommendation),
    context: buildRecommendationInteractionContext({
      recommendation,
      targetDate,
      scene,
      extra: { source }
    }),
    scoreBreakdown: recommendation.scoreBreakdown ?? null
  })

  return { error: null }
}

export async function refreshTodayRecommendationsAction(input: number | TodayRecommendationRefreshInput): Promise<TodayRecommendationRefreshResult> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const { offset, targetDate, scene, lockedRecommendation, lockedRecommendationIndex } = normalizeTodayRefreshInput(input)
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

  const generatedRecommendations = generateTodayRecommendations({
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
  const recommendations = mergeLockedRecommendation({
    generated: generatedRecommendations,
    lockedRecommendation,
    lockedRecommendationIndex
  })

  await saveTodayRecommendationCache({
    userId: session.user.id,
    targetDate,
    scene,
    city,
    itemCount: closet.itemCount,
    weatherState,
    recommendations
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
