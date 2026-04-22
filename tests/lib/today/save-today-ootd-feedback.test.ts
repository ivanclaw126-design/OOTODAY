import { beforeEach, describe, expect, it, vi } from 'vitest'

const maybeSingle = vi.fn()
const insert = vi.fn()
const itemsIn = vi.fn()
const itemsEq = vi.fn()
const itemsSelect = vi.fn()
const updateEqId = vi.fn()
const updateEqUser = vi.fn()
const update = vi.fn()
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

  if (table === 'items') {
    return {
      select: itemsSelect,
      update
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
    itemsSelect.mockReset()
    itemsEq.mockReset()
    itemsIn.mockReset()
    update.mockReset()
    updateEqUser.mockReset()
    updateEqId.mockReset()
    from.mockClear()

    itemsSelect.mockReturnValue({
      eq: itemsEq
    })
    itemsEq.mockReturnValue({
      in: itemsIn
    })
    itemsIn.mockResolvedValue({ data: [], error: null })
    update.mockReturnValue({
      eq: updateEqUser
    })
    updateEqUser.mockReturnValue({
      eq: updateEqId
    })
    updateEqId.mockResolvedValue({ error: null })
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
    itemsIn.mockResolvedValue({
      data: [{ id: 'dress-1', wear_count: 2 }],
      error: null
    })

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
    expect(itemsIn).toHaveBeenCalledWith('id', ['dress-1'])
    expect(update).toHaveBeenCalledWith({
      last_worn_date: result.wornAt?.slice(0, 10),
      wear_count: 3
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

  it('updates all involved item signals after saving ootd feedback', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null })
    insert.mockResolvedValue({ error: null })
    itemsIn.mockResolvedValue({
      data: [
        { id: 'top-1', wear_count: 4 },
        { id: 'bottom-1', wear_count: 1 },
        { id: 'outer-1', wear_count: 0 }
      ],
      error: null
    })

    const { saveTodayOotdFeedback } = await import('@/lib/today/save-today-ootd-feedback')

    const result = await saveTodayOotdFeedback({
      userId: 'user-1',
      satisfactionScore: 4,
      recommendation: {
        id: 'rec-4',
        reason: '天气偏冷，可叠加外套',
        top: {
          id: 'top-1',
          imageUrl: null,
          category: '上衣',
          subCategory: '针织衫',
          colorCategory: '米色',
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
        outerLayer: {
          id: 'outer-1',
          imageUrl: null,
          category: '外套',
          subCategory: '西装外套',
          colorCategory: '藏蓝',
          styleTags: ['通勤']
        }
      }
    })

    const wornDate = result.wornAt?.slice(0, 10)

    expect(itemsIn).toHaveBeenCalledWith('id', ['top-1', 'bottom-1', 'outer-1'])
    expect(update).toHaveBeenNthCalledWith(1, {
      last_worn_date: wornDate,
      wear_count: 5
    })
    expect(update).toHaveBeenNthCalledWith(2, {
      last_worn_date: wornDate,
      wear_count: 2
    })
    expect(update).toHaveBeenNthCalledWith(3, {
      last_worn_date: wornDate,
      wear_count: 1
    })
  })
})
