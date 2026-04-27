import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'
import type { TodayRecommendation, TodayScene, TodayTargetDate, TodayWeatherState } from '@/lib/today/types'

const DEFAULT_SCENE_KEY = 'default'

function sceneKey(scene: TodayScene) {
  return scene ?? DEFAULT_SCENE_KEY
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

function isRecommendationArray(value: unknown): value is TodayRecommendation[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && 'id' in item)
}

export async function getCachedTodayRecommendations({
  userId,
  targetDate,
  scene,
  city,
  itemCount
}: {
  userId: string
  targetDate: TodayTargetDate
  scene: TodayScene
  city: string | null
  itemCount: number
}): Promise<{ recommendations: TodayRecommendation[]; weatherState: TodayWeatherState } | null> {
  let data: {
    city: string | null
    item_count: number
    weather_state: Json
    recommendations: Json
  } | null = null
  let error: unknown = null

  try {
    const supabase = await createSupabaseServerClient()
    const result = await supabase
      .from('today_recommendation_cache')
      .select('city, item_count, weather_state, recommendations')
      .eq('user_id', userId)
      .eq('target_date', targetDate)
      .eq('scene_key', sceneKey(scene))
      .maybeSingle()

    data = result.data
    error = result.error
  } catch {
    return null
  }

  if (error || !data || data.city !== city || data.item_count !== itemCount) {
    return null
  }

  if (!isRecommendationArray(data.recommendations)) {
    return null
  }

  return {
    recommendations: data.recommendations,
    weatherState: data.weather_state as TodayWeatherState
  }
}

export async function getCachedTodayRecommendationsSnapshot({
  userId,
  targetDate,
  scene,
  city
}: {
  userId: string
  targetDate: TodayTargetDate
  scene: TodayScene
  city: string | null
}): Promise<{ recommendations: TodayRecommendation[]; weatherState: TodayWeatherState; itemCount: number } | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('today_recommendation_cache')
      .select('city, item_count, weather_state, recommendations')
      .eq('user_id', userId)
      .eq('target_date', targetDate)
      .eq('scene_key', sceneKey(scene))
      .maybeSingle()

    if (error || !data || data.city !== city || !isRecommendationArray(data.recommendations)) {
      return null
    }

    return {
      recommendations: data.recommendations,
      weatherState: data.weather_state as TodayWeatherState,
      itemCount: data.item_count
    }
  } catch {
    return null
  }
}

export async function saveTodayRecommendationCache({
  userId,
  targetDate,
  scene,
  city,
  itemCount,
  weatherState,
  recommendations
}: {
  userId: string
  targetDate: TodayTargetDate
  scene: TodayScene
  city: string | null
  itemCount: number
  weatherState: TodayWeatherState
  recommendations: TodayRecommendation[]
}) {
  try {
    const supabase = await createSupabaseServerClient()
    const table = supabase.from('today_recommendation_cache')

    if (!('upsert' in table) || typeof table.upsert !== 'function') {
      return
    }

    await table.upsert(
      {
        user_id: userId,
        target_date: targetDate,
        scene_key: sceneKey(scene),
        city,
        item_count: itemCount,
        weather_state: toJson(weatherState),
        recommendations: toJson(recommendations),
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id,target_date,scene_key' }
    )
  } catch {
    // Cache failures must not block Today recommendations.
  }
}

export function mergeLockedRecommendation({
  generated,
  lockedRecommendation,
  lockedRecommendationIndex
}: {
  generated: TodayRecommendation[]
  lockedRecommendation?: TodayRecommendation | null
  lockedRecommendationIndex?: number | null
}) {
  if (!lockedRecommendation) {
    return generated.slice(0, 3)
  }

  const nextRecommendations = generated.filter((recommendation) => recommendation.id !== lockedRecommendation.id).slice(0, 3)
  const nextIndex = typeof lockedRecommendationIndex === 'number' && lockedRecommendationIndex >= 0 && lockedRecommendationIndex <= 2
    ? lockedRecommendationIndex
    : 0

  nextRecommendations.splice(nextIndex, 0, lockedRecommendation)
  return nextRecommendations.slice(0, 3)
}
