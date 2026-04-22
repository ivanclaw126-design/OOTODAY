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
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">最近穿搭记录</p>
          <p className="text-sm text-[var(--color-neutral-dark)]">你最近记过什么，系统会拿这些记录慢慢学你的真实穿搭节奏。</p>
        </div>

        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div key={entry.id} className="border-t border-[var(--color-secondary)] pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{formatDate(entry.wornAt)}</p>
                <p className="text-xs text-[var(--color-neutral-dark)]">{formatScore(entry.satisfactionScore)}</p>
              </div>
              <p className="mt-1 text-sm text-[var(--color-neutral-dark)]">{entry.notes ?? '本次记录没有备注摘要'}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
