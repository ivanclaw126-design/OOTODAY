import type { ReactNode } from 'react'
import type { TodayScene, TodayTargetDate, TodayWeatherState } from '@/lib/today/types'

const targetDateOptions: Array<{ value: TodayTargetDate; label: string }> = [
  { value: 'today', label: '今天' },
  { value: 'tomorrow', label: '明天' }
]

const sceneOptions: Array<{ value: TodayScene; label: string }> = [
  { value: null, label: '智能默认' },
  { value: 'work', label: '通勤干净' },
  { value: 'casual', label: '轻松日常' },
  { value: 'date', label: '约会聚会' },
  { value: 'travel', label: '城市旅行' },
  { value: 'outdoor', label: '运动户外' }
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
    'min-h-9 rounded-full px-3 py-1.5 text-sm font-semibold transition',
    isSelected
      ? 'bg-[#111111] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)]'
      : 'border border-[var(--color-line)] bg-white/74 text-[var(--color-primary)] hover:bg-white'
  ].join(' ')
}

function getSceneLabel(scene: TodayScene) {
  return sceneOptions.find((option) => option.value === scene)?.label ?? '智能默认'
}

export function TodayStatusCard({
  city,
  weatherState,
  targetDate = 'today',
  scene = null,
  onEditCity,
  isCityEditing = false,
  cityEditor,
  onTargetDateChange,
  onSceneChange,
  isRefreshing = false
}: {
  city: string | null
  weatherState: TodayWeatherState
  targetDate?: TodayTargetDate
  scene?: TodayScene
  onEditCity?: () => void
  isCityEditing?: boolean
  cityEditor?: ReactNode
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

  const sceneLabel = getSceneLabel(scene)
  const contextSummary = `${targetDate === 'tomorrow' ? '明天' : '今天'} · ${locationLabel} · ${temperatureLabel} ${weatherLabel} · ${sceneLabel}`
  const cityActionLabel = city ? '修改城市' : '设置城市'

  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(244,238,229,0.94)_100%)] p-3 shadow-[var(--shadow-soft)] backdrop-blur sm:p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase text-[var(--color-neutral-dark)]">{targetLabel}状态</p>
            <p className="text-[1.05rem] font-semibold leading-tight text-[var(--color-primary)] sm:text-xl">{contextSummary}</p>
            <p className="text-xs text-[var(--color-neutral-dark)]">{todayLabel} · {sourceLabel}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white/76 px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
              <span className={`h-2 w-2 rounded-full ${isRefreshing ? 'bg-[var(--color-neutral-mid)]' : 'bg-[var(--color-accent)]'}`} />
              {isRefreshing ? '更新中' : '已同步'}
            </div>
            {onEditCity ? (
              <button
                type="button"
                aria-expanded={isCityEditing}
                className="inline-flex min-h-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/82 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-white disabled:opacity-55"
                disabled={isRefreshing}
                onClick={onEditCity}
              >
                {cityActionLabel}
              </button>
            ) : null}
          </div>
        </div>

        {cityEditor ? (
          <div className="border-t border-[var(--color-line)] pt-3">
            {cityEditor}
          </div>
        ) : null}

        {controlsEnabled ? (
          <details className="group rounded-[1.1rem] border border-[var(--color-line)] bg-white/58">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
              调整日期 / 场景
              <span className="text-xs text-[var(--color-neutral-dark)] group-open:hidden">展开</span>
              <span className="hidden text-xs text-[var(--color-neutral-dark)] group-open:inline">收起</span>
            </summary>
            <div className="grid gap-3 border-t border-[var(--color-line)] px-3 pb-3 pt-3">
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
          </details>
        ) : null}
      </div>
    </section>
  )
}
