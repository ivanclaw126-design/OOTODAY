import { getClosetView } from '@/lib/closet/get-closet-view'
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
  const [closet, ootdStatus, recentOotdHistory] = await Promise.all([
    getClosetView(userId),
    getTodayOotdStatus(userId),
    getRecentOotdHistory(userId)
  ])

  if (closet.itemCount === 0) {
    return {
      itemCount: 0,
      city,
      accountEmail,
      passwordBootstrapped,
      passwordChangedAt,
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
      weatherState: { status: 'not-set' },
      recommendations: generateTodayRecommendations(closet.items, null, offset),
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
      weatherState: { status: 'unavailable', city },
      recommendations: generateTodayRecommendations(closet.items, null, offset),
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
    weatherState: { status: 'ready', weather },
    recommendations: generateTodayRecommendations(closet.items, weather, offset),
    recommendationError: false,
    ootdStatus,
    recentOotdHistory
  }
}
