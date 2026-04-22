import { beforeEach, describe, expect, it, vi } from 'vitest'

const limit = vi.fn()
const order = vi.fn()
const eq = vi.fn()
const select = vi.fn()
const from = vi.fn((table: string) => {
  if (table === 'ootd') {
    return {
      select
    }
  }

  throw new Error(`Unexpected table: ${table}`)
})

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ from }))
}))

describe('getRecentOotdHistory', () => {
  beforeEach(() => {
    from.mockClear()
    select.mockReset()
    eq.mockReset()
    order.mockReset()
    limit.mockReset()

    select.mockReturnValue({ eq })
    eq.mockReturnValue({ order })
    order.mockReturnValue({ limit })
  })

  it('returns the latest ootd entries in view shape', async () => {
    limit.mockResolvedValue({
      data: [
        {
          id: 'ootd-1',
          worn_at: '2026-04-22T08:00:00.000Z',
          satisfaction_score: 4,
          notes: 'OOTD: 白T恤 + 西裤；理由：基础组合稳定不出错'
        }
      ],
      error: null
    })

    const { getRecentOotdHistory } = await import('@/lib/today/get-recent-ootd-history')

    await expect(getRecentOotdHistory('user-1')).resolves.toEqual([
      {
        id: 'ootd-1',
        wornAt: '2026-04-22T08:00:00.000Z',
        satisfactionScore: 4,
        notes: 'OOTD: 白T恤 + 西裤；理由：基础组合稳定不出错'
      }
    ])

    expect(from).toHaveBeenCalledWith('ootd')
    expect(limit).toHaveBeenCalledWith(5)
  })
})
