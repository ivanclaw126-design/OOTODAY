# OOTD Feedback MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the smallest real feedback loop to `/today` so a signed-in user can mark one recommendation as worn today, give a required 1-5 satisfaction score, and see the page switch into a same-day recorded state.

**Architecture:** Keep the feature split into four focused units: Today domain types plus note formatting, server-side OOTD read/write helpers, Today server action wiring, and client-side recommendation card state. The server owns duplicate prevention and `ootd` inserts, while the client keeps the interaction inline on the card and locally flips all cards into the recorded state after a successful submit.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR/Auth/Postgres, Vitest, Testing Library

---

## File Structure

### Create

- `lib/today/build-ootd-notes.ts` - formats one `TodayRecommendation` into the human-readable `ootd.notes` string
- `lib/today/get-today-ootd-status.ts` - checks whether the signed-in user already has an OOTD row for today
- `lib/today/save-today-ootd-feedback.ts` - validates score, prevents duplicates, inserts one `ootd` row
- `tests/lib/today/build-ootd-notes.test.ts` - unit tests for note formatting
- `tests/lib/today/save-today-ootd-feedback.test.ts` - unit tests for duplicate prevention and insert payload

### Modify

- `lib/today/types.ts:10-35` - add Today OOTD status type and include it in `TodayView`
- `lib/today/get-today-view.ts:1-55` - load same-day OOTD status alongside recommendation data
- `app/today/actions.ts:1-34` - add submit action for Today OOTD feedback
- `app/today/page.tsx:1-50` - pass the submit action into `TodayPage`
- `components/today/today-page.tsx:1-62` - keep local recorded state after a successful submit
- `components/today/today-recommendation-list.tsx:1-27` - pass OOTD state and submit handler to each recommendation card
- `components/today/today-recommendation-card.tsx:1-31` - add CTA, rating chooser, submit state, error state, and recorded state
- `tests/lib/today/get-today-view.test.ts:1-64` - cover recorded vs not-recorded Today view paths
- `tests/app/today/actions.test.ts:1-45` - cover Today OOTD submit action success and duplicate rejection
- `tests/components/today-page.test.tsx:1-138` - cover CTA render, rating expansion, inline error, and recorded state
- `PROGRESS.md` - mark the OOTD feedback MVP as completed after implementation and verification

---

## Task 1: Add Today OOTD types and note formatting

**Files:**
- Create: `lib/today/build-ootd-notes.ts`
- Modify: `lib/today/types.ts:10-35`
- Test: `tests/lib/today/build-ootd-notes.test.ts`

- [x] **Step 1: Write the failing note-formatting tests**

Create `tests/lib/today/build-ootd-notes.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { buildOotdNotes } from '@/lib/today/build-ootd-notes'

describe('buildOotdNotes', () => {
  it('formats a dress recommendation with outer layer and reason', () => {
    expect(
      buildOotdNotes({
        id: 'rec-1',
        reason: '一件完成搭配',
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
      })
    ).toBe('OOTD: 针织连衣裙；外层建议：西装外套；理由：一件完成搭配')
  })

  it('formats a separates recommendation and keeps missing bottom explicit', () => {
    expect(
      buildOotdNotes({
        id: 'rec-2',
        reason: '先用已有单品起一套思路',
        top: {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: 'T恤',
          colorCategory: '白色',
          styleTags: ['基础']
        },
        bottom: null,
        dress: null,
        outerLayer: null
      })
    ).toBe('OOTD: T恤 + 待补充下装；理由：先用已有单品起一套思路')
  })
})
```

- [x] **Step 2: Run the note-formatting test to verify it fails**

Run:
```bash
npm test -- tests/lib/today/build-ootd-notes.test.ts
```

Expected: FAIL because `@/lib/today/build-ootd-notes` does not exist yet.

- [x] **Step 3: Implement the Today OOTD types and note formatter**

Replace the bottom of `lib/today/types.ts` with:
```ts
export type TodayOotdStatus =
  | { status: 'not-recorded' }
  | { status: 'recorded'; wornAt: string }

export type TodayView = {
  itemCount: number
  city: string | null
  weatherState: TodayWeatherState
  recommendations: TodayRecommendation[]
  recommendationError: boolean
  ootdStatus: TodayOotdStatus
}
```

Create `lib/today/build-ootd-notes.ts`:
```ts
import type { TodayRecommendation, TodayRecommendationItem } from '@/lib/today/types'

function itemName(item: TodayRecommendationItem | null, fallback: string) {
  return item?.subCategory ?? item?.category ?? fallback
}

export function buildOotdNotes(recommendation: TodayRecommendation) {
  const summary = recommendation.dress
    ? `OOTD: ${itemName(recommendation.dress, '待补充主件')}`
    : `OOTD: ${itemName(recommendation.top, '待补充上装')} + ${itemName(recommendation.bottom, '待补充下装')}`

  const outerLayer = recommendation.outerLayer
    ? `；外层建议：${itemName(recommendation.outerLayer, '待补充外套')}`
    : ''

  return `${summary}${outerLayer}；理由：${recommendation.reason}`
}
```

- [x] **Step 4: Run the note-formatting test to verify it passes**

Run:
```bash
npm test -- tests/lib/today/build-ootd-notes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the Today OOTD type and note formatting changes**

Run:
```bash
git add lib/today/types.ts lib/today/build-ootd-notes.ts tests/lib/today/build-ootd-notes.test.ts && git commit -m "feat: add ootd note formatting"
```

Expected: one commit containing the new OOTD status type and note builder.

## Task 2: Add server-side OOTD status lookup and feedback save helpers

**Files:**
- Create: `lib/today/get-today-ootd-status.ts`
- Create: `lib/today/save-today-ootd-feedback.ts`
- Modify: `lib/today/get-today-view.ts:1-55`
- Modify: `tests/lib/today/get-today-view.test.ts:1-64`
- Test: `tests/lib/today/save-today-ootd-feedback.test.ts`
- Test: `tests/lib/today/get-today-view.test.ts`

- [x] **Step 1: Write the failing helper and Today view tests**

Create `tests/lib/today/save-today-ootd-feedback.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const gte = vi.fn()
const lt = vi.fn()
const maybeSingle = vi.fn()
const insert = vi.fn()
const from = vi.fn((table: string) => {
  if (table === 'ootd') {
    return {
      select: () => ({
        eq: () => ({
          gte: () => ({
            lt: () => ({ maybeSingle })
          })
        })
      }),
      insert
    }
  }

  throw new Error(`Unexpected table: ${table}`)
})

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ from }))
}))

describe('saveTodayOotdFeedback', () => {
  beforeEach(() => {
    maybeSingle.mockReset()
    insert.mockReset()
    from.mockClear()
  })

  it('returns a duplicate error when today is already recorded', async () => {
    maybeSingle.mockResolvedValue({
      data: { id: 'ootd-1', worn_at: '2026-04-21T08:00:00.000Z' },
      error: null
    })

    const { saveTodayOotdFeedback } = await import('@/lib/today/save-today-ootd-feedback')

    await expect(
      saveTodayOotdFeedback({
        userId: 'user-1',
        satisfactionScore: 4,
        recommendation: {
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
      })
    ).resolves.toEqual({ error: '今天已经记录过穿搭了', wornAt: null })

    expect(insert).not.toHaveBeenCalled()
  })

  it('inserts one ootd row when no record exists today', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    insert.mockResolvedValue({ error: null })

    const { saveTodayOotdFeedback } = await import('@/lib/today/save-today-ootd-feedback')

    const result = await saveTodayOotdFeedback({
      userId: 'user-1',
      satisfactionScore: 5,
      recommendation: {
        id: 'rec-2',
        reason: '一件完成搭配',
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
        outerLayer: null
      }
    })

    expect(result.error).toBeNull()
    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      worn_at: result.wornAt,
      satisfaction_score: 5,
      notes: 'OOTD: 针织连衣裙；理由：一件完成搭配'
    })
  })
})
```

Replace `tests/lib/today/get-today-view.test.ts` with:
```ts
import { describe, expect, it, vi } from 'vitest'

const getClosetView = vi.fn()
const getWeather = vi.fn()
const generateTodayRecommendations = vi.fn()
const getTodayOotdStatus = vi.fn()

vi.mock('@/lib/closet/get-closet-view', () => ({
  getClosetView
}))

vi.mock('@/lib/today/get-weather', () => ({
  getWeather
}))

vi.mock('@/lib/today/generate-recommendations', () => ({
  generateTodayRecommendations
}))

vi.mock('@/lib/today/get-today-ootd-status', () => ({
  getTodayOotdStatus
}))

describe('getTodayView', () => {
  it('returns non-weather recommendations and not-recorded status when city is missing', async () => {
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
    getTodayOotdStatus.mockResolvedValue({ status: 'not-recorded' })
    generateTodayRecommendations.mockReturnValue([{ id: 'rec-1' }, { id: 'rec-2' }, { id: 'rec-3' }])

    const { getTodayView } = await import('@/lib/today/get-today-view')

    await expect(getTodayView({ userId: 'user-1', city: null })).resolves.toEqual({
      itemCount: 2,
      city: null,
      weatherState: { status: 'not-set' },
      recommendations: [{ id: 'rec-1' }, { id: 'rec-2' }, { id: 'rec-3' }],
      recommendationError: false,
      ootdStatus: { status: 'not-recorded' }
    })

    expect(getWeather).not.toHaveBeenCalled()
  })

  it('returns recorded status when today is already saved', async () => {
    getClosetView.mockResolvedValue({ itemCount: 1, items: [] })
    getWeather.mockResolvedValue(null)
    getTodayOotdStatus.mockResolvedValue({
      status: 'recorded',
      wornAt: '2026-04-21T08:00:00.000Z'
    })
    generateTodayRecommendations.mockReturnValue([])

    const { getTodayView } = await import('@/lib/today/get-today-view')

    await expect(getTodayView({ userId: 'user-1', city: 'Shanghai' })).resolves.toEqual({
      itemCount: 1,
      city: 'Shanghai',
      weatherState: { status: 'unavailable', city: 'Shanghai' },
      recommendations: [],
      recommendationError: false,
      ootdStatus: {
        status: 'recorded',
        wornAt: '2026-04-21T08:00:00.000Z'
      }
    })
  })
})
```

- [x] **Step 2: Run the helper and Today view tests to verify they fail**

Run:
```bash
npm test -- tests/lib/today/save-today-ootd-feedback.test.ts tests/lib/today/get-today-view.test.ts
```

Expected: FAIL because the new helper files do not exist yet and `TodayView` does not return `ootdStatus`.

- [x] **Step 3: Implement the Today OOTD helpers and view wiring**

Create `lib/today/get-today-ootd-status.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { TodayOotdStatus } from '@/lib/today/types'

function todayRange(now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now)
  end.setHours(24, 0, 0, 0)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

export async function getTodayOotdStatus(userId: string): Promise<TodayOotdStatus> {
  const supabase = await createSupabaseServerClient()
  const { start, end } = todayRange()

  const { data, error } = await supabase
    .from('ootd')
    .select('worn_at')
    .eq('user_id', userId)
    .gte('worn_at', start)
    .lt('worn_at', end)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return { status: 'not-recorded' }
  }

  return {
    status: 'recorded',
    wornAt: data.worn_at
  }
}
```

Create `lib/today/save-today-ootd-feedback.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { buildOotdNotes } from '@/lib/today/build-ootd-notes'
import type { TodayRecommendation } from '@/lib/today/types'

function todayRange(now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  const end = new Date(now)
  end.setHours(24, 0, 0, 0)

  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

export async function saveTodayOotdFeedback({
  userId,
  recommendation,
  satisfactionScore
}: {
  userId: string
  recommendation: TodayRecommendation
  satisfactionScore: number
}) {
  if (!Number.isInteger(satisfactionScore) || satisfactionScore < 1 || satisfactionScore > 5) {
    return { error: '请先选择满意度', wornAt: null }
  }

  const supabase = await createSupabaseServerClient()
  const { start, end } = todayRange()

  const { data: existing, error: existingError } = await supabase
    .from('ootd')
    .select('id, worn_at')
    .eq('user_id', userId)
    .gte('worn_at', start)
    .lt('worn_at', end)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return { error: '今天已经记录过穿搭了', wornAt: null }
  }

  const wornAt = new Date().toISOString()
  const { error } = await supabase.from('ootd').insert({
    user_id: userId,
    worn_at: wornAt,
    satisfaction_score: satisfactionScore,
    notes: buildOotdNotes(recommendation)
  })

  if (error) {
    throw error
  }

  return { error: null, wornAt }
}
```

Replace `lib/today/get-today-view.ts` with:
```ts
import { getClosetView } from '@/lib/closet/get-closet-view'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import { getTodayOotdStatus } from '@/lib/today/get-today-ootd-status'
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
  const [closet, ootdStatus] = await Promise.all([getClosetView(userId), getTodayOotdStatus(userId)])

  if (closet.itemCount === 0) {
    return {
      itemCount: 0,
      city,
      weatherState: city ? { status: 'unavailable', city } : { status: 'not-set' },
      recommendations: [],
      recommendationError: false,
      ootdStatus
    }
  }

  if (!city) {
    return {
      itemCount: closet.itemCount,
      city: null,
      weatherState: { status: 'not-set' },
      recommendations: generateTodayRecommendations(closet.items, null, offset),
      recommendationError: false,
      ootdStatus
    }
  }

  const weather = await getWeather(city)

  if (!weather) {
    return {
      itemCount: closet.itemCount,
      city,
      weatherState: { status: 'unavailable', city },
      recommendations: generateTodayRecommendations(closet.items, null, offset),
      recommendationError: false,
      ootdStatus
    }
  }

  return {
    itemCount: closet.itemCount,
    city,
    weatherState: { status: 'ready', weather },
    recommendations: generateTodayRecommendations(closet.items, weather, offset),
    recommendationError: false,
    ootdStatus
  }
}
```

- [x] **Step 4: Run the helper and Today view tests to verify they pass**

Run:
```bash
npm test -- tests/lib/today/save-today-ootd-feedback.test.ts tests/lib/today/get-today-view.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the server-side OOTD helper changes**

Run:
```bash
git add lib/today/get-today-ootd-status.ts lib/today/save-today-ootd-feedback.ts lib/today/get-today-view.ts tests/lib/today/save-today-ootd-feedback.test.ts tests/lib/today/get-today-view.test.ts && git commit -m "feat: add today ootd persistence"
```

Expected: one commit containing duplicate prevention, OOTD insert logic, and Today view status loading.

## Task 3: Wire the submit action through the Today route

**Files:**
- Modify: `app/today/actions.ts:1-34`
- Modify: `app/today/page.tsx:1-50`
- Modify: `tests/app/today/actions.test.ts:1-45`
- Test: `tests/app/today/actions.test.ts`

- [x] **Step 1: Write the failing Today action tests for OOTD submission**

Replace `tests/app/today/actions.test.ts` with:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const eq = vi.fn(() => Promise.resolve({ error: null }))
const from = vi.fn(() => ({ update: () => ({ eq }) }))
const createSupabaseServerClient = vi.fn(async () => ({ from }))
const revalidatePath = vi.fn()
const redirect = vi.fn()
const saveTodayOotdFeedback = vi.fn()

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient
}))

vi.mock('@/lib/today/save-today-ootd-feedback', () => ({
  saveTodayOotdFeedback
}))

vi.mock('next/cache', () => ({
  revalidatePath
}))

vi.mock('next/navigation', () => ({
  redirect
}))

describe('today actions', () => {
  beforeEach(() => {
    getSession.mockReset()
    eq.mockClear()
    from.mockClear()
    createSupabaseServerClient.mockClear()
    revalidatePath.mockReset()
    redirect.mockReset()
    saveTodayOotdFeedback.mockReset()
  })

  it('updates the signed-in user city and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })

    const { updateTodayCityAction } = await import('@/app/today/actions')

    await expect(updateTodayCityAction({ city: 'Shanghai' })).resolves.toEqual({ error: null })
    expect(from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('saves today ootd feedback and revalidates Today', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    const recommendation = {
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

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(
      submitTodayOotdAction({ recommendation, satisfactionScore: 4 })
    ).resolves.toEqual({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    expect(saveTodayOotdFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      recommendation,
      satisfactionScore: 4
    })
    expect(revalidatePath).toHaveBeenCalledWith('/today')
  })

  it('returns duplicate error without revalidating when today is already recorded', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } })
    saveTodayOotdFeedback.mockResolvedValue({
      error: '今天已经记录过穿搭了',
      wornAt: null
    })

    const { submitTodayOotdAction } = await import('@/app/today/actions')

    await expect(
      submitTodayOotdAction({
        recommendation: {
          id: 'rec-1',
          reason: '基础组合稳定不出错',
          top: null,
          bottom: null,
          dress: null,
          outerLayer: null
        },
        satisfactionScore: 4
      })
    ).resolves.toEqual({
      error: '今天已经记录过穿搭了',
      wornAt: null
    })

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates and redirects when refreshing recommendations', async () => {
    const { refreshTodayRecommendationsAction } = await import('@/app/today/actions')

    await refreshTodayRecommendationsAction(3)

    expect(revalidatePath).toHaveBeenCalledWith('/today')
    expect(redirect).toHaveBeenCalledWith('/today?offset=3')
  })
})
```

- [x] **Step 2: Run the Today action test to verify it fails**

Run:
```bash
npm test -- tests/app/today/actions.test.ts
```

Expected: FAIL because `submitTodayOotdAction` does not exist yet.

- [x] **Step 3: Implement the Today submit action and route wiring**

Replace `app/today/actions.ts` with:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { saveTodayOotdFeedback } from '@/lib/today/save-today-ootd-feedback'
import type { TodayRecommendation } from '@/lib/today/types'

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

export async function submitTodayOotdAction({
  recommendation,
  satisfactionScore
}: {
  recommendation: TodayRecommendation
  satisfactionScore: number
}) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const result = await saveTodayOotdFeedback({
    userId: session.user.id,
    recommendation,
    satisfactionScore
  })

  if (!result.error) {
    revalidatePath('/today')
  }

  return result
}

export async function refreshTodayRecommendationsAction(offset: number) {
  revalidatePath('/today')
  redirect(`/today?offset=${offset}`)
}
```

Replace the action wiring in `app/today/page.tsx` with:
```tsx
import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import {
  refreshTodayRecommendationsAction,
  submitTodayOotdAction,
  updateTodayCityAction
} from '@/app/today/actions'
import { getSession } from '@/lib/auth/get-session'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayView } from '@/lib/today/get-today-view'
import type { TodayRecommendation } from '@/lib/today/types'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function TodayRoute({
  searchParams
}: {
  searchParams?: Promise<{ offset?: string }>
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

  const resolvedSearchParams = (await searchParams) ?? {}
  const offset = Number.parseInt(resolvedSearchParams.offset ?? '0', 10)

  const view = await getTodayView({
    userId: session.user.id,
    city: profile?.city ?? null,
    offset: Number.isNaN(offset) ? 0 : offset
  })

  async function updateCity(input: { city: string }) {
    'use server'

    return updateTodayCityAction(input)
  }

  async function submitOotd(input: { recommendation: TodayRecommendation; satisfactionScore: number }) {
    'use server'

    return submitTodayOotdAction(input)
  }

  async function refreshRecommendations() {
    'use server'

    await refreshTodayRecommendationsAction((Number.isNaN(offset) ? 0 : offset) + 1)
  }

  return (
    <TodayPage
      view={view}
      updateCity={updateCity}
      submitOotd={submitOotd}
      refreshRecommendations={refreshRecommendations}
    />
  )
}
```

- [x] **Step 4: Run the Today action test to verify it passes**

Run:
```bash
npm test -- tests/app/today/actions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the Today action wiring changes**

Run:
```bash
git add app/today/actions.ts app/today/page.tsx tests/app/today/actions.test.ts && git commit -m "feat: wire today ootd submit action"
```

Expected: one commit containing the new Today OOTD action and route prop wiring.

## Task 4: Add inline card feedback UI and local recorded state

**Files:**
- Modify: `components/today/today-page.tsx:1-62`
- Modify: `components/today/today-recommendation-list.tsx:1-27`
- Modify: `components/today/today-recommendation-card.tsx:1-31`
- Modify: `tests/components/today-page.test.tsx:1-138`
- Test: `tests/components/today-page.test.tsx`

- [x] **Step 1: Write the failing Today page interaction tests**

Replace `tests/components/today-page.test.tsx` with:
```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TodayPage } from '@/components/today/today-page'

const updateCity = vi.fn().mockResolvedValue({ error: null })
const refreshRecommendations = vi.fn().mockResolvedValue(undefined)
const submitOotd = vi.fn()

const recommendation = {
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

describe('TodayPage', () => {
  beforeEach(() => {
    submitOotd.mockReset()
  })

  it('shows the upload prompt when the closet is empty', () => {
    render(
      <TodayPage
        view={{
          itemCount: 0,
          city: null,
          weatherState: { status: 'not-set' },
          recommendations: [],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' }
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('你的衣橱还是空的')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '去上传衣物' })).toHaveAttribute('href', '/closet')
  })

  it('shows the record CTA on a recommendation card before submission', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: null,
          weatherState: { status: 'not-set' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' }
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByRole('button', { name: '记为今日已穿' })).toBeInTheDocument()
  })

  it('expands the score chooser and requires a score before submit', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: null,
          weatherState: { status: 'not-set' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' }
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '记为今日已穿' }))

    expect(screen.getByRole('button', { name: '1 分' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交今日记录' })).toBeDisabled()
  })

  it('switches the page into recorded state after a successful submit', async () => {
    submitOotd.mockResolvedValue({
      error: null,
      wornAt: '2026-04-21T09:00:00.000Z'
    })

    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: 'Shanghai',
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [recommendation, { ...recommendation, id: 'rec-2' }],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' }
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: '记为今日已穿' })[0])
    fireEvent.click(screen.getByRole('button', { name: '4 分' }))
    fireEvent.click(screen.getByRole('button', { name: '提交今日记录' }))

    await waitFor(() => {
      expect(submitOotd).toHaveBeenCalledWith({ recommendation, satisfactionScore: 4 })
    })

    expect(screen.getAllByText('今日已记录')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: '记为今日已穿' })).not.toBeInTheDocument()
  })

  it('keeps the card expanded and shows inline error when submit fails', async () => {
    submitOotd.mockResolvedValue({
      error: '今日记录保存失败，请稍后重试',
      wornAt: null
    })

    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: null,
          weatherState: { status: 'not-set' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' }
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '记为今日已穿' }))
    fireEvent.click(screen.getByRole('button', { name: '5 分' }))
    fireEvent.click(screen.getByRole('button', { name: '提交今日记录' }))

    expect(await screen.findByText('今日记录保存失败，请稍后重试')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交今日记录' })).toBeInTheDocument()
  })

  it('renders recorded state from the server when today is already saved', () => {
    render(
      <TodayPage
        view={{
          itemCount: 2,
          city: 'Shanghai',
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: {
            status: 'recorded',
            wornAt: '2026-04-21T08:00:00.000Z'
          }
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('今日已记录')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '记为今日已穿' })).not.toBeInTheDocument()
  })
})
```

- [x] **Step 2: Run the Today page test to verify it fails**

Run:
```bash
npm test -- tests/components/today-page.test.tsx
```

Expected: FAIL because `TodayPage` does not accept `submitOotd`, cards do not render the new CTA, and `view.ootdStatus` is missing from the component tree.

- [x] **Step 3: Implement the Today page, list, and card UI**

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
import type { TodayOotdStatus, TodayRecommendation, TodayView } from '@/lib/today/types'

export function TodayPage({
  view,
  updateCity,
  submitOotd,
  refreshRecommendations
}: {
  view: TodayView
  updateCity: (input: { city: string }) => Promise<{ error: string | null }>
  submitOotd: (input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) => Promise<{ error: string | null; wornAt: string | null }>
  refreshRecommendations: () => Promise<void>
}) {
  const [isEditingCity, setIsEditingCity] = useState(false)
  const [ootdStatus, setOotdStatus] = useState<TodayOotdStatus>(view.ootdStatus)

  async function submitTodayOotd(input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) {
    const result = await submitOotd(input)

    if (!result.error && result.wornAt) {
      setOotdStatus({ status: 'recorded', wornAt: result.wornAt })
    }

    return result
  }

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
            ootdStatus={ootdStatus}
            submitOotd={submitTodayOotd}
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

Replace `components/today/today-recommendation-list.tsx` with:
```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { TodayRecommendationCard } from '@/components/today/today-recommendation-card'
import type { TodayOotdStatus, TodayRecommendation } from '@/lib/today/types'

export function TodayRecommendationList({
  recommendations,
  recommendationError,
  ootdStatus,
  submitOotd
}: {
  recommendations: TodayRecommendation[]
  recommendationError: boolean
  ootdStatus: TodayOotdStatus
  submitOotd: (input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) => Promise<{ error: string | null; wornAt: string | null }>
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
        <TodayRecommendationCard
          key={recommendation.id}
          recommendation={recommendation}
          ootdStatus={ootdStatus}
          submitOotd={submitOotd}
        />
      ))}
    </div>
  )
}
```

Replace `components/today/today-recommendation-card.tsx` with:
```tsx
'use client'

import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { TodayOotdStatus, TodayRecommendation } from '@/lib/today/types'

function itemLabel(label: string, value: string | null) {
  return value ? `${label}：${value}` : `${label}：待补充`
}

export function TodayRecommendationCard({
  recommendation,
  ootdStatus,
  submitOotd
}: {
  recommendation: TodayRecommendation
  ootdStatus: TodayOotdStatus
  submitOotd: (input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) => Promise<{ error: string | null; wornAt: string | null }>
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRecorded = ootdStatus.status === 'recorded'

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

        {isRecorded ? (
          <p className="text-sm font-medium text-[var(--color-primary)]">今日已记录</p>
        ) : isConfirming ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <SecondaryButton
                  key={score}
                  type="button"
                  aria-pressed={selectedScore === score}
                  onClick={() => setSelectedScore(score)}
                >
                  {score} 分
                </SecondaryButton>
              ))}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <PrimaryButton
                type="button"
                disabled={isSubmitting || selectedScore === null}
                onClick={async () => {
                  setIsSubmitting(true)
                  setError(null)
                  const result = await submitOotd({
                    recommendation,
                    satisfactionScore: selectedScore ?? 0
                  })
                  setIsSubmitting(false)

                  if (result.error) {
                    setError(result.error)
                    return
                  }

                  setIsConfirming(false)
                }}
              >
                提交今日记录
              </PrimaryButton>
              <SecondaryButton
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsConfirming(false)
                  setSelectedScore(null)
                  setError(null)
                }}
              >
                取消
              </SecondaryButton>
            </div>
          </div>
        ) : (
          <PrimaryButton
            type="button"
            onClick={() => {
              setIsConfirming(true)
              setSelectedScore(null)
              setError(null)
            }}
          >
            记为今日已穿
          </PrimaryButton>
        )}
      </div>
    </Card>
  )
}
```

- [x] **Step 4: Run the Today page test to verify it passes**

Run:
```bash
npm test -- tests/components/today-page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the Today OOTD UI changes**

Run:
```bash
git add components/today/today-page.tsx components/today/today-recommendation-list.tsx components/today/today-recommendation-card.tsx tests/components/today-page.test.tsx && git commit -m "feat: add today ootd card flow"
```

Expected: one commit containing the inline record CTA, satisfaction picker, error handling, and recorded state UI.

## Task 5: Verify the full feature and update project progress

**Files:**
- Modify: `PROGRESS.md`
- Test: `tests/lib/today/build-ootd-notes.test.ts`
- Test: `tests/lib/today/save-today-ootd-feedback.test.ts`
- Test: `tests/lib/today/get-today-view.test.ts`
- Test: `tests/app/today/actions.test.ts`
- Test: `tests/components/today-page.test.tsx`

- [x] **Step 1: Run the focused OOTD test set**

Run:
```bash
npm test -- tests/lib/today/build-ootd-notes.test.ts tests/lib/today/save-today-ootd-feedback.test.ts tests/lib/today/get-today-view.test.ts tests/app/today/actions.test.ts tests/components/today-page.test.tsx
```

Expected: PASS for all OOTD feedback coverage.

- [x] **Step 2: Run the full test suite**

Run:
```bash
npm test
```

Expected: PASS with no regressions in Closet Upload or Today recommendation coverage.

- [x] **Step 3: Run the local app and do one manual Today flow check**

Run:
```bash
npm run dev
```

Then verify in the browser on `/today` with a signed-in user that has closet data:
```text
1. One recommendation card shows the "记为今日已穿" button.
2. Clicking it expands the 1-5 score choices inside the card.
3. The submit button stays disabled until a score is selected.
4. After submit, the page stays on /today and every card shows "今日已记录".
5. Refreshing the page keeps the recorded state.
```

- [x] **Step 4: Update `PROGRESS.md` to record the shipped OOTD MVP**

Edit `PROGRESS.md` so the current state and completed Today work include these exact facts:
```md
- Today recommendation cards now support "记为今日已穿" feedback ✓
- OOTD feedback writes one same-day row to `ootd` ✓
- Satisfaction score 1-5 is required before submit ✓
- Same-day duplicate OOTD submission is blocked ✓
```

Also update the test count line to the new passing total after the suite completes.

- [ ] **Step 5: Commit verification and progress updates**

Run:
```bash
git add PROGRESS.md && git commit -m "docs: update progress for ootd feedback mvp"
```

Expected: one final docs commit after tests and manual verification are complete.
