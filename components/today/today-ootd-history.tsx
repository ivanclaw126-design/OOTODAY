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
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(238,231,220,0.94)_100%)]">
      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">OOTD history</p>
            <p className="text-xl font-semibold tracking-[-0.05em] text-[var(--color-primary)]">最近穿搭记录</p>
          </div>
          <p className="text-sm text-[var(--color-neutral-dark)]">
            记录会慢慢校准你对舒适度、搭配和重复穿着的偏好
          </p>
        </div>

        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[1.5rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(248,245,238,0.9)_100%)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium tracking-[-0.02em]">{formatDate(entry.wornAt)}</p>
                  <p className="text-xs text-[var(--color-neutral-dark)]">这条记录会被拿去优化后续推荐</p>
                </div>
                <p className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white">
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
