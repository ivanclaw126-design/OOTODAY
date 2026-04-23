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
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(240,233,223,0.92)_100%)]">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">Today / status</p>
            <p className="text-xs text-[var(--color-neutral-dark)]">{todayLabel}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            穿搭决策中
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-[var(--color-panel)] text-white shadow-[var(--shadow-strong)]">
          <div className="space-y-2 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/58">Daily engine</p>
            <p className="max-w-lg text-2xl leading-[0.96] font-semibold tracking-[-0.05em] sm:text-[2rem]">今天穿什么，先用一眼能做决定的方式告诉你。</p>
            <p className="max-w-2xl text-sm text-white/72">{summary}</p>
          </div>

          <div className="grid gap-px bg-white/8 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-white/3 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/56">Signal</p>
              <p className="mt-3 text-5xl font-semibold tracking-[-0.08em] text-[var(--color-accent)]">94%</p>
              <p className="mt-2 text-sm text-white/70">Match confidence based on wardrobe depth and current weather.</p>
            </div>
            <div className="bg-white/4 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/56">Focus</p>
              <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">少一点解释，多一点可执行建议。</p>
              <p className="mt-2 text-sm text-white/70">下面的推荐会优先保留最容易直接穿出门的组合。</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
