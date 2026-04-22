import { redirect } from 'next/navigation'
import { deleteTravelPlanAction, saveTravelPlanAction } from '@/app/travel/actions'
import { TravelPage } from '@/components/travel/travel-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { ensureProfile } from '@/lib/profiles/ensure-profile'
import { buildTravelPackingPlan } from '@/lib/travel/build-travel-packing-plan'
import { getTravelPlanById } from '@/lib/travel/get-travel-plan-by-id'
import { getRecentTravelPlans } from '@/lib/travel/get-recent-travel-plans'
import type { TravelPackingView, TravelScene } from '@/lib/travel/types'
import { getWeather } from '@/lib/today/get-weather'

const allowedScenes: TravelScene[] = ['通勤', '休闲', '正式', '约会', '户外']

function normalizeScenes(sceneParam: string | string[] | undefined): TravelScene[] {
  const values = Array.isArray(sceneParam) ? sceneParam : sceneParam ? [sceneParam] : []

  return values.filter((value): value is TravelScene => allowedScenes.includes(value as TravelScene))
}

function areScenesEqual(left: TravelScene[], right: TravelScene[]) {
  return left.length === right.length && left.every((scene, index) => scene === right[index])
}

export default async function TravelRoute({
  searchParams
}: {
  searchParams?: Promise<{ city?: string; days?: string; scene?: string | string[]; saved?: string; updated?: string; savedPlanId?: string }>
}) {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  const resolvedSearchParams = (await searchParams) ?? {}
  const justSaved = resolvedSearchParams.saved === '1'
  const justUpdated = resolvedSearchParams.updated === '1'
  const savedPlanId = resolvedSearchParams.savedPlanId?.trim() || null
  const savedPlanSnapshot = savedPlanId ? await getTravelPlanById(session.user.id, savedPlanId) : null
  const destinationCity = resolvedSearchParams.city?.trim() || savedPlanSnapshot?.destinationCity || null
  const parsedDays = Number.parseInt(resolvedSearchParams.days ?? '', 10)
  const days = Number.isNaN(parsedDays)
    ? savedPlanSnapshot?.days ?? null
    : Math.min(Math.max(parsedDays, 1), 14)
  const scenesFromParams = normalizeScenes(resolvedSearchParams.scene)
  const scenes = scenesFromParams.length > 0 ? scenesFromParams : savedPlanSnapshot?.scenes ?? []
  const closet = await getClosetView(session.user.id, { limit: 0 })
  const recentSavedPlans = await getRecentTravelPlans(session.user.id)
  const editingSavedPlan = savedPlanSnapshot
    ? {
        id: savedPlanSnapshot.id,
        title: savedPlanSnapshot.title,
        destinationCity: savedPlanSnapshot.destinationCity,
        days: savedPlanSnapshot.days,
        scenes: savedPlanSnapshot.scenes,
        weatherSummary: savedPlanSnapshot.weatherSummary,
        createdAt: savedPlanSnapshot.createdAt,
        source: savedPlanSnapshot.source
      }
    : null

  let view: TravelPackingView

  if (closet.itemCount === 0) {
    view = {
      status: 'empty-closet',
      itemCount: 0,
      destinationCity,
      days,
      scenes,
      savedPlanId
    }
  } else if (!destinationCity || !days) {
    view = {
      status: 'idle',
      itemCount: closet.itemCount,
      destinationCity,
      days,
      scenes,
      savedPlanId
    }
  } else {
    const plan =
      savedPlanSnapshot?.plan &&
      savedPlanSnapshot.destinationCity === destinationCity &&
      savedPlanSnapshot.days === days &&
      areScenesEqual(savedPlanSnapshot.scenes, scenes)
        ? savedPlanSnapshot.plan
        : buildTravelPackingPlan({
            destinationCity,
            days,
            scenes,
            items: closet.items,
            weather: await getWeather(destinationCity)
          })

    view = {
      status: 'ready',
      itemCount: closet.itemCount,
      destinationCity,
      days,
      scenes,
      plan,
      recentSavedPlans,
      justSaved,
      justUpdated,
      savedPlanId,
      editingSavedPlan
    }
  }

  return <TravelPage view={view} savePlan={saveTravelPlanAction} deleteSavedPlan={deleteTravelPlanAction} />
}
