import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TravelPage } from '@/components/travel/travel-page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() })
}))

describe('TravelPage', () => {
  it('shows the planner prompt before a trip is configured', () => {
    render(
      <TravelPage
        savePlan={vi.fn()}
        deleteSavedPlan={vi.fn()}
        view={{
          status: 'idle',
          itemCount: 3,
          destinationCity: null,
          days: null,
          scenes: []
        }}
      />
    )

    expect(screen.getByRole('heading', { name: 'Travel' })).toBeInTheDocument()
    expect(screen.getByText('先告诉我这趟要去哪里')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '生成打包清单' })).toBeInTheDocument()
  })

  it('renders the packing plan when a trip is ready', async () => {
    const deleteSavedPlan = vi.fn().mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <TravelPage
        savePlan={vi.fn()}
        deleteSavedPlan={deleteSavedPlan}
        view={{
          status: 'ready',
          itemCount: 5,
          destinationCity: '东京',
          days: 4,
          scenes: ['通勤', '休闲'],
          recentSavedPlans: [
            {
              id: 'travel-1',
              title: '上海 4天 · 通勤/休闲',
              destinationCity: '上海',
              days: 4,
              scenes: ['通勤', '休闲'],
              weatherSummary: 'Shanghai Municipality · 18°C · moderate rain',
              createdAt: '2026-04-22T07:00:00.000Z',
              source: 'travel_plans'
            }
          ],
          justSaved: true,
          plan: {
            destinationCity: '东京',
            days: 4,
            scenes: ['通勤', '休闲'],
            suggestedOutfitCount: 3,
            weather: {
              city: 'Tokyo',
              temperatureC: 12,
              conditionLabel: 'cloudy',
              isWarm: false,
              isCold: true
            },
            entries: [
              {
                id: 'tops',
                categoryLabel: '上衣',
                quantity: 3,
                itemLabels: ['白色 衬衫', '灰色 针织衫'],
                reason: '上衣按 2 天左右轮换一次来带，能兼顾体积和变化。'
              }
            ],
            dailyPlan: [
              {
                dayLabel: '第 1 天',
                outfitSummary: '白色 衬衫 + 黑色 西裤',
                focus: '先用最稳的一套开局，减少到达当天的决策负担。'
              }
            ],
            missingHints: ['当前衣橱里缺少稳定下装，这会让旅行搭配明显受限。'],
            notes: ['把最稳的下装当成复穿核心，再用上衣切换场景，会比硬塞更多单品更省空间。']
          }
        }}
      />
    )

    expect(screen.getByText('本次行程摘要')).toBeInTheDocument()
    expect(screen.getByText('这次旅行方案已经保存下来了，后面可以继续基于它补细节。')).toBeInTheDocument()
    expect(screen.getByText(/东京 · 4 天/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存这次方案' })).toBeInTheDocument()
    expect(screen.getByText('建议打包')).toBeInTheDocument()
    expect(screen.getByText('上衣 · 建议带 3 件')).toBeInTheDocument()
    expect(screen.getByText('按天轮换建议')).toBeInTheDocument()
    expect(screen.getByText('第 1 天')).toBeInTheDocument()
    expect(screen.getByText('最近保存方案')).toBeInTheDocument()
    expect(screen.getByText('上海 4天 · 通勤/休闲')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '重新打开这份方案' })).toHaveAttribute(
      'href',
      '/travel?savedPlanId=travel-1&city=%E4%B8%8A%E6%B5%B7&days=4&scene=%E9%80%9A%E5%8B%A4&scene=%E4%BC%91%E9%97%B2'
    )
    fireEvent.click(screen.getByRole('button', { name: '删除这份方案' }))
    expect(confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(deleteSavedPlan).toHaveBeenCalledWith({
        planId: 'travel-1',
        source: 'travel_plans'
      })
    })
    expect(screen.getByText('风险与缺口')).toBeInTheDocument()
  })
})
