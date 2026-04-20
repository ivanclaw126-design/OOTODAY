import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TodayPage } from '@/components/today/today-page'

const updateCity = vi.fn().mockResolvedValue({ error: null })
const refreshRecommendations = vi.fn().mockResolvedValue(undefined)

describe('TodayPage', () => {
  it('shows the upload prompt when the closet is empty', () => {
    render(
      <TodayPage
        view={{
          itemCount: 0,
          city: null,
          weatherState: { status: 'not-set' },
          recommendations: [],
          recommendationError: false
        }}
        updateCity={updateCity}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('你的衣橱还是空的')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '去上传衣物' })).toHaveAttribute('href', '/closet')
  })

  it('shows recommendations and city prompt when city is missing', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: null,
          weatherState: { status: 'not-set' },
          recommendations: [
            {
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
          ],
          recommendationError: false
        }}
        updateCity={updateCity}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('填写常住城市，可获得更准确推荐')).toBeInTheDocument()
    expect(screen.getByText('基础组合稳定不出错')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '设置城市' })).toBeInTheDocument()
  })

  it('shows weather-aware status when weather is ready', () => {
    render(
      <TodayPage
        view={{
          itemCount: 3,
          city: 'Shanghai',
          weatherState: {
            status: 'ready',
            weather: {
              city: 'Shanghai',
              temperatureC: 9,
              conditionLabel: 'light rain',
              isWarm: false,
              isCold: true
            }
          },
          recommendations: [
            {
              id: 'rec-1',
              reason: '天气偏冷，可叠加外套',
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
              outerLayer: {
                id: 'outer-1',
                imageUrl: null,
                category: '外套',
                subCategory: '西装外套',
                colorCategory: '藏蓝',
                styleTags: ['通勤']
              }
            }
          ],
          recommendationError: false
        }}
        updateCity={updateCity}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('Shanghai · 9°C · light rain')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '修改城市' })).toBeInTheDocument()
  })

  it('shows weather unavailable fallback copy', () => {
    render(
      <TodayPage
        view={{
          itemCount: 2,
          city: 'Shanghai',
          weatherState: { status: 'unavailable', city: 'Shanghai' },
          recommendations: [],
          recommendationError: false
        }}
        updateCity={updateCity}
        refreshRecommendations={refreshRecommendations}
      />
    )

    expect(screen.getByText('Shanghai · 天气暂时不可用')).toBeInTheDocument()
  })
})
