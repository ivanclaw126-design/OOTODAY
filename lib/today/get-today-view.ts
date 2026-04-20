import { getClosetView } from '@/lib/closet/get-closet-view'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { getWeather } from '@/lib/today/get-weather'
import type { TodayView } from '@/lib/today/types'

export async function getTodayView({
  userId,
  city,
  offset = 0
}: {
  userId: string
  city: string | null
  offset?: number
}): Promise<TodayView> {
  const closet = await getClosetView(userId)

  if (closet.itemCount === 0) {
    return {
      itemCount: 0,
      city,
      weatherState: city ? { status: 'unavailable', city } : { status: 'not-set' },
      recommendations: [],
      recommendationError: false
    }
  }

  if (!city) {
    return {
      itemCount: closet.itemCount,
      city: null,
      weatherState: { status: 'not-set' },
      recommendations: generateTodayRecommendations(closet.items, null, offset),
      recommendationError: false
    }
  }

  const weather = await getWeather(city)

  if (!weather) {
    return {
      itemCount: closet.itemCount,
      city,
      weatherState: { status: 'unavailable', city },
      recommendations: generateTodayRecommendations(closet.items, null, offset),
      recommendationError: false
    }
  }

  return {
    itemCount: closet.itemCount,
    city,
    weatherState: { status: 'ready', weather },
    recommendations: generateTodayRecommendations(closet.items, weather, offset),
    recommendationError: false
  }
}
