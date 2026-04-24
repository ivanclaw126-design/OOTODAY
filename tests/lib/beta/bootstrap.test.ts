import { beforeEach, describe, expect, it, vi } from 'vitest'

const itemsEq = vi.fn()
const ootdEq = vi.fn()
const maybeSingle = vi.fn()
const select = vi.fn((columns: string, options?: { count?: 'exact'; head?: boolean }) => {
  if (columns === 'city') {
    return {
      eq: vi.fn(() => ({
        maybeSingle
      }))
    }
  }

  if (options?.head) {
    if (columns === 'id' && itemsEq.mock.calls.length === 0) {
      return {
        eq: itemsEq
      }
    }

    return {
      eq: ootdEq
    }
  }

  return {
    eq: vi.fn()
  }
})

const from = vi.fn(() => ({
  select
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from
  }))
}))

describe('getBetaBootstrapState', () => {
  beforeEach(() => {
    from.mockClear()
    select.mockClear()
    itemsEq.mockReset()
    itemsEq.mockResolvedValue({ count: 0 })
    ootdEq.mockReset()
    ootdEq.mockResolvedValue({ count: 0 })
    maybeSingle.mockReset()
    maybeSingle.mockResolvedValue({ data: { city: null } })
  })

  it('routes empty wardrobes into closet onboarding', async () => {
    const { getBetaBootstrapState } = await import('@/lib/beta/bootstrap')

    await expect(getBetaBootstrapState('user-1')).resolves.toEqual({
      itemCount: 0,
      hasCity: false,
      hasOotdHistory: false,
      recommendedEntryRoute: '/closet?onboarding=1'
    })
  })

  it('routes users with items back to today and exposes bootstrap flags', async () => {
    itemsEq.mockResolvedValue({ count: 5 })
    ootdEq.mockResolvedValue({ count: 2 })
    maybeSingle.mockResolvedValue({ data: { city: 'Shanghai' } })

    const { getBetaBootstrapState } = await import('@/lib/beta/bootstrap')

    await expect(getBetaBootstrapState('user-2')).resolves.toEqual({
      itemCount: 5,
      hasCity: true,
      hasOotdHistory: true,
      recommendedEntryRoute: '/today'
    })
  })
})
