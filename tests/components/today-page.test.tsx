import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/components/theme/theme-provider'
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

const completeRecommendation = {
  ...recommendation,
  id: 'rec-complete',
  shoes: {
    id: 'shoes-1',
    imageUrl: null,
    category: '鞋履',
    subCategory: '乐福鞋',
    colorCategory: '黑色',
    styleTags: ['通勤']
  },
  bag: {
    id: 'bag-1',
    imageUrl: null,
    category: '包袋',
    subCategory: '托特包',
    colorCategory: '黑色',
    styleTags: ['通勤']
  },
  accessories: [
    {
      id: 'accessory-1',
      imageUrl: null,
      category: '配饰',
      subCategory: '腰带',
      colorCategory: '黑色',
      styleTags: ['通勤']
    }
  ],
  missingSlots: ['outerLayer' as const],
  confidence: 82,
  componentScores: {
    colorHarmony: 92,
    silhouetteBalance: 78,
    layering: 62,
    focalPoint: 70,
    sceneFit: 86,
    weatherComfort: 74,
    completeness: 88,
    freshness: 80
  },
  mode: 'daily' as const
}

const inspirationRecommendation = {
  ...completeRecommendation,
  id: 'rec-inspiration',
  mode: 'inspiration' as const,
  inspirationReason: '低频灵感尝试',
  dailyDifference: '比你的日常推荐更强调鞋履存在感，但颜色和场景仍在安全范围内。'
}

describe('TodayPage', () => {
  beforeEach(() => {
    updateCity.mockClear()
    submitOotd.mockReset()
    refreshRecommendations.mockReset()
    refreshRecommendations.mockResolvedValue({ recommendations: [] })
    changePassword.mockReset()
    changePassword.mockResolvedValue({ error: null })
    updateHistoryEntry.mockReset()
    updateHistoryEntry.mockResolvedValue({ error: null, entry: null })
    deleteHistoryEntry.mockReset()
    deleteHistoryEntry.mockResolvedValue({ error: null })
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-theme-switching')
    window.localStorage.clear()
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
    expect(screen.getByRole('link', { name: '去上传衣物' })).toHaveAttribute('href', '/closet?onboarding=1')
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

    expect(screen.getByRole('button', { name: '记为今日已穿并评分' })).toBeInTheDocument()
  })

  it('invites users to fill the style questionnaire before it is completed', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: null,
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          hasCompletedStyleQuestionnaire: false,
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

    const engineInvite = screen.getByText('先让 AI 认识你的穿法')
    const statusHeading = screen.getByText('今日状态')
    expect(engineInvite).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '填写风格问卷' })).toHaveAttribute('href', '/preferences')
    expect(engineInvite.compareDocumentPosition(statusHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows weather facts in the status card without confidence or preview blocks', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: '上海',
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: {
            status: 'ready',
            weather: {
              city: 'Shanghai',
              temperatureC: 24,
              conditionLabel: '晴',
              isWarm: true,
              isCold: false
            }
          },
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

    expect(screen.getByText('温度')).toBeInTheDocument()
    expect(screen.getByText('24°C')).toBeInTheDocument()
    expect(screen.getByText('地点')).toBeInTheDocument()
    expect(screen.getByText('上海')).toBeInTheDocument()
    expect(screen.queryByText('Shanghai')).not.toBeInTheDocument()
    expect(screen.getByText('天气')).toBeInTheDocument()
    expect(screen.getAllByText('晴').length).toBeGreaterThan(0)
    expect(screen.queryByText('匹配度')).not.toBeInTheDocument()
    expect(screen.queryByText('穿搭重点')).not.toBeInTheDocument()
    expect(screen.queryByText('接下来 1-3 天可以先这样用')).not.toBeInTheDocument()
    expect(screen.queryByText('用于判断外层、材质和鞋履舒适度。')).not.toBeInTheDocument()
  })

  it('opens the city form directly under the city button', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: '上海',
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'unavailable', city: '上海' },
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

    const cityButton = screen.getByRole('button', { name: '修改城市' })
    fireEvent.click(cityButton)

    const cityInput = screen.getByRole('textbox', { name: '常住城市' })
    expect(cityInput).toBeInTheDocument()
    expect(cityButton.compareDocumentPosition(cityInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders full outfit slots and a gentle missing-slot hint', () => {
    render(
      <TodayPage
        view={{
          itemCount: 6,
          city: null,
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'not-set' },
          recommendations: [completeRecommendation],
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

    expect(screen.getByText('完整度 82')).toBeInTheDocument()
    expect(screen.getByText('鞋包配饰')).toBeInTheDocument()
    expect(screen.getAllByText(/乐福鞋/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/托特包/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/腰带/).length).toBeGreaterThan(0)
    expect(screen.getByText('这套还缺 外层，可以先按主组合穿，后续在衣橱里补齐会更完整。')).toBeInTheDocument()
  })

  it('renders inspiration attempt labeling and daily-difference copy', () => {
    render(
      <TodayPage
        view={{
          itemCount: 6,
          city: null,
          accountEmail: 'user@example.com',
          passwordBootstrapped: true,
          passwordChangedAt: null,
          weatherState: { status: 'not-set' },
          recommendations: [inspirationRecommendation],
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

    expect(screen.getAllByText('灵感尝试').length).toBeGreaterThan(0)
    expect(screen.getByText('低频灵感尝试')).toBeInTheDocument()
    expect(screen.getByText('比你的日常推荐更强调鞋履存在感，但颜色和场景仍在安全范围内。')).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: '记为今日已穿并评分' }))

    expect(screen.getByRole('button', { name: '1 分' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '颜色好看' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '层次太复杂' })).toBeInTheDocument()
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

    fireEvent.click(screen.getAllByRole('button', { name: '记为今日已穿并评分' })[0])
    fireEvent.click(screen.getByRole('button', { name: '4 分' }))
    fireEvent.click(screen.getByRole('button', { name: '颜色好看' }))
    fireEvent.click(screen.getByRole('button', { name: '适合今天' }))
    fireEvent.click(screen.getByRole('button', { name: '提交今日记录' }))

    await waitFor(() => {
      expect(submitOotd).toHaveBeenCalledWith({
        recommendation,
        satisfactionScore: 4,
        reasonTags: ['like_color', 'like_scene_fit']
      })
    })

    expect(screen.getByText('今日已记录')).toBeInTheDocument()
    expect(screen.getByText('今天已记录，其他方案暂时锁定')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '记为今日已穿并评分' })).not.toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: '记为今日已穿并评分' }))
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

    expect(screen.getByText('今天已记录，其他方案暂时锁定')).toBeInTheDocument()
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

  it('shows theme cards in settings and applies the selected theme', async () => {
    render(
      <ThemeProvider>
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
      </ThemeProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: '设置' }))

    expect(screen.getByText('界面配色主题')).toBeInTheDocument()
    expect(screen.getByText('Gallery Blue')).toBeInTheDocument()
    expect(screen.getByText('Luxury editorial tone')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '切换到 Gallery Blue' }))

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('gallery-blue')
    })

    expect(window.localStorage.getItem('ootoday-theme')).toBe('gallery-blue')
  })
})
