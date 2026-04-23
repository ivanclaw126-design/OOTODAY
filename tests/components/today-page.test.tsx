import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TodayPage } from '@/components/today/today-page'

const updateCity = vi.fn().mockResolvedValue({ error: null })
const refreshRecommendations = vi.fn().mockResolvedValue({ recommendations: [] })
const submitOotd = vi.fn()
const changePassword = vi.fn().mockResolvedValue({ error: null })
const updateHistoryEntry = vi.fn()
const deleteHistoryEntry = vi.fn()

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
    refreshRecommendations.mockReset()
    refreshRecommendations.mockResolvedValue({ recommendations: [] })
    changePassword.mockReset()
    changePassword.mockResolvedValue({ error: null })
    updateHistoryEntry.mockReset()
    updateHistoryEntry.mockResolvedValue({ error: null, entry: null })
    deleteHistoryEntry.mockReset()
    deleteHistoryEntry.mockResolvedValue({ error: null })
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
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'not-set' },
          recommendations: [],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' },
          recentOotdHistory: []
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
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
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'not-set' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' },
          recentOotdHistory: []
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
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
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'not-set' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' },
          recentOotdHistory: []
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
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
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [recommendation, { ...recommendation, id: 'rec-2' }],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' },
          recentOotdHistory: []
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
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
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'not-set' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' },
          recentOotdHistory: []
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
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
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: '2026-04-21T10:00:00.000Z',
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: {
            status: 'recorded',
            wornAt: '2026-04-21T08:00:00.000Z'
          },
          recentOotdHistory: []
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('今日已记录')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '记为今日已穿' })).not.toBeInTheDocument()
  })

  it('renders recent ootd history when entries exist', () => {
    render(
      <TodayPage
        view={{
          itemCount: 2,
          city: 'Shanghai',
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: '2026-04-21T10:00:00.000Z',
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: {
            status: 'recorded',
            wornAt: '2026-04-21T08:00:00.000Z'
          },
          recentOotdHistory: [
            {
              id: 'ootd-1',
              wornAt: '2026-04-20T08:00:00.000Z',
              satisfactionScore: 4,
              notes: 'OOTD: 衬衫 + 西裤；理由：基础组合稳定不出错'
            }
          ]
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('最近穿搭记录')).toBeInTheDocument()
    expect(screen.getByText('4 / 5 分')).toBeInTheDocument()
    expect(screen.getByText('OOTD: 衬衫 + 西裤；理由：基础组合稳定不出错')).toBeInTheDocument()
  })

  it('requests the next recommendation offset when refreshing', async () => {
    refreshRecommendations.mockResolvedValueOnce({
      recommendations: [{ ...recommendation, id: 'rec-next', reason: '新的轮换建议' }]
    })

    render(
      <TodayPage
        view={{
          itemCount: 2,
          city: 'Shanghai',
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: { status: 'not-recorded' },
          recentOotdHistory: []
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '换一批推荐' }))

    await waitFor(() => {
      expect(refreshRecommendations).toHaveBeenCalledWith({ offset: 1 })
    })
    expect(await screen.findByText('新的轮换建议')).toBeInTheDocument()
  })

  it('shows default password guidance and lets the user submit a new password', async () => {
    render(
      <TodayPage
        view={{
          itemCount: 2,
          city: 'Shanghai',
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [recommendation],
          recommendationError: false,
          ootdStatus: {
            status: 'recorded',
            wornAt: '2026-04-21T08:00:00.000Z'
          },
          recentOotdHistory: []
        }}
        updateCity={updateCity}
        submitOotd={submitOotd}
        refreshRecommendations={refreshRecommendations}
        changePassword={changePassword}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    expect(screen.getByText(/默认密码/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '立即修改密码' }))
    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'betterpass123' } })
    fireEvent.change(screen.getByLabelText('确认新密码'), { target: { value: 'betterpass123' } })
    fireEvent.click(screen.getByRole('button', { name: '更新密码' }))

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        password: 'betterpass123',
        confirmPassword: 'betterpass123'
      })
    })
  })
})
