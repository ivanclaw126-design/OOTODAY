import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  afterEach(() => {
    cleanup()
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
