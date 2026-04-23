import { Card } from '@/components/ui/card'
import type { TodayWeatherState } from '@/lib/today/types'

export function TodayStatusCard({ weatherState }: { weatherState: TodayWeatherState }) {
  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date())

  let summary = '未设置常住城市'

  if (weatherState.status === 'ready') {
    summary = `${weatherState.weather.city} · ${weatherState.weather.temperatureC}°C · ${weatherState.weather.conditionLabel}`
  }

  if (weatherState.status === 'unavailable') {
    summary = `${weatherState.city} · 天气暂时不可用`
  }

  return (
    <Card>
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-[var(--color-primary)]/80" />
        <div className="pl-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">
                Today / status
              </p>
              <p className="text-xs text-[var(--color-neutral-dark)]">{todayLabel}</p>
            </div>
            <div className="inline-flex w-fit items-center rounded-full border border-[var(--color-primary)]/15 bg-[var(--color-secondary)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
              穿搭决策中
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-xl leading-tight font-semibold tracking-[-0.04em] sm:text-2xl">今天穿什么</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">{summary}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
