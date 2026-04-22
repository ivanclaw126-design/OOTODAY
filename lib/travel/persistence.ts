import type { TravelPackingPlan, TravelSavedPlan, TravelSavedPlanSnapshot, TravelScene } from '@/lib/travel/types'

const travelScenarioPrefix = 'travel:'

export function buildTravelPlanTitle(plan: TravelPackingPlan) {
  return `${plan.destinationCity} ${plan.days}天${plan.scenes.length > 0 ? ` · ${plan.scenes.join('/')}` : ''}`
}

export function buildTravelWeatherSummary(plan: TravelPackingPlan) {
  return plan.weather ? `${plan.weather.city} · ${plan.weather.temperatureC}°C · ${plan.weather.conditionLabel}` : null
}

export function isTravelPlansTableMissing(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01' || error?.message?.includes('travel_plans') || false
}

export function encodeTravelScenarioMetadata(plan: TravelPackingPlan) {
  return `${travelScenarioPrefix}${JSON.stringify({
    destinationCity: plan.destinationCity,
    days: plan.days,
    scenes: plan.scenes,
    weatherSummary: buildTravelWeatherSummary(plan),
    plan
  })}`
}

function buildTravelSavedPlanBase({
  id,
  title,
  destinationCity,
  days,
  scenes,
  weatherSummary,
  createdAt,
  source
}: {
  id: string
  title: string
  destinationCity: string
  days: number
  scenes: TravelScene[]
  weatherSummary: string | null
  createdAt: string
  source: TravelSavedPlan['source']
}): TravelSavedPlan {
  return {
    id,
    title,
    destinationCity,
    days,
    scenes,
    weatherSummary,
    createdAt,
    source
  }
}

export function decodeTravelScenarioMetadata(value: string | null, fallback: { id: string; title: string; createdAt: string }): TravelSavedPlan | null {
  const snapshot = decodeTravelScenarioSnapshot(value, fallback)

  if (!snapshot) {
    return null
  }

  return {
    id: snapshot.id,
    title: snapshot.title,
    destinationCity: snapshot.destinationCity,
    days: snapshot.days,
    scenes: snapshot.scenes,
    weatherSummary: snapshot.weatherSummary,
    createdAt: snapshot.createdAt,
    source: snapshot.source
  }
}

export function decodeTravelScenarioSnapshot(
  value: string | null,
  fallback: { id: string; title: string; createdAt: string }
): TravelSavedPlanSnapshot | null {
  if (!value?.startsWith(travelScenarioPrefix)) {
    return null
  }

  try {
    const parsed = JSON.parse(value.slice(travelScenarioPrefix.length)) as {
      destinationCity?: string
      days?: number
      scenes?: string[]
      weatherSummary?: string | null
      plan?: TravelPackingPlan
    }

    if (!parsed.destinationCity || typeof parsed.days !== 'number') {
      return null
    }

    return {
      ...buildTravelSavedPlanBase({
        id: fallback.id,
        title: fallback.title,
        destinationCity: parsed.destinationCity,
        days: parsed.days,
        scenes: (parsed.scenes ?? []) as TravelScene[],
        weatherSummary: parsed.weatherSummary ?? null,
        createdAt: fallback.createdAt,
        source: 'outfits'
      }),
      plan:
        parsed.plan ??
        ({
          destinationCity: parsed.destinationCity,
          days: parsed.days,
          scenes: (parsed.scenes ?? []) as TravelScene[],
          suggestedOutfitCount: 1,
          weather: null,
          entries: [],
          dailyPlan: [],
          missingHints: [],
          notes: []
        } satisfies TravelPackingPlan)
    }
  } catch {
    return null
  }
}

export function buildTravelSavedPlanSnapshotFromRow(input: {
  id: string
  title: string
  destinationCity: string
  days: number
  scenes: TravelScene[]
  weatherSummary: string | null
  createdAt: string
  source: TravelSavedPlan['source']
  plan: TravelPackingPlan
}): TravelSavedPlanSnapshot {
  return {
    ...buildTravelSavedPlanBase({
      id: input.id,
      title: input.title,
      destinationCity: input.destinationCity,
      days: input.days,
      scenes: input.scenes,
      weatherSummary: input.weatherSummary,
      createdAt: input.createdAt,
      source: input.source
    }),
    plan: input.plan
  }
}
