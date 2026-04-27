import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TodayContextBar } from '@/components/today/today-context-bar'

describe('TodayContextBar', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders city weather and handles date, scene, and city clicks', () => {
    const onTargetDateChange = vi.fn()
    const onSceneChange = vi.fn()
    const onEditCity = vi.fn()

    render(
      <TodayContextBar
        city="上海"
        weatherState={{
          status: 'ready',
          weather: {
            city: 'Shanghai',
            temperatureC: 16,
            conditionLabel: '晴',
            isWarm: false,
            isCold: false
          }
        }}
        targetDate="today"
        scene="work"
        isRefreshing={false}
        onTargetDateChange={onTargetDateChange}
        onSceneChange={onSceneChange}
        onEditCity={onEditCity}
      />
    )

    expect(screen.queryByText('今天 · 上海 · 16°C 晴 · 通勤干净')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '日期：今天' }))
    fireEvent.click(screen.getByRole('button', { name: '明天' }))
    fireEvent.click(screen.getByRole('button', { name: '场景：通勤干净' }))
    fireEvent.click(screen.getByRole('button', { name: '轻松日常' }))
    fireEvent.click(screen.getByRole('button', { name: '地点：上海 · 16°C 晴' }))

    expect(onTargetDateChange).toHaveBeenCalledWith('tomorrow')
    expect(onSceneChange).toHaveBeenCalledWith('casual')
    expect(onEditCity).toHaveBeenCalled()
  })

  it('renders city fallback and disables controls while refreshing', () => {
    render(
      <TodayContextBar
        city={null}
        weatherState={{ status: 'not-set' }}
        targetDate="today"
        scene={null}
        isRefreshing
        onTargetDateChange={vi.fn()}
        onSceneChange={vi.fn()}
        onEditCity={vi.fn()}
      />
    )

    expect(screen.queryByText('更新中')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '日期：今天' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '地点：未设置城市' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '场景：智能默认' })).toBeDisabled()
  })
})
