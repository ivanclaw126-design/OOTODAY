import { Card } from '@/components/ui/card'
import type { TodayWeatherState } from '@/lib/today/types'

export function TodayStatusCard({ city, weatherState }: { city: string | null; weatherState: TodayWeatherState }) {
  const todayLabel = new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date())

  let temperatureLabel = '待设置'
  let locationLabel = '未设置'
  let weatherLabel = '待设置'

  if (weatherState.status === 'ready') {
    temperatureLabel = `${weatherState.weather.temperatureC}°C`
    locationLabel = city ?? weatherState.weather.city
    weatherLabel = weatherState.weather.conditionLabel
  }

  if (weatherState.status === 'unavailable') {
    temperatureLabel = '待更新'
    locationLabel = city ?? weatherState.city
    weatherLabel = '暂不可用'
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

        <div className="overflow-hidden rounded-[1.6rem] bg-[#111111] text-white shadow-[var(--shadow-strong)]">
          <div className="space-y-2 px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/68">今日引擎</p>
            <p className="max-w-[13ch] text-[1.35rem] leading-[0.98] font-semibold tracking-[-0.05em] sm:max-w-lg sm:text-[1.75rem]">今天穿什么，先用一眼能做决定的方式告诉你。</p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-white/10">
            <div className="min-w-0 bg-white/5 px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/62">温度</p>
              <p className="mt-2 truncate text-[1.35rem] font-semibold tracking-[-0.06em] text-[var(--color-accent)] sm:text-3xl">{temperatureLabel}</p>
            </div>
            <div className="min-w-0 bg-white/6 px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/62">地点</p>
              <p className="mt-2 truncate text-base font-semibold tracking-[-0.03em] text-white sm:text-xl">{locationLabel}</p>
            </div>
            <div className="min-w-0 bg-white/6 px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/62">天气</p>
              <p className="mt-2 truncate text-base font-semibold tracking-[-0.03em] text-white sm:text-xl">{weatherLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
