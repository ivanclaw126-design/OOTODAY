import { Card } from '@/components/ui/card'
import type { TodayOotdHistoryEntry } from '@/lib/today/types'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  }).format(new Date(date))
}

function formatScore(score: number | null) {
  return score ? `${score} / 5 分` : '未评分'
}

export function TodayOotdHistory({ entries }: { entries: TodayOotdHistoryEntry[] }) {
  if (entries.length === 0) {
    return null
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">
              OOTD history
            </p>
            <p className="text-lg font-semibold tracking-[-0.03em]">最近穿搭记录</p>
          </div>
          <p className="text-sm text-[var(--color-neutral-dark)]">
            记录会慢慢校准你对舒适度、搭配和重复穿着的偏好
          </p>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[1.25rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(248,245,238,0.86)_100%)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium tracking-[-0.02em]">{formatDate(entry.wornAt)}</p>
                  <p className="text-xs text-[var(--color-neutral-dark)]">这条记录会被拿去优化后续推荐</p>
                </div>
                <p className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {formatScore(entry.satisfactionScore)}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-neutral-dark)]">
                {entry.notes ?? '本次记录没有备注摘要'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
