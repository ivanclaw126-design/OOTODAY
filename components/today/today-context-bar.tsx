'use client'

import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { TodayScene, TodayTargetDate, TodayWeatherState } from '@/lib/today/types'

const sceneOptions: Array<{ value: TodayScene; label: string }> = [
  { value: null, label: '智能默认' },
  { value: 'work', label: '通勤干净' },
  { value: 'casual', label: '轻松日常' },
  { value: 'date', label: '约会聚会' },
  { value: 'travel', label: '城市旅行' },
  { value: 'outdoor', label: '运动户外' }
]

const targetDateOptions: Array<{ value: TodayTargetDate; label: string }> = [
  { value: 'today', label: '今天' },
  { value: 'tomorrow', label: '明天' }
]

function sceneLabel(scene: TodayScene) {
  return sceneOptions.find((option) => option.value === scene)?.label ?? '智能默认'
}

function weatherLabel(city: string | null, weatherState: TodayWeatherState) {
  if (weatherState.status === 'ready') {
    return `${city ?? weatherState.weather.city} · ${weatherState.weather.temperatureC}°C ${weatherState.weather.conditionLabel}`
  }

  if (weatherState.status === 'unavailable') {
    return `${city ?? weatherState.city} · 天气暂不可用`
  }

  return '未设置城市'
}

function chipClass(isSelected = false) {
  return [
    'inline-flex min-h-14 shrink-0 flex-col items-center justify-center rounded-full px-4 py-2 text-sm font-semibold leading-none transition disabled:opacity-55',
    isSelected
      ? 'bg-[var(--color-primary)] text-white'
      : 'border border-[var(--color-line)] bg-white/78 text-[var(--color-primary)] hover:bg-white'
  ].join(' ')
}

function pickerChipClass(isSelected = false) {
  return [
    'inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold transition disabled:opacity-55',
    isSelected
      ? 'bg-[var(--color-primary)] text-white'
      : 'border border-[var(--color-line)] bg-white text-[var(--color-primary)] hover:bg-[var(--color-surface)]'
  ].join(' ')
}

function ContextChip({
  label,
  value,
  isSelected,
  className = '',
  ...buttonProps
}: {
  label: string
  value: string
  isSelected: boolean
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>) {
  return (
    <button {...buttonProps} className={`${chipClass(isSelected)} ${className}`} aria-label={`${label}：${value}`}>
      <span className={isSelected ? 'text-[10px] font-medium text-white/68' : 'text-[10px] font-medium text-[var(--color-neutral-dark)]'}>
        {label}
      </span>
      <span className="mt-1 whitespace-nowrap">{value}</span>
    </button>
  )
}

export function TodayContextBar({
  city,
  weatherState,
  targetDate,
  scene,
  isRefreshing,
  cityEditor,
  onTargetDateChange,
  onSceneChange,
  onEditCity
}: {
  city: string | null
  weatherState: TodayWeatherState
  targetDate: TodayTargetDate
  scene: TodayScene
  isRefreshing: boolean
  cityEditor?: ReactNode
  onTargetDateChange: (targetDate: TodayTargetDate) => void
  onSceneChange: (scene: TodayScene) => void
  onEditCity: () => void
}) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isScenePickerOpen, setIsScenePickerOpen] = useState(false)
  const dateLabel = targetDate === 'tomorrow' ? '明天' : '今天'
  const hasConfirmedCity = weatherState.status === 'ready' || weatherState.status === 'unavailable' || Boolean(city)

  return (
    <section className="rounded-[1.2rem] border border-[var(--color-line)] bg-white p-2.5">
      <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain bg-transparent pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ContextChip
          type="button"
          label="日期"
          value={dateLabel}
          isSelected
          aria-expanded={isDatePickerOpen}
          aria-controls="today-date-picker"
          aria-pressed="true"
          disabled={isRefreshing}
          onClick={() => setIsDatePickerOpen((current) => !current)}
        />
        <ContextChip
          type="button"
          label="地点"
          value={weatherLabel(city, weatherState)}
          isSelected={hasConfirmedCity}
          className="min-w-[9.5rem]"
          aria-pressed={hasConfirmedCity}
          disabled={isRefreshing}
          onClick={onEditCity}
        />
        <ContextChip
          type="button"
          label="场景"
          value={sceneLabel(scene)}
          isSelected
          className="min-w-[6.5rem]"
          aria-expanded={isScenePickerOpen}
          aria-controls="today-scene-picker"
          aria-pressed="true"
          disabled={isRefreshing}
          onClick={() => {
            setIsDatePickerOpen(false)
            setIsScenePickerOpen((current) => !current)
          }}
        />
      </div>
      {isDatePickerOpen ? (
        <div
          id="today-date-picker"
          className="mt-2 flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {targetDateOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={pickerChipClass(targetDate === option.value)}
              aria-pressed={targetDate === option.value}
              disabled={isRefreshing}
              onClick={() => {
                setIsDatePickerOpen(false)
                onTargetDateChange(option.value)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {isScenePickerOpen ? (
        <div
          id="today-scene-picker"
          className="mt-2 flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sceneOptions.map((option) => (
            <button
              key={option.value ?? 'default'}
              type="button"
              className={pickerChipClass(scene === option.value)}
              aria-pressed={scene === option.value}
              disabled={isRefreshing}
              onClick={() => {
                setIsDatePickerOpen(false)
                setIsScenePickerOpen(false)
                onSceneChange(option.value)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {weatherState.status === 'unavailable' ? (
        <p className="px-1 pt-2 text-xs leading-5 text-[var(--color-neutral-dark)]">暂时没有天气数据，先按智能默认场景整理推荐。</p>
      ) : null}
      {isRefreshing ? (
        <p className="px-1 pt-2 text-xs font-semibold leading-5 text-[var(--color-primary)]">正在更新推荐，当前搭配先保留。</p>
      ) : null}
      {cityEditor ? (
        <div className="mt-3 border-t border-[var(--color-line)] pt-3">
          {cityEditor}
        </div>
      ) : null}
    </section>
  )
}
