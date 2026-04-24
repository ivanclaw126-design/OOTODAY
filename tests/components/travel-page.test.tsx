import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TravelPage } from '@/components/travel/travel-page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/travel'
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
          scenes: [],
          savedPlanId: null
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
          justUpdated: false,
          savedPlanId: 'travel-1',
          editingSavedPlan: {
            id: 'travel-1',
            title: '上海 4天 · 通勤/休闲',
            destinationCity: '上海',
            days: 4,
            scenes: ['通勤', '休闲'],
            weatherSummary: 'Shanghai Municipality · 18°C · moderate rain',
            createdAt: '2026-04-22T07:00:00.000Z',
            source: 'travel_plans'
          },
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
              },
              {
                id: 'comfort-shoes',
                slot: 'comfortShoes',
                categoryLabel: '舒适鞋',
                quantity: 1,
                itemLabels: ['白色 运动鞋'],
                reason: '户外、步行或长途旅行优先保证脚感，一双舒适鞋比多带一件上衣更关键。'
              },
              {
                id: 'bags',
                slot: 'bags',
                categoryLabel: '包袋',
                quantity: 1,
                itemLabels: ['黑色 托特包'],
                reason: '通勤或正式场景需要包袋承接电脑、证件和整体正式感。'
              }
            ],
            dailyPlan: [
              {
                dayLabel: '第 1 天',
                outfitSummary: '白色 衬衫 + 黑色 西裤 + 白色 运动鞋 + 黑色 托特包',
                shoeSummary: '白色 运动鞋',
                bagSummary: '黑色 托特包',
                focus: '先用最稳的一套开局，减少到达当天的决策负担。'
              }
            ],
            missingHints: ['当前衣橱里缺少稳定下装，这会让旅行搭配明显受限。'],
            notes: ['把最稳的下装当成复穿核心，再用上衣切换场景，会比硬塞更多单品更省空间。']
          }
        }}
      />
    )

    expect(screen.getByText('Trip Summary')).toBeInTheDocument()
    expect(screen.getByText('正在编辑已保存方案')).toBeInTheDocument()
    expect(screen.getByText('这次旅行方案已经保存下来了，后面可以继续基于它补细节。')).toBeInTheDocument()
    expect(screen.getByText(/东京 · 4 天/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '更新这份方案' })).toBeInTheDocument()
    expect(screen.getByText('建议打包')).toBeInTheDocument()
    expect(screen.getByText('上衣 · 建议带 3 件')).toBeInTheDocument()
    expect(screen.getByText('舒适鞋 · 建议带 1 件')).toBeInTheDocument()
    expect(screen.getByText('包袋 · 建议带 1 件')).toBeInTheDocument()
    expect(screen.getByText('按天轮换建议')).toBeInTheDocument()
    expect(screen.getByText('第 1 天')).toBeInTheDocument()
    expect(screen.getByText('鞋履：白色 运动鞋')).toBeInTheDocument()
    expect(screen.getByText('包袋：黑色 托特包')).toBeInTheDocument()
    expect(screen.getByText('最近保存方案')).toBeInTheDocument()
    expect(screen.getByText('上海 4天 · 通勤/休闲')).toBeInTheDocument()
    expect(screen.getByText('当前正在编辑这份方案')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '重新打开这份方案' })).toHaveAttribute(
      'href',
      '/travel?savedPlanId=travel-1&city=%E4%B8%8A%E6%B5%B7&days=4&scene=%E9%80%9A%E5%8B%A4&scene=%E4%BC%91%E9%97%B2'
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '删除这份方案' }))
    })

    expect(confirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(deleteSavedPlan).toHaveBeenCalledWith({
        planId: 'travel-1',
        source: 'travel_plans'
      })
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '删除这份方案' })).not.toBeDisabled()
    })
    expect(screen.getByText('风险与缺口')).toBeInTheDocument()
    confirm.mockRestore()
  })

  it('submits the latest draft inputs when saving an edited plan', async () => {
    const { container } = render(
      <TravelPage
        savePlan={vi.fn()}
        deleteSavedPlan={vi.fn()}
        view={{
          status: 'ready',
          itemCount: 5,
          destinationCity: '东京',
          days: 4,
          scenes: ['通勤', '休闲'],
          recentSavedPlans: [],
          justSaved: false,
          justUpdated: false,
          savedPlanId: 'travel-1',
          editingSavedPlan: {
            id: 'travel-1',
            title: '东京 4天 · 通勤/休闲',
            destinationCity: '东京',
            days: 4,
            scenes: ['通勤', '休闲'],
            weatherSummary: 'Japan · 19°C · clear sky',
            createdAt: '2026-04-22T07:00:00.000Z',
            source: 'travel_plans'
          },
          plan: {
            destinationCity: '东京',
            days: 4,
            scenes: ['通勤', '休闲'],
            suggestedOutfitCount: 3,
            weather: null,
            entries: [],
            dailyPlan: [],
            missingHints: [],
            notes: []
          }
        }}
      />
    )

    const plannerForm = container.querySelector('form[action="/travel"]')
    const cityInput = plannerForm?.querySelector('input[name="city"]')
    const daysInput = plannerForm?.querySelector('input[name="days"]')
    const leisureCheckbox = plannerForm?.querySelector('input[name="scene"][value="休闲"]')

    expect(cityInput).not.toBeNull()
    expect(daysInput).not.toBeNull()
    expect(leisureCheckbox).not.toBeNull()

    await act(async () => {
      fireEvent.change(cityInput!, { target: { value: '大阪' } })
      fireEvent.change(daysInput!, { target: { value: '5' } })
      fireEvent.click(leisureCheckbox!)
    })

    const saveForm = container.querySelector('input[name="savedPlanSource"]')?.closest('form')

    expect(saveForm).not.toBeNull()
    expect(saveForm?.querySelector('input[name="city"]')).toHaveAttribute('value', '大阪')
    expect(saveForm?.querySelector('input[name="days"]')).toHaveAttribute('value', '5')
    expect(saveForm?.querySelectorAll('input[name="scene"]')).toHaveLength(1)
    expect(saveForm?.querySelector('input[name="scene"]')).toHaveAttribute('value', '通勤')
  })
})
