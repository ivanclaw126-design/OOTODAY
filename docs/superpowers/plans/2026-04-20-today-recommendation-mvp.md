# Today Recommendation MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/today` into a real recommendation page that shows 3 outfit suggestions, uses weather when a city is set, still works without a city, and lets the user set or change city directly from Today.

**Architecture:** Keep the existing server-first App Router pattern. Add a dedicated Today view loader, a weather helper, a rule-based recommendation generator, and a small server action for updating `profiles.city`, then render the page with focused presentational components and a tiny client action surface only where interaction is required.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR/Auth/Postgres, Vitest, Testing Library, jsdom

---

## File Structure

### Create

- `lib/today/types.ts` - shared Today weather, recommendation, and page-state types
- `lib/today/get-weather.ts` - weather fetch + normalization helper
- `lib/today/generate-recommendations.ts` - rule-based generator for 3 recommendations
- `lib/today/get-today-view.ts` - server view loader for Today page
- `app/today/actions.ts` - server actions for city update and refresh token generation
- `components/today/today-status-card.tsx` - top status summary for date, city, and weather
- `components/today/today-city-form.tsx` - inline city set/change form
- `components/today/today-city-prompt-card.tsx` - non-blocking city encouragement card
- `components/today/today-recommendation-card.tsx` - one recommendation card
- `components/today/today-recommendation-list.tsx` - list of 3 recommendations or failure state
- `tests/lib/today/generate-recommendations.test.ts` - recommendation generator tests
- `tests/lib/today/get-weather.test.ts` - weather normalization and fallback tests
- `tests/lib/today/get-today-view.test.ts` - Today loader orchestration tests
- `tests/app/today/actions.test.ts` - city update action tests

### Modify

- `app/today/page.tsx` - replace placeholder state loading with the new Today view loader and actions
- `components/today/today-page.tsx` - replace placeholder UI with stable Today MVP layout
- `lib/data/get-today-state.ts` - remove usage from Today route after migration, keep only if still referenced elsewhere
- `lib/env.ts` - add weather env parsing helper
- `.env.example` - document weather API requirements
- `tests/lib/env.test.ts` - cover new weather env helper
- `tests/components/today-page.test.tsx` - replace placeholder tests with real Today state tests
- `PROGRESS.md` - update status after verification

### No schema migration planned

The current schema already contains `profiles.city` and `items` fields needed for this MVP. Do not add a migration in this plan.

## Task 0: Preserve the current Closet Upload milestone

**Files:**
- Modify: none
- Test: existing verified suite only

- [ ] **Step 1: Inspect the current working tree**

Run:
```bash
git status --short
```

Expected: only the intended current work appears. If the tree is clean, stop and do not create an empty commit for this task.

- [ ] **Step 2: Review the diff that will become the Closet boundary commit**

Run:
```bash
git diff --stat && git diff -- lib/supabase/server.ts lib/env.ts lib/closet/analyze-item-image.ts PROGRESS.md
```

Expected: the diff only contains the verified Closet QA blocker fixes and progress updates.

- [ ] **Step 3: Re-run the focused verified tests for the Closet milestone**

Run:
```bash
npm test -- tests/components/closet-upload-card.test.tsx tests/app/closet/actions.test.ts tests/lib/closet/analyze-item-image.test.ts tests/lib/closet/save-closet-item.test.ts tests/components/closet-page.test.tsx
```

Expected: PASS and output includes all listed suites passing.

- [ ] **Step 4: Commit the preserved Closet milestone if there are changes**

Run:
```bash
git add lib/supabase/server.ts lib/env.ts lib/closet/analyze-item-image.ts PROGRESS.md && git commit -m "fix: finalize closet upload qa fixes"
```

Expected: one clean commit that freezes the verified Closet Upload completion state.

## Task 1: Add Today domain types and weather env parsing

**Files:**
- Create: `lib/today/types.ts`
- Modify: `lib/env.ts`
- Modify: `.env.example`
- Modify: `tests/lib/env.test.ts`
- Test: `tests/lib/env.test.ts`

- [ ] **Step 1: Replace the env test with weather helper coverage**

Replace `tests/lib/env.test.ts` with:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('getEnv', () => {
  it('returns the required public Supabase variables', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    vi.stubEnv('NEXT_PUBLIC_STORAGE_BUCKET', 'ootd-images')

    const { getEnv } = await import('@/lib/env')

    expect(getEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
      storageBucket: 'ootd-images'
    })
  })
})

describe('getWeatherEnv', () => {
  it('returns the configured weather API values', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')
    vi.stubEnv('WEATHER_BASE_URL', 'https://api.example.com/weather')

    const { getWeatherEnv } = await import('@/lib/env')

    expect(getWeatherEnv()).toEqual({
      apiKey: 'weather-key',
      baseUrl: 'https://api.example.com/weather'
    })
  })

  it('defaults the weather base url when only the key is set', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    const { getWeatherEnv } = await import('@/lib/env')

    expect(getWeatherEnv()).toEqual({
      apiKey: 'weather-key',
      baseUrl: 'https://api.openweathermap.org/data/2.5/weather'
    })
  })
})
```

- [ ] **Step 2: Run the env test to verify it fails**

Run:
```bash
npm test -- tests/lib/env.test.ts
```

Expected: FAIL because `getWeatherEnv` does not exist.

- [ ] **Step 3: Add Today shared types**

Create `lib/today/types.ts`:
```ts
import type { ClosetItemCardData } from '@/lib/closet/types'

export type TodayWeather = {
  city: string
  temperatureC: number
  conditionLabel: string
  isWarm: boolean
  isCold: boolean
}

export type TodayWeatherState =
  | { status: 'not-set' }
  | { status: 'ready'; weather: TodayWeather }
  | { status: 'unavailable'; city: string }

export type TodayRecommendationItem = Pick<
  ClosetItemCardData,
  'id' | 'imageUrl' | 'category' | 'subCategory' | 'colorCategory' | 'styleTags'
>

export type TodayRecommendation = {
  id: string
  reason: string
  top: TodayRecommendationItem | null
  bottom: TodayRecommendationItem | null
  dress: TodayRecommendationItem | null
  outerLayer: TodayRecommendationItem | null
}

export type TodayView = {
  itemCount: number
  city: string | null
  weatherState: TodayWeatherState
  recommendations: TodayRecommendation[]
  recommendationError: boolean
}
```

- [ ] **Step 4: Extend env parsing with weather helper**

Replace `lib/env.ts` with:
```ts
export function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!storageBucket) {
    throw new Error('Missing NEXT_PUBLIC_STORAGE_BUCKET')
  }

  return { supabaseUrl, supabaseAnonKey, storageBucket }
}

export function getAiEnv() {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  return { apiKey, baseUrl, model }
}

export function getWeatherEnv() {
  const apiKey = process.env.WEATHER_API_KEY
  const baseUrl = process.env.WEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5/weather'

  if (!apiKey) {
    throw new Error('Missing WEATHER_API_KEY')
  }

  return { apiKey, baseUrl }
}
```

Replace `.env.example` with:
```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=
OPENAI_API_KEY=
WEATHER_API_KEY=
# Optional override:
# WEATHER_BASE_URL=https://api.openweathermap.org/data/2.5/weather
```

- [ ] **Step 5: Run the env test to verify it passes**

Run:
```bash
npm test -- tests/lib/env.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the Today types and weather env support**

Run:
```bash
git add lib/today/types.ts lib/env.ts .env.example tests/lib/env.test.ts && git commit -m "feat: add today weather config and types"
```

Expected: one commit with the Today shared types and weather env parsing.

## Task 2: Add the weather helper and recommendation generator

**Files:**
- Create: `lib/today/get-weather.ts`
- Create: `lib/today/generate-recommendations.ts`
- Create: `tests/lib/today/get-weather.test.ts`
- Create: `tests/lib/today/generate-recommendations.test.ts`
- Test: `tests/lib/today/get-weather.test.ts`
- Test: `tests/lib/today/generate-recommendations.test.ts`

- [ ] **Step 1: Write the failing weather helper test**

Create `tests/lib/today/get-weather.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('getWeather', () => {
  it('normalizes a successful weather response', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Shanghai',
          weather: [{ main: 'Clouds', description: 'broken clouds' }],
          main: { temp: 18.4 }
        })
      }) as unknown as typeof fetch
    )

    const { getWeather } = await import('@/lib/today/get-weather')

    await expect(getWeather('Shanghai')).resolves.toEqual({
      city: 'Shanghai',
      temperatureC: 18,
      conditionLabel: 'broken clouds',
      isWarm: false,
      isCold: false
    })
  })

  it('returns null when the weather request fails', async () => {
    vi.stubEnv('WEATHER_API_KEY', 'weather-key')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch
    )

    const { getWeather } = await import('@/lib/today/get-weather')

    await expect(getWeather('Shanghai')).resolves.toBeNull()
  })
})
```

- [ ] **Step 2: Write the failing recommendation generator test**

Create `tests/lib/today/generate-recommendations.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'

const items = [
  {
    id: 'top-1',
    imageUrl: 'https://example.com/top-1.jpg',
    category: '上衣',
    subCategory: '针织衫',
    colorCategory: '米色',
    styleTags: ['通勤'],
    createdAt: '2026-04-19T10:00:00Z'
  },
  {
    id: 'top-2',
    imageUrl: 'https://example.com/top-2.jpg',
    category: '上衣',
    subCategory: 'T恤',
    colorCategory: '白色',
    styleTags: ['极简'],
    createdAt: '2026-04-19T10:01:00Z'
  },
  {
    id: 'bottom-1',
    imageUrl: 'https://example.com/bottom-1.jpg',
    category: '裤装',
    subCategory: '西裤',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    createdAt: '2026-04-19T10:02:00Z'
  },
  {
    id: 'bottom-2',
    imageUrl: 'https://example.com/bottom-2.jpg',
    category: '裙装',
    subCategory: '半裙',
    colorCategory: '灰色',
    styleTags: ['极简'],
    createdAt: '2026-04-19T10:03:00Z'
  },
  {
    id: 'dress-1',
    imageUrl: 'https://example.com/dress-1.jpg',
    category: '连衣裙',
    subCategory: '针织连衣裙',
    colorCategory: '黑色',
    styleTags: ['通勤'],
    createdAt: '2026-04-19T10:04:00Z'
  },
  {
    id: 'outer-1',
    imageUrl: 'https://example.com/outer-1.jpg',
    category: '外套',
    subCategory: '西装外套',
    colorCategory: '藏蓝',
    styleTags: ['通勤'],
    createdAt: '2026-04-19T10:05:00Z'
  }
]

describe('generateTodayRecommendations', () => {
  it('returns 3 valid recommendations without weather', () => {
    const recommendations = generateTodayRecommendations(items, null)

    expect(recommendations).toHaveLength(3)
    expect(recommendations[0]?.reason).toBeTruthy()
    expect(
      recommendations.every((recommendation) => recommendation.top || recommendation.dress)
    ).toBe(true)
  })

  it('adds outer layers in cold weather when available', () => {
    const recommendations = generateTodayRecommendations(items, {
      city: 'Shanghai',
      temperatureC: 7,
      conditionLabel: 'light rain',
      isWarm: false,
      isCold: true
    })

    expect(recommendations.some((recommendation) => recommendation.outerLayer)).toBe(true)
  })
}
```

- [ ] **Step 3: Run the new Today library tests to verify they fail**

Run:
```bash
npm test -- tests/lib/today/get-weather.test.ts tests/lib/today/generate-recommendations.test.ts
```

Expected: FAIL because the new Today helpers do not exist.

- [ ] **Step 4: Implement the weather helper**

Create `lib/today/get-weather.ts`:
```ts
import { getWeatherEnv } from '@/lib/env'
import type { TodayWeather } from '@/lib/today/types'

export async function getWeather(city: string): Promise<TodayWeather | null> {
  const { apiKey, baseUrl } = getWeatherEnv()
  const searchParams = new URLSearchParams({
    q: city,
    appid: apiKey,
    units: 'metric'
  })

  const response = await fetch(`${baseUrl}?${searchParams.toString()}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as {
    name?: string
    weather?: Array<{ description?: string }>
    main?: { temp?: number }
  }

  const temperature = payload.main?.temp
  const conditionLabel = payload.weather?.[0]?.description
  const normalizedCity = payload.name

  if (typeof temperature !== 'number' || !conditionLabel || !normalizedCity) {
    return null
  }

  return {
    city: normalizedCity,
    temperatureC: Math.round(temperature),
    conditionLabel,
    isWarm: temperature >= 24,
    isCold: temperature <= 12
  }
}
```

- [ ] **Step 5: Implement the recommendation generator**

Create `lib/today/generate-recommendations.ts`:
```ts
import type { ClosetItemCardData } from '@/lib/closet/types'
import type { TodayRecommendation, TodayRecommendationItem, TodayWeather } from '@/lib/today/types'

function toRecommendationItem(item: ClosetItemCardData): TodayRecommendationItem {
  return {
    id: item.id,
    imageUrl: item.imageUrl,
    category: item.category,
    subCategory: item.subCategory,
    colorCategory: item.colorCategory,
    styleTags: item.styleTags
  }
}

function buildReason(parts: string[]) {
  return parts.filter(Boolean).join('，')
}

export function generateTodayRecommendations(
  items: ClosetItemCardData[],
  weather: TodayWeather | null
): TodayRecommendation[] {
  const tops = items.filter((item) => item.category === '上衣')
  const bottoms = items.filter((item) => item.category === '裤装' || item.category === '裙装')
  const dresses = items.filter((item) => item.category === '连衣裙')
  const outerLayers = items.filter((item) => item.category === '外套')

  const recommendations: TodayRecommendation[] = []
  const usedMainIds = new Set<string>()

  for (const dress of dresses) {
    if (recommendations.length === 3) {
      break
    }

    usedMainIds.add(dress.id)
    recommendations.push({
      id: `dress-${dress.id}`,
      reason: buildReason([
        weather?.isCold ? '单穿偏冷，建议配外套' : '一件完成搭配',
        dress.styleTags[0] ? `风格偏${dress.styleTags[0]}` : ''
      ]),
      top: null,
      bottom: null,
      dress: toRecommendationItem(dress),
      outerLayer: weather?.isCold && outerLayers[0] ? toRecommendationItem(outerLayers[0]) : null
    })
  }

  for (const top of tops) {
    if (recommendations.length === 3) {
      break
    }

    if (usedMainIds.has(top.id)) {
      continue
    }

    const bottom = bottoms.find((candidate) => !usedMainIds.has(candidate.id))

    if (!bottom) {
      continue
    }

    usedMainIds.add(top.id)
    usedMainIds.add(bottom.id)

    const matchingOuterLayer = weather?.isCold && outerLayers.length > 0 ? outerLayers[0] : null
    const sharedTag = top.styleTags.find((tag) => bottom.styleTags.includes(tag))

    recommendations.push({
      id: `set-${top.id}-${bottom.id}`,
      reason: buildReason([
        weather?.isWarm ? '天气偏暖，优先轻量组合' : '',
        weather?.isCold ? '天气偏冷，可叠加外套' : '',
        sharedTag ? `风格统一在${sharedTag}` : '基础组合稳定不出错'
      ]),
      top: toRecommendationItem(top),
      bottom: toRecommendationItem(bottom),
      dress: null,
      outerLayer: matchingOuterLayer ? toRecommendationItem(matchingOuterLayer) : null
    })
  }

  while (recommendations.length < 3 && recommendations.length > 0) {
    const seed = recommendations[recommendations.length % recommendations.length]
    recommendations.push({
      ...seed,
      id: `${seed.id}-alt-${recommendations.length}`,
      reason: `${seed.reason}，适合换一套思路`
    })
  }

  return recommendations.slice(0, 3)
}
```

- [ ] **Step 6: Run the Today library tests to verify they pass**

Run:
```bash
npm test -- tests/lib/today/get-weather.test.ts tests/lib/today/generate-recommendations.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the weather helper and recommendation engine**

Run:
```bash
git add lib/today/get-weather.ts lib/today/generate-recommendations.ts tests/lib/today/get-weather.test.ts tests/lib/today/generate-recommendations.test.ts && git commit -m "feat: add today weather and recommendation logic"
```

Expected: one commit with the core Today recommendation logic.

## Task 3: Add the Today view loader and city update action

**Files:**
- Create: `lib/today/get-today-view.ts`
- Create: `app/today/actions.ts`
- Create: `tests/lib/today/get-today-view.test.ts`
- Create: `tests/app/today/actions.test.ts`
- Test: `tests/lib/today/get-today-view.test.ts`
- Test: `tests/app/today/actions.test.ts`

- [ ] **Step 1: Write the failing Today view loader test**

Create `tests/lib/today/get-today-view.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'

const getClosetView = vi.fn()
const getWeather = vi.fn()
const generateTodayRecommendations = vi.fn()

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/today/get-weather', () => ({
  getWeather
}))

vi.mock('@/lib/today/generate-recommendations', () => ({
  generateTodayRecommendations
}))

describe('getTodayView', () => {
  it('returns non-weather recommendations when city is missing', async () => {
    getClosetView.mockResolvedValue({
      itemCount: 2,
      items: [
        {
          id: 'item-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: [],
          createdAt: '2026-04-19T10:00:00Z'
        }
      ]
    })
    generateTodayRecommendations.mockReturnValue([{ id: 'rec-1' }, { id: 'rec-2' }, { id: 'rec-3' }])

    const { getTodayView } = await import('@/lib/today/get-today-view')

    await expect(getTodayView({ userId: 'user-1', city: null })).resolves.toEqual({
      itemCount: 2,
      city: null,
      weatherState: { status: 'not-set' },
      recommendations: [{ id: 'rec-1' }, { id: 'rec-2' }, { id: 'rec-3' }],
      recommendationError: false
    })

    expect(getWeather).not.toHaveBeenCalled()
  })

  it('falls back when weather fetch fails', async () => {
    getClosetView.mockResolvedValue({ itemCount: 1, items: [] })
    getWeather.mockResolvedValue(null)
    generateTodayRecommendations.mockReturnValue([])

    const { getTodayView } = await import('@/lib/today/get-today-view')

    await expect(getTodayView({ userId: 'user-1', city: 'Shanghai' })).resolves.toEqual({
      itemCount: 1,
      city: 'Shanghai',
      weatherState: { status: 'unavailable', city: 'Shanghai' },
      recommendations: [],
      recommendationError: false
    })
  })
})
```

- [ ] **Step 2: Write the failing Today actions test**

Create `tests/app/today/actions.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const update = vi.fn()
const eq = vi.fn(() => Promise.resolve({ error: null }))
const from = vi.fn(() => ({ update: () => ({ eq }) }))
const createSupabaseServerClient = vi.fn(async () => ({ from }))
const revalidatePath = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

describe('updateTodayCityAction', () => {
  it('updates the signed-in user city and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { updateTodayCityAction } = await import('@/app/today/actions')

    await expect(updateTodayCityAction({ city: 'Shanghai' })).resolves.toEqual({ error: null })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })
})
```

- [ ] **Step 3: Run the loader and action tests to verify they fail**

Run:
```bash
npm test -- tests/lib/today/get-today-view.test.ts tests/app/today/actions.test.ts
```

Expected: FAIL because the Today loader and action do not exist.

- [ ] **Step 4: Implement the Today view loader**

Create `lib/today/get-today-view.ts`:
```ts
import { getClosetView } from '@/lib/closet/get-closet-view'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { getWeather } from '@/lib/today/get-weather'
import type { TodayView } from '@/lib/today/types'

export async function getTodayView({
  userId,
  city
}: {
  userId: string
  city: string | null
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
      recommendations: generateTodayRecommendations(closet.items, null),
      recommendationError: false
    }
  }

  const weather = await getWeather(city)

  if (!weather) {
    return {
      itemCount: closet.itemCount,
      city,
      weatherState: { status: 'unavailable', city },
      recommendations: generateTodayRecommendations(closet.items, null),
      recommendationError: false
    }
  }

  return {
    itemCount: closet.itemCount,
    city,
    weatherState: { status: 'ready', weather },
    recommendations: generateTodayRecommendations(closet.items, weather),
    recommendationError: false
  }
}
```

- [ ] **Step 5: Implement the Today actions**

Create `app/today/actions.ts`:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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
    return { error: '城市保存失败，请稍后重试' }
  }

  revalidatePath('/today')
  return { error: null }
}
```

- [ ] **Step 6: Run the loader and action tests to verify they pass**

Run:
```bash
npm test -- tests/lib/today/get-today-view.test.ts tests/app/today/actions.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the Today loader and city action**

Run:
```bash
git add lib/today/get-today-view.ts app/today/actions.ts tests/lib/today/get-today-view.test.ts tests/app/today/actions.test.ts && git commit -m "feat: add today data loading and city action"
```

Expected: one commit with Today orchestration and city update behavior.

## Task 4: Build the Today page UI and wire it into the route

**Files:**
- Create: `components/today/today-status-card.tsx`
- Create: `components/today/today-city-form.tsx`
- Create: `components/today/today-city-prompt-card.tsx`
- Create: `components/today/today-recommendation-card.tsx`
- Create: `components/today/today-recommendation-list.tsx`
- Modify: `components/today/today-page.tsx`
- Modify: `app/today/page.tsx`
- Modify: `tests/components/today-page.test.tsx`
- Test: `tests/components/today-page.test.tsx`

- [ ] **Step 1: Replace the Today page test with real MVP state coverage**

Replace `tests/components/today-page.test.tsx` with:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TodayPage } from '@/components/today/today-page'

const updateCity = vi.fn()
const refreshRecommendations = vi.fn()

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom')
  return actual
})

describe('TodayPage', () => {
  it('shows the upload prompt when the closet is empty', () => {
    render(
      <TodayPage
        view={{
          itemCount: 0,
          city: null,
          weatherState: { status: 'not-set' },
          recommendations: [],
          recommendationError: false
        }}
        updateCity={updateCity}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('你的衣橱还是空的')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '去上传衣物' })).toHaveAttribute('href', '/closet')
  })

  it('shows recommendations and city prompt when city is missing', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: null,
          weatherState: { status: 'not-set' },
          recommendations: [
            {
              id: 'rec-1',
              reason: '基础组合稳定不出错',
              top: {
                id: 'top-1',
                imageUrl: null,
                category: '上衣',
                subCategory: '衬衫',
                colorCategory: '白色',
                styleTags: ['通勤']
              },
              bottom: {
                id: 'bottom-1',
                imageUrl: null,
                category: '裤装',
                subCategory: '西裤',
                colorCategory: '黑色',
                styleTags: ['通勤']
              },
              dress: null,
              outerLayer: null
            }
          ],
          recommendationError: false
        }}
        updateCity={updateCity}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('填写常住城市，可获得更准确推荐')).toBeInTheDocument()
    expect(screen.getByText('基础组合稳定不出错')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '设置城市' })).toBeInTheDocument()
  })

  it('shows weather-aware status when weather is ready', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: 'Shanghai',
          weatherState: {
            status: 'ready',
            weather: {
              city: 'Shanghai',
              temperatureC: 9,
              conditionLabel: 'light rain',
              isWarm: false,
              isCold: true
            }
          },
          recommendations: [
            {
              id: 'rec-1',
              reason: '天气偏冷，可叠加外套',
              top: null,
              bottom: null,
              dress: {
                id: 'dress-1',
                imageUrl: null,
                category: '连衣裙',
                subCategory: '针织连衣裙',
                colorCategory: '黑色',
                styleTags: ['通勤']
              },
              outerLayer: {
                id: 'outer-1',
                imageUrl: null,
                category: '外套',
                subCategory: '西装外套',
                colorCategory: '藏蓝',
                styleTags: ['通勤']
              }
            }
          ],
          recommendationError: false
        }}
        updateCity={updateCity}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('Shanghai · 9°C · light rain')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '修改城市' })).toBeInTheDocument()
  })

  it('shows weather unavailable fallback copy', () => {
    render(
      <TodayPage
        view={{
          itemCount: 2,
          city: 'Shanghai',
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [],
          recommendationError: false
        }}
        updateCity={updateCity}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('Shanghai · 天气暂时不可用')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the Today page test to verify it fails**

Run:
```bash
npm test -- tests/components/today-page.test.tsx
```

Expected: FAIL because `TodayPage` does not yet accept the new props and layout.

- [ ] **Step 3: Add the Today presentational components**

Create `components/today/today-status-card.tsx`:
```tsx
import { Card } from '@/components/ui/card'
import type { TodayWeatherState } from '@/lib/today/types'

export function TodayStatusCard({ weatherState }: { weatherState: TodayWeatherState }) {
  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date())

  let summary = '未设置常住城市'

  if (weatherState.status === 'ready') {
    summary = `${weatherState.weather.city} · ${weatherState.weather.temperatureC}°C · ${weatherState.weather.conditionLabel}`
  }

  if (weatherState.status === 'unavailable') {
    summary = `${weatherState.city} · 天气暂时不可用`
  }

  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[var(--color-neutral-dark)]">{todayLabel}</p>
        <p className="text-lg font-medium">今天穿什么</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">{summary}</p>
      </div>
    </Card>
  )
}
```

Create `components/today/today-city-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'

type TodayCityFormProps = {
  initialCity: string
  onSubmit: (input: { city: string }) => Promise<{ error: string | null }>
  onCancel: () => void
}

export function TodayCityForm({ initialCity, onSubmit, onCancel }: TodayCityFormProps) {
  const [city, setCity] = useState(initialCity)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (event) => {
        event.preventDefault()
        setIsSaving(true)
        const result = await onSubmit({ city })
        setError(result.error)
        setIsSaving(false)
        if (!result.error) {
          onCancel()
        }
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span>常住城市</span>
        <input
          aria-label="常住城市"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={isSaving}>
          保存城市
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>
          取消
        </SecondaryButton>
      </div>
    </form>
  )
}
```

Create `components/today/today-city-prompt-card.tsx`:
```tsx
import { Card } from '@/components/ui/card'

export function TodayCityPromptCard() {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">填写常住城市，可获得更准确推荐</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">
          没填也能正常推荐，但加入天气后，Today 会更贴近真实场景。
        </p>
      </div>
    </Card>
  )
}
```

Create `components/today/today-recommendation-card.tsx`:
```tsx
import { Card } from '@/components/ui/card'
import type { TodayRecommendation } from '@/lib/today/types'

function itemLabel(label: string, value: string | null) {
  return value ? `${label}：${value}` : `${label}：待补充`
}

export function TodayRecommendationCard({ recommendation }: { recommendation: TodayRecommendation }) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-neutral-dark)]">{recommendation.reason}</p>
        {recommendation.dress ? (
          <div className="flex flex-col gap-1 text-sm">
            <p>{itemLabel('主件', recommendation.dress.subCategory ?? recommendation.dress.category)}</p>
            <p>{itemLabel('颜色', recommendation.dress.colorCategory)}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-sm">
            <p>{itemLabel('上装', recommendation.top?.subCategory ?? recommendation.top?.category ?? null)}</p>
            <p>{itemLabel('下装', recommendation.bottom?.subCategory ?? recommendation.bottom?.category ?? null)}</p>
          </div>
        )}
        {recommendation.outerLayer ? (
          <p className="text-sm text-[var(--color-neutral-dark)]">
            外层建议：{recommendation.outerLayer.subCategory ?? recommendation.outerLayer.category}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
```

Create `components/today/today-recommendation-list.tsx`:
```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { TodayRecommendationCard } from '@/components/today/today-recommendation-card'
import type { TodayRecommendation } from '@/lib/today/types'

export function TodayRecommendationList({
  recommendations,
  recommendationError
}: {
  recommendations: TodayRecommendation[]
  recommendationError: boolean
}) {
  if (recommendationError) {
    return (
      <EmptyState
        title="推荐暂时生成失败"
        description="刷新页面后重试，或先去衣橱检查单品信息是否完整。"
      />
    )
  }

  return (
    <div className="grid gap-4">
      {recommendations.map((recommendation) => (
        <TodayRecommendationCard key={recommendation.id} recommendation={recommendation} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Replace the Today page component**

Replace `components/today/today-page.tsx` with:
```tsx
'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { TodayCityForm } from '@/components/today/today-city-form'
import { TodayCityPromptCard } from '@/components/today/today-city-prompt-card'
import { TodayRecommendationList } from '@/components/today/today-recommendation-list'
import { TodayStatusCard } from '@/components/today/today-status-card'
import { PrimaryLink, SecondaryButton } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { TodayView } from '@/lib/today/types'

export function TodayPage({
  view,
  updateCity,
  refreshRecommendations
}: {
  view: TodayView
  updateCity: (input: { city: string }) => Promise<{ error: string | null }>
  refreshRecommendations: () => Promise<void>
}) {
  const [isEditingCity, setIsEditingCity] = useState(false)

  return (
    <AppShell title="Today">
      <TodayStatusCard weatherState={view.weatherState} />

      {view.itemCount === 0 ? (
        <EmptyState
          title="你的衣橱还是空的"
          description="先上传几件常穿的单品，Today 才能给出真实推荐。"
          action={<PrimaryLink href="/closet">去上传衣物</PrimaryLink>}
        />
      ) : (
        <>
          {!view.city ? <TodayCityPromptCard /> : null}

          {isEditingCity ? (
            <TodayCityForm
              initialCity={view.city ?? ''}
              onSubmit={updateCity}
              onCancel={() => setIsEditingCity(false)}
            />
          ) : null}

          <TodayRecommendationList
            recommendations={view.recommendations}
            recommendationError={view.recommendationError}
          />

          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={() => void refreshRecommendations()}>
              换一批推荐
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => setIsEditingCity(true)}>
              {view.city ? '修改城市' : '设置城市'}
            </SecondaryButton>
          </div>
        </>
      )}
    </AppShell>
  )
}
```

- [ ] **Step 5: Replace the Today route wiring**

Replace `app/today/page.tsx` with:
```tsx
import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import { updateTodayCityAction } from '@/app/today/actions'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayView } from '@/lib/today/get-today-view'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function TodayRoute({
  searchParams
}: {
  searchParams: Promise<{ refresh?: string }>
}) {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  const supabase = await createSupabaseServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('city')
    .eq('id', session.user.id)
    .maybeSingle()

  await searchParams

  const view = await getTodayView({
    userId: session.user.id,
    city: profile?.city ?? null
  })

  async function updateCity(input: { city: string }) {
    'use server'

    return updateTodayCityAction(input)
  }

  async function refreshRecommendations() {
    'use server'
  }

  return <TodayPage view={view} updateCity={updateCity} refreshRecommendations={refreshRecommendations} />
}
```

- [ ] **Step 6: Run the Today page test to verify it passes**

Run:
```bash
npm test -- tests/components/today-page.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the Today UI and route wiring**

Run:
```bash
git add components/today/today-status-card.tsx components/today/today-city-form.tsx components/today/today-city-prompt-card.tsx components/today/today-recommendation-card.tsx components/today/today-recommendation-list.tsx components/today/today-page.tsx app/today/page.tsx tests/components/today-page.test.tsx && git commit -m "feat: add today recommendation page ui"
```

Expected: one commit with the full Today page surface.

## Task 5: Add refresh behavior, full verification, and progress update

**Files:**
- Modify: `app/today/actions.ts`
- Modify: `app/today/page.tsx`
- Modify: `PROGRESS.md`
- Test: `tests/lib/today/get-weather.test.ts`
- Test: `tests/lib/today/generate-recommendations.test.ts`
- Test: `tests/lib/today/get-today-view.test.ts`
- Test: `tests/app/today/actions.test.ts`
- Test: `tests/components/today-page.test.tsx`

- [ ] **Step 1: Extend the Today action test with refresh coverage**

Replace `tests/app/today/actions.test.ts` with:
```ts
import { describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const eq = vi.fn(() => Promise.resolve({ error: null }))
const from = vi.fn(() => ({ update: () => ({ eq }) }))
const createSupabaseServerClient = vi.fn(async () => ({ from }))
const revalidatePath = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

describe('today actions', () => {
  it('updates the signed-in user city and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { updateTodayCityAction } = await import('@/app/today/actions')

    await expect(updateTodayCityAction({ city: 'Shanghai' })).resolves.toEqual({ error: null })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('revalidates Today when refreshing recommendations', async () => {
    const { refreshTodayRecommendationsAction } = await import('@/app/today/actions')

    await refreshTodayRecommendationsAction()

    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })
})
```

- [ ] **Step 2: Run the Today action test to verify refresh coverage fails**

Run:
```bash
npm test -- tests/app/today/actions.test.ts
```

Expected: FAIL because `refreshTodayRecommendationsAction` does not exist.

- [ ] **Step 3: Implement the refresh action and wire it into the route**

Replace `app/today/actions.ts` with:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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
    return { error: '城市保存失败，请稍后重试' }
  }

  revalidatePath('/today')
  return { error: null }
}

export async function refreshTodayRecommendationsAction() {
  revalidatePath('/today')
}
```

Replace `app/today/page.tsx` with:
```tsx
import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import { refreshTodayRecommendationsAction, updateTodayCityAction } from '@/app/today/actions'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayView } from '@/lib/today/get-today-view'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function TodayRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  const supabase = await createSupabaseServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('city')
    .eq('id', session.user.id)
    .maybeSingle()

  const view = await getTodayView({
    userId: session.user.id,
    city: profile?.city ?? null
  })

  async function updateCity(input: { city: string }) {
    'use server'

    return updateTodayCityAction(input)
  }

  async function refreshRecommendations() {
    'use server'

    await refreshTodayRecommendationsAction()
  }

  return <TodayPage view={view} updateCity={updateCity} refreshRecommendations={refreshRecommendations} />
}
```

- [ ] **Step 4: Run the focused Today test suite**

Run:
```bash
npm test -- tests/lib/env.test.ts tests/lib/today/get-weather.test.ts tests/lib/today/generate-recommendations.test.ts tests/lib/today/get-today-view.test.ts tests/app/today/actions.test.ts tests/components/today-page.test.tsx
```

Expected: PASS for all Today-related suites.

- [ ] **Step 5: Run the full test suite**

Run:
```bash
npm test
```

Expected: PASS for both existing Closet coverage and the new Today coverage.

- [ ] **Step 6: Start the app and manually QA Today in the browser**

Run:
```bash
npm run dev
```

Expected: local app starts on `http://localhost:3000`.

Then verify these exact flows in a browser:
1. A user with no closet items sees the empty-state CTA on `/today`.
2. A user with closet items and no city sees 3 recommendations and the city prompt.
3. Saving a city updates the page and shows weather status.
4. If weather fetch is forced to fail, Today still shows recommendations and fallback copy.
5. Clicking `换一批推荐` keeps Today usable and reloads the page without errors.

- [ ] **Step 7: Update `PROGRESS.md` for Today MVP**

Append this new section under `## 已完成` and update `最后更新`:
```md
### 3. Today 推荐 MVP

已完成并落地的能力包括：

- `/today` 从占位页升级为真实推荐页
- 有城市时接入天气并增强推荐
- 无城市时仍可生成基础推荐
- Today 页内支持设置和修改常住城市
- 天气失败时自动降级为无天气推荐
- `换一批推荐` 支持重新生成推荐，不持久化历史
```

Replace `## 下一步` with:
```md
## 下一步

1. 开始实现 OOTD 记录与满意度反馈
2. 将 Today 推荐与 OOTD 反馈闭环接通
3. 再进入购买分析能力
```

- [ ] **Step 8: Commit the verified Today MVP**

Run:
```bash
git add app/today/actions.ts app/today/page.tsx PROGRESS.md && git commit -m "feat: ship today recommendation mvp"
```

Expected: final commit for the Today MVP implementation.

## Spec Coverage Check

- Stable Today page structure: covered by Task 4
- Weather optional but included when city exists: covered by Task 2 and Task 3
- City optional and editable from Today: covered by Task 3 and Task 4
- Weather failure fallback: covered by Task 2, Task 3, and Task 4
- Rule-based recommendations without LLM: covered by Task 2
- Refresh without persistence: covered by Task 5
- Automated tests and browser QA: covered by Task 5
- OOTD and purchase analysis excluded from this round: enforced by Delivery Boundary and task list scope

## Placeholder Scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Every code-changing step includes concrete file paths, code, commands, and expected results.
- Every test step names the exact suite to run.

## Type Consistency Check

- `TodayView`, `TodayWeatherState`, and `TodayRecommendation` are introduced in Task 1 and used consistently in Tasks 2-5.
- `getWeather`, `generateTodayRecommendations`, `getTodayView`, `updateTodayCityAction`, and `refreshTodayRecommendationsAction` use the same names throughout the plan.
- The route wiring and page props match the tested component API.
