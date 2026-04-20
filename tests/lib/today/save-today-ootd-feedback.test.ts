import { beforeEach, describe, expect, it, vi } from 'vitest'

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

  it('returns a duplicate error when the insert hits the unique day constraint', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    insert.mockResolvedValue({ error: { code: '23505' } })

    const { saveTodayOotdFeedback } = await import('@/lib/today/save-today-ootd-feedback')

    await expect(
      saveTodayOotdFeedback({
        userId: 'user-1',
        satisfactionScore: 5,
        recommendation: {
          id: 'rec-3',
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
  })
})
