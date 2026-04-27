import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { TodayPage } from '@/components/today/today-page'
import {
  RECOMMENDATION_STRATEGY_KEYS,
  type RecommendationModelScores,
  type RecommendationRuleScores,
  type RecommendationScoreBreakdown,
  type RecommendationStrategyScores
} from '@/lib/recommendation/canonical-types'
import type { ScoreWeights } from '@/lib/recommendation/preference-types'

const refresh = vi.fn()
const updateCity = vi.fn().mockResolvedValue({ error: null })
const refreshRecommendations = vi.fn().mockResolvedValue({ recommendations: [], weatherState: { status: 'not-set', targetDate: 'today' } })
const submitOotd = vi.fn()
const changePassword = vi.fn().mockResolvedValue({ error: null })
const signOut = vi.fn().mockResolvedValue(undefined)
const updateHistoryEntry = vi.fn()
const deleteHistoryEntry = vi.fn()

const componentScores: ScoreWeights = {
  colorHarmony: 92,
  silhouetteBalance: 78,
  layering: 62,
  focalPoint: 70,
  sceneFit: 86,
  weatherComfort: 74,
  completeness: 88,
  freshness: 80
}

const ruleScores: RecommendationRuleScores = {
  contextFit: 84,
  visualCompatibility: 86,
  userPreference: 76,
  outfitStrategy: 82,
  weatherPracticality: 74,
  novelty: 80,
  wardrobeRotation: 72,
  trendOverlay: 48,
  explanationQuality: 86
}

const modelScores: RecommendationModelScores = {
  modelRunId: null,
  xgboostScore: null,
  lightfmScore: null,
  implicitScore: null,
  ruleScore: 82,
  finalScore: 82,
  status: 'missing'
}

function strategyScores(overrides: Partial<RecommendationStrategyScores> = {}): RecommendationStrategyScores {
  return Object.fromEntries(
    RECOMMENDATION_STRATEGY_KEYS.map((key) => [key, overrides[key] ?? 58])
  ) as RecommendationStrategyScores
}

const scoreBreakdown: RecommendationScoreBreakdown = {
  totalScore: 84,
  ruleBaselineScore: 82,
  modelScores,
  ruleScores,
  compatibilityScores: {
    color: 92,
    silhouette: 78,
    material: 76,
    formality: 82,
    styleDistance: 80,
    pattern: 78,
    shoesBag: 88,
    temperature: 74,
    scene: 86
  },
  strategyScores: strategyScores({
    outfitFormula: 94,
    capsuleWardrobe: 88,
    occasionNiche: 80,
    trendOverlay: 42
  }),
  componentScores,
  penalties: [],
  explanation: ['穿搭公式命中：核心 slot 组合能形成稳定可复用公式。'],
  riskFlags: ['model_fallback_missing']
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh
  })
}))

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
  reasonHighlights: [
    '穿搭公式命中：核心 slot 组合能形成稳定可复用公式',
    '场景 86：风格线索集中在通勤，适合通勤使用',
    '完整度 88：鞋履、包袋已补齐，出门不用再补关键 slot'
  ],
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
  componentScores,
  scoreBreakdown,
  mode: 'daily' as const
}

const inspirationRecommendation = {
  ...completeRecommendation,
  id: 'rec-inspiration',
  mode: 'inspiration' as const,
  inspirationReason: '灵感套装',
  dailyDifference: '比前两套多一点变化，但没有越过避雷、天气和场景底线。'
}

describe('TodayPage', () => {
  beforeEach(() => {
    refresh.mockReset()
    updateCity.mockClear()
    submitOotd.mockReset()
    refreshRecommendations.mockReset()
    refreshRecommendations.mockResolvedValue({ recommendations: [], weatherState: { status: 'not-set', targetDate: 'today' } })
    changePassword.mockReset()
    changePassword.mockResolvedValue({ error: null })
    signOut.mockReset()
    signOut.mockResolvedValue(undefined)
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('你的衣橱还是空的')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '去上传衣物' })).toHaveAttribute('href', '/closet?onboarding=1')
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument()
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByRole('button', { name: '记为今日已穿并评分' })).toBeInTheDocument()
  })

  it('lets the user dismiss the first loop card', () => {
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('先在今天完成第一次推荐闭环')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭 first loop 提示' }))

    expect(screen.queryByText('先在今天完成第一次推荐闭环')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('ootoday-today-first-loop-dismissed')).toBe('1')
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
        signOut={signOut}
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('今天 · 上海 · 24°C 晴 · 按常用')).toBeInTheDocument()
    expect(screen.getByText(/当前天气/u)).toBeInTheDocument()
    expect(screen.queryByText('Shanghai')).not.toBeInTheDocument()
    expect(screen.queryByText('匹配度')).not.toBeInTheDocument()
    expect(screen.queryByText('穿搭重点')).not.toBeInTheDocument()
    expect(screen.queryByText('接下来 1-3 天可以先这样用')).not.toBeInTheDocument()
    expect(screen.queryByText('用于判断外层、材质和鞋履舒适度。')).not.toBeInTheDocument()
  })

  it('refreshes recommendations for tomorrow without a page refresh', async () => {
    refreshRecommendations.mockResolvedValueOnce({
      recommendations: [{ ...recommendation, id: 'rec-tomorrow', reason: '明天通勤组合' }],
      weatherState: {
        status: 'ready',
        targetDate: 'tomorrow',
        weather: {
          city: 'Shanghai',
          temperatureC: 18,
          conditionLabel: '多云',
          isWarm: false,
          isCold: false,
          targetDate: 'tomorrow',
          sourceLabel: '明天白天预报'
        }
      }
    })

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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('今日推荐')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '明天' }))

    await waitFor(() => {
      expect(refreshRecommendations).toHaveBeenCalledWith({ offset: 0, targetDate: 'tomorrow', scene: null })
    })
    expect(await screen.findByText('明天推荐')).toBeInTheDocument()
    expect(screen.getByText('明天 · 上海 · 18°C 多云 · 按常用')).toBeInTheDocument()
    expect(screen.getByText(/明天白天预报/u)).toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('refreshes recommendations when the Today scene changes', async () => {
    refreshRecommendations.mockResolvedValueOnce({
      recommendations: [{ ...recommendation, id: 'rec-outdoor', reason: '户外舒适组合' }],
      weatherState: { status: 'not-set', targetDate: 'today' }
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '户外' }))

    await waitFor(() => {
      expect(refreshRecommendations).toHaveBeenCalledWith({ offset: 0, targetDate: 'today', scene: 'outdoor' })
    })
    expect(await screen.findByText('按今天的户外、天气和最近穿着整理')).toBeInTheDocument()
  })

  it('opens the city form inside 今日状态', () => {
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    const statusSection = screen.getByText('今日状态').closest('section')
    expect(statusSection).not.toBeNull()

    const cityButton = within(statusSection as HTMLElement).getByRole('button', { name: '修改城市' })
    fireEvent.click(cityButton)

    const cityInput = screen.getByRole('textbox', { name: '常住城市' })
    expect(cityInput).toBeInTheDocument()
    expect(statusSection?.contains(cityInput)).toBe(true)
    expect(cityButton.compareDocumentPosition(cityInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('opens the city form from 今日状态 and hides the city prompt after save', async () => {
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('填写常住城市，可获得更准推荐')).toBeInTheDocument()
    const statusSection = screen.getByText('今日状态').closest('section')
    expect(statusSection).not.toBeNull()

    fireEvent.click(within(statusSection as HTMLElement).getByRole('button', { name: '设置城市' }))
    fireEvent.change(screen.getByRole('textbox', { name: '常住城市' }), { target: { value: '上海' } })
    fireEvent.click(screen.getByRole('button', { name: '保存城市' }))

    await waitFor(() => {
      expect(updateCity).toHaveBeenCalledWith({ city: '上海' })
    })
    expect(screen.queryByText('填写常住城市，可获得更准推荐')).not.toBeInTheDocument()
    expect(refresh).toHaveBeenCalled()
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('完整度 82')).toBeInTheDocument()
    expect(screen.getByText('核心单品')).toBeInTheDocument()
    expect(screen.getByText('待补 外层')).toBeInTheDocument()
    expect(screen.queryByText('鞋包配饰')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '展开单品详情' }))

    expect(screen.getByText('鞋包配饰')).toBeInTheDocument()
    expect(screen.getAllByText(/乐福鞋/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/托特包/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/腰带/).length).toBeGreaterThan(0)
    expect(screen.getByText('这套还缺 外层，可以先按主组合穿，后续在衣橱里补齐会更完整。')).toBeInTheDocument()
  })

  it('renders all strategy scores and opens a strategy explanation popover', () => {
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getByText('这套最能说明差异的 3 个判断')).toBeInTheDocument()
    expect(screen.queryByText('13 个穿搭子策略命中情况')).not.toBeInTheDocument()
    expect(screen.getByText('主命中策略')).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /查看.*策略说明/u })).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: '查看全部 13 项策略' }))

    expect(screen.getByText('13 个穿搭子策略命中情况')).toBeInTheDocument()
    expect(screen.getAllByText('辅助命中').length).toBeGreaterThan(0)
    expect(screen.getAllByText('低信号').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /查看.*策略说明/u })).toHaveLength(13)

    fireEvent.click(screen.getByRole('button', { name: '查看穿搭公式策略说明' }))

    expect(screen.getByRole('dialog', { name: '穿搭公式策略说明' })).toBeInTheDocument()
    expect(screen.getByText('把上装、下装、鞋履或一件式主件组合成低决策成本的固定公式。')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: '穿搭公式策略说明' })).not.toBeInTheDocument()
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    expect(screen.getAllByText('灵感套装').length).toBeGreaterThan(0)
    expect(screen.getByText('比前两套多一点变化，但没有越过避雷、天气和场景底线。')).toBeInTheDocument()
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '记为今日已穿并评分' }))

    expect(screen.getByRole('button', { name: '1 分' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '颜色好看' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '层次太复杂' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交今日记录' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '4 分' }))

    expect(screen.getByRole('button', { name: '4 分' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '提交今日记录' })).not.toBeDisabled()
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
        signOut={signOut}
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

    await waitFor(() => {
      expect(screen.getByText('今日已记录')).toBeInTheDocument()
    })
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
        signOut={signOut}
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
        signOut={signOut}
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
        signOut={signOut}
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
      recommendations: [{ ...recommendation, id: 'rec-next', reason: '新的轮换建议' }],
      weatherState: { status: 'unavailable', city: 'Shanghai', targetDate: 'today' }
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '换一批推荐' }))

    await waitFor(() => {
      expect(refreshRecommendations).toHaveBeenCalledWith({ offset: 1, targetDate: 'today', scene: null })
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
        signOut={signOut}
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

  it('lets the user sign out from Today settings', async () => {
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
        signOut={signOut}
        updateHistoryEntry={updateHistoryEntry}
        deleteHistoryEntry={deleteHistoryEntry}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    fireEvent.click(screen.getByRole('button', { name: '退出当前登录账号' }))

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled()
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
          signOut={signOut}
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
