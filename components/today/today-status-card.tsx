import { Card } from '@/components/ui/card'
import type { TodayScene, TodayTargetDate, TodayWeatherState } from '@/lib/today/types'

const targetDateOptions: Array<{ value: TodayTargetDate; label: string }> = [
  { value: 'today', label: '今天' },
  { value: 'tomorrow', label: '明天' }
]

const sceneOptions: Array<{ value: TodayScene; label: string }> = [
  { value: null, label: '按常用' },
  { value: 'work', label: '通勤' },
  { value: 'casual', label: '日常' },
  { value: 'date', label: '约会/聚会' },
  { value: 'travel', label: '旅行' },
  { value: 'outdoor', label: '户外' }
]

function formatStatusDate(targetDate: TodayTargetDate) {
  const date = new Date()

  if (targetDate === 'tomorrow') {
    date.setDate(date.getDate() + 1)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'long'
  }).format(date)
}

function optionClass(isSelected: boolean) {
  return [
    'min-h-10 rounded-full px-3 py-2 text-sm font-semibold transition',
    isSelected
      ? 'bg-[#111111] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)]'
      : 'border border-[var(--color-line)] bg-white/74 text-[var(--color-primary)] hover:bg-white'
  ].join(' ')
}

export function TodayStatusCard({
  city,
  weatherState,
  targetDate = 'today',
  scene = null,
  onTargetDateChange,
  onSceneChange,
  isRefreshing = false
}: {
  city: string | null
  weatherState: TodayWeatherState
  targetDate?: TodayTargetDate
  scene?: TodayScene
  onTargetDateChange?: (targetDate: TodayTargetDate) => void
  onSceneChange?: (scene: TodayScene) => void
  isRefreshing?: boolean
}) {
  const todayLabel = formatStatusDate(targetDate)
  const targetLabel = targetDate === 'tomorrow' ? '明日' : '今日'
  const sourceLabel = weatherState.status === 'ready'
    ? weatherState.weather.sourceLabel ?? (targetDate === 'tomorrow' ? '明天预报' : '当前天气')
    : targetDate === 'tomorrow' ? '明天预报' : '当前天气'
  const controlsEnabled = Boolean(onTargetDateChange && onSceneChange)

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
            <p className="text-[11px] font-semibold uppercase text-[var(--color-neutral-dark)]">{targetLabel}状态</p>
            <p className="text-xs text-[var(--color-neutral-dark)]">{todayLabel}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/72 px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            {sourceLabel}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.6rem] bg-[#111111] text-white shadow-[var(--shadow-strong)]">
          <div className="space-y-2 px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[11px] font-semibold uppercase text-white/68">{targetLabel}引擎</p>
            <p className="max-w-[13ch] text-[1.35rem] leading-[0.98] font-semibold sm:max-w-lg sm:text-[1.75rem]">{targetDate === 'tomorrow' ? '明天穿什么，今晚先做决定。' : '今天穿什么，先用一眼能做决定的方式告诉你。'}</p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-white/10">
            <div className="min-w-0 bg-white/5 px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[10px] font-semibold uppercase text-white/62">温度</p>
              <p className="mt-2 truncate text-[1.35rem] font-semibold text-[var(--color-accent)] sm:text-3xl">{temperatureLabel}</p>
            </div>
            <div className="min-w-0 bg-white/6 px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[10px] font-semibold uppercase text-white/62">地点</p>
              <p className="mt-2 truncate text-base font-semibold text-white sm:text-xl">{locationLabel}</p>
            </div>
            <div className="min-w-0 bg-white/6 px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[10px] font-semibold uppercase text-white/62">天气</p>
              <p className="mt-2 truncate text-base font-semibold text-white sm:text-xl">{weatherLabel}</p>
            </div>
          </div>
        </div>

        {controlsEnabled ? (
          <div className="grid gap-3 border-t border-[var(--color-line)] pt-3">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase text-[var(--color-neutral-dark)]">日期</p>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {targetDateOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={optionClass(targetDate === option.value)}
                    aria-pressed={targetDate === option.value}
                    disabled={isRefreshing}
                    onClick={() => onTargetDateChange?.(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase text-[var(--color-neutral-dark)]">场景</p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {sceneOptions.map((option) => (
                  <button
                    key={option.value ?? 'default'}
                    type="button"
                    className={optionClass(scene === option.value)}
                    aria-pressed={scene === option.value}
                    disabled={isRefreshing}
                    onClick={() => onSceneChange?.(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
