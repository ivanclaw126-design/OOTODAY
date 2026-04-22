import { Card } from '@/components/ui/card'
import { SecondaryButton } from '@/components/ui/button'
import type { ClosetInsights } from '@/lib/closet/types'

function toneClass(tone: 'keep' | 'review' | 'buy', isActive: boolean) {
  if (isActive) {
    return 'bg-[var(--color-primary)] text-white'
  }

  if (tone === 'buy') {
    return 'bg-[#FFF4E8]'
  }

  if (tone === 'keep') {
    return 'bg-[#EEF6F1]'
  }

  return 'bg-white'
}

function InsightList({
  title,
  description,
  emptyText,
  items,
  activeId,
  onSelect
}: {
  title: string
  description: string
  emptyText: string
  items: Array<{
    id: string
    label: string
    reason?: string
    count?: number
    keepLabel?: string
    keepReason?: string
    priority?: 'high' | 'medium'
    nextStep?: string
  }>
  activeId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.25rem] border border-black/7 bg-white p-4 shadow-[0_12px_28px_rgba(26,26,26,0.05)]">
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-neutral-dark)]">{title}</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">{description}</p>
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`rounded-[0.9rem] border border-[var(--color-neutral-mid)] px-3 py-2 text-left transition-colors ${
                activeId === item.id ? 'bg-[var(--color-primary)] text-white' : 'bg-white'
              }`}
            >
              <p className="text-sm font-medium">
                {item.label}
                {item.count ? ` · ${item.count} 件` : ''}
              </p>
              {item.reason ? (
                <p className={`text-sm ${activeId === item.id ? 'text-white/85' : 'text-[var(--color-neutral-dark)]'}`}>
                  {item.reason}
                </p>
              ) : null}
              {item.keepLabel ? (
                <p className={`mt-1 text-sm ${activeId === item.id ? 'text-white/85' : 'text-[var(--color-primary)]'}`}>
                  优先保留：{item.keepLabel}
                </p>
              ) : null}
              {item.keepReason ? (
                <p className={`text-sm ${activeId === item.id ? 'text-white/85' : 'text-[var(--color-neutral-dark)]'}`}>
                  {item.keepReason}
                </p>
              ) : null}
              {item.priority ? (
                <p className={`mt-1 text-sm ${activeId === item.id ? 'text-white/85' : 'text-[var(--color-primary)]'}`}>
                  优先级：{item.priority === 'high' ? '高' : '中'}
                </p>
              ) : null}
              {item.nextStep ? (
                <p className={`text-sm ${activeId === item.id ? 'text-white/85' : 'text-[var(--color-neutral-dark)]'}`}>
                  {item.nextStep}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-neutral-dark)]">{emptyText}</p>
      )}
    </div>
  )
}

export function ClosetInsightsPanel({
  insights,
  activeFilterId,
  onSelectFilter,
  onClearFilter
}: {
  insights: ClosetInsights
  activeFilterId: string | null
  onSelectFilter: (id: string) => void
  onClearFilter: () => void
}) {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">整理建议</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">先把重复、闲置和基础缺口看清楚，衣橱才会越用越顺手。</p>
          </div>
          {activeFilterId ? (
            <SecondaryButton type="button" onClick={onClearFilter}>
              查看全部
            </SecondaryButton>
          ) : null}
        </div>

        {insights.actionPlan.length > 0 ? (
          <div className="rounded-[1.25rem] border border-black/7 bg-[var(--color-secondary)]/35 p-4">
            <div className="mb-3 space-y-1">
              <p className="text-sm font-medium text-[var(--color-neutral-dark)]">下一步先做这些</p>
              <p className="text-sm text-[var(--color-neutral-dark)]">先处理最影响搭配效率的 3 件事，比继续盲目加衣服更有用。</p>
            </div>

            <div className="flex flex-col gap-2">
              {insights.actionPlan.map((item, index) => {
                const isActive = activeFilterId === item.filterId

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectFilter(item.filterId)}
                    className={`rounded-lg px-3 py-3 text-left ${toneClass(item.tone, isActive)}`}
                  >
                    <p className="text-sm font-medium">
                      {index + 1}. {item.title}
                    </p>
                    <p className={`text-sm ${isActive ? 'text-white/85' : 'text-[var(--color-neutral-dark)]'}`}>{item.detail}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <InsightList
            title="可能重复"
            description="这些单品看起来已经有点重叠，可以考虑保留最常穿的版本。"
            emptyText="当前没有明显重复单品。"
            items={insights.duplicateGroups}
            activeId={activeFilterId}
            onSelect={onSelectFilter}
          />
          <InsightList
            title="闲置提醒"
            description="优先从这些单品里找原因，决定是继续留、重新搭，还是以后少买同类。"
            emptyText="暂时没有明显闲置提醒。"
            items={insights.idleItems}
            activeId={activeFilterId}
            onSelect={onSelectFilter}
          />
          <InsightList
            title="基础缺口"
            description="补这些基础件，比继续买相似款更容易让整体搭配变顺。"
            emptyText="核心基础款暂时够用。"
            items={insights.missingBasics}
            activeId={activeFilterId}
            onSelect={onSelectFilter}
          />
        </div>
      </div>
    </Card>
  )
}
