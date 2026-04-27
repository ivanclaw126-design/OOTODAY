import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TodayOutfitHero } from '@/components/today/today-outfit-hero'
import type { TodayRecommendation, TodayWeatherState } from '@/lib/today/types'

const baseRecommendation: TodayRecommendation = {
  id: 'rec-hero',
  reason: '基础组合稳定',
  top: {
    id: 'top-1',
    imageUrl: 'https://example.com/top.png',
    category: '上衣',
    subCategory: '白衬衫',
    colorCategory: '白色',
    styleTags: []
  },
  bottom: {
    id: 'bottom-1',
    imageUrl: null,
    category: '裤装',
    subCategory: '西裤',
    colorCategory: '黑色',
    styleTags: []
  },
  dress: null,
  outerLayer: null,
  shoes: {
    id: 'shoes-1',
    imageUrl: null,
    category: '鞋履',
    subCategory: '乐福鞋',
    colorCategory: '黑色',
    styleTags: []
  },
  bag: {
    id: 'bag-1',
    imageUrl: null,
    category: '包袋',
    subCategory: '托特包',
    colorCategory: '黑色',
    styleTags: []
  },
  accessories: [
    { id: 'a-1', imageUrl: null, category: '配饰', subCategory: '腰带', colorCategory: '黑色', styleTags: [] },
    { id: 'a-2', imageUrl: null, category: '配饰', subCategory: '丝巾', colorCategory: '蓝色', styleTags: [] }
  ],
  missingSlots: [],
  confidence: 88,
  componentScores: {
    colorHarmony: 80,
    silhouetteBalance: 80,
    layering: 80,
    focalPoint: 80,
    sceneFit: 80,
    weatherComfort: 80,
    completeness: 80,
    freshness: 80
  },
  mode: 'daily'
}

describe('TodayOutfitHero', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders top/bottom flatlay with image alt and fallback text', () => {
    render(<TodayOutfitHero recommendation={baseRecommendation} variant="hero" />)

    expect(screen.getByAltText('上装：白色白衬衫')).toBeInTheDocument()
    expect(screen.getByText('西裤')).toBeInTheDocument()
    expect(screen.getByText('乐福鞋')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '显示配饰' })).toHaveTextContent('+2')

    fireEvent.click(screen.getByRole('button', { name: '显示配饰' }))

    expect(screen.getByText('配饰')).toBeInTheDocument()
    expect(screen.getByText('腰带')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '显示包袋' })).toBeInTheDocument()
  })

  it('replaces the visible bag or accessory slot only', () => {
    const onRequestReplace = vi.fn()

    render(
      <TodayOutfitHero
        recommendation={baseRecommendation}
        replaceableSlots={['bag', 'accessories']}
        onRequestReplace={onRequestReplace}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '更换包袋' }))
    expect(onRequestReplace).toHaveBeenLastCalledWith('bag', baseRecommendation.bag)

    fireEvent.click(screen.getByRole('button', { name: '显示配饰' }))
    fireEvent.click(screen.getByRole('button', { name: '更换配饰' }))

    expect(onRequestReplace).toHaveBeenLastCalledWith('accessories', baseRecommendation.accessories[0])
  })

  it('renders dress as the central item', () => {
    render(
      <TodayOutfitHero
        recommendation={{
          ...baseRecommendation,
          top: null,
          bottom: null,
          dress: {
            id: 'dress-1',
            imageUrl: null,
            category: '连衣裙',
            subCategory: '针织连衣裙',
            colorCategory: '米色',
            styleTags: []
          }
        }}
      />
    )

    expect(screen.getByText('针织连衣裙')).toBeInTheDocument()
    expect(screen.getByText('主件')).toBeInTheDocument()
  })

  it('explains when warm weather does not need an outer layer', () => {
    const weatherState: TodayWeatherState = {
      status: 'ready',
      weather: {
        city: '上海',
        temperatureC: 27,
        conditionLabel: '晴',
        isWarm: true,
        isCold: false
      }
    }

    render(<TodayOutfitHero recommendation={baseRecommendation} weatherState={weatherState} />)

    expect(screen.getByText('27°C 偏暖，不建议加外套')).toBeInTheDocument()
  })

  it('explains when the outfit needs an outer layer but none is available', () => {
    const weatherState: TodayWeatherState = {
      status: 'ready',
      weather: {
        city: '上海',
        temperatureC: 8,
        conditionLabel: '阴',
        isWarm: false,
        isCold: true
      }
    }

    render(
      <TodayOutfitHero
        recommendation={{
          ...baseRecommendation,
          missingSlots: ['outerLayer']
        }}
        weatherState={weatherState}
      />
    )

    expect(screen.getByText('天气偏冷，缺少合适外套')).toBeInTheDocument()
  })

  it('renders floating replace buttons for replaceable slots', () => {
    const onRequestReplace = vi.fn()

    render(
      <TodayOutfitHero
        recommendation={baseRecommendation}
        replaceableSlots={['top', 'shoes']}
        onRequestReplace={onRequestReplace}
      />
    )

    expect(screen.getByRole('button', { name: '更换上装' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '更换鞋履' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '更换下装' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '更换鞋履' }))

    expect(onRequestReplace).toHaveBeenCalledWith('shoes', baseRecommendation.shoes)
  })

  it('hides floating replace buttons when no slots are replaceable', () => {
    render(<TodayOutfitHero recommendation={baseRecommendation} />)

    expect(screen.queryByRole('button', { name: /更换/u })).not.toBeInTheDocument()
  })
})
