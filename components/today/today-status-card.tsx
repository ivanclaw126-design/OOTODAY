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
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[var(--color-neutral-dark)]">{todayLabel}</p>
        <p className="text-lg font-medium">今天穿什么</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">{summary}</p>
      </div>
    </Card>
  )
}
