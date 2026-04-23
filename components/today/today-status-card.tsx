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
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">今日状态</p>
            <p className="text-xs text-[var(--color-neutral-dark)]">{todayLabel}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/72 px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            穿搭决策中
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-[#111111] text-white shadow-[var(--shadow-strong)]">
          <div className="space-y-2 p-4 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/68">今日引擎</p>
            <p className="max-w-[11ch] text-[1.56rem] leading-[0.95] font-semibold tracking-[-0.05em] sm:max-w-lg sm:text-[2rem]">今天穿什么，先用一眼能做决定的方式告诉你。</p>
            <p className="max-w-xl text-sm leading-6 text-white/84 sm:text-sm sm:leading-6">{summary}</p>
          </div>

          <div className="grid gap-px bg-white/10 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-white/5 px-4 py-4 sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">匹配度</p>
              <p className="mt-3 text-[3.25rem] font-semibold tracking-[-0.08em] text-[var(--color-accent)] sm:text-5xl">94%</p>
              <p className="mt-2 text-sm leading-6 text-white/82">根据衣橱完整度和当前天气估算，这一轮推荐已经足够直接拿来做决定。</p>
            </div>
            <div className="bg-white/6 px-4 py-4 sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">穿搭重点</p>
              <p className="mt-3 text-base font-semibold tracking-[-0.03em] sm:text-lg">少一点解释，多一点可执行建议。</p>
              <p className="mt-2 text-sm leading-6 text-white/82">下面的推荐会优先保留最容易直接穿出门的组合，不让你在细节里反复犹豫。</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
