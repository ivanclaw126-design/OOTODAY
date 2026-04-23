import type { ClosetItemCardData } from '@/lib/closet/types'
import { ClosetItemImage } from '@/components/closet/closet-item-image'
import { ClosetCategoryIcon, ClosetColorIcon } from '@/components/closet/closet-taxonomy-icons'

export type ClosetBrowseMode = 'category' | 'color'

export type ClosetBrowseGroup = {
  value: string
  label: string
  count: number
  items: ClosetItemCardData[]
}

function getGroupLabel(item: ClosetItemCardData, mode: ClosetBrowseMode) {
  if (mode === 'category') {
    return item.category
  }

  return item.colorCategory ?? '未标颜色'
}

export function buildClosetBrowseGroups(items: ClosetItemCardData[], mode: ClosetBrowseMode): ClosetBrowseGroup[] {
  const groupMap = new Map<string, ClosetItemCardData[]>()

  for (const item of items) {
    const label = getGroupLabel(item, mode)
    const current = groupMap.get(label) ?? []
    current.push(item)
    groupMap.set(label, current)
  }

  return Array.from(groupMap.entries())
    .map(([label, groupedItems]) => ({
      value: label,
      label,
      count: groupedItems.length,
      items: groupedItems
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return left.label.localeCompare(right.label, 'zh-CN')
    })
}

export function ClosetGroupBrowser({
  groups,
  mode,
  activeGroupValue,
  onSelectGroup,
  onClearGroup
}: {
  groups: ClosetBrowseGroup[]
  mode: ClosetBrowseMode
  activeGroupValue: string | null
  onSelectGroup: (value: string) => void
  onClearGroup: () => void
}) {
  const modeLabel = mode === 'category' ? '类型' : '颜色'

  if (groups.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-[var(--color-neutral-mid)] bg-white p-5 text-center">
        <p className="text-sm font-medium">当前还没有可分组展示的衣物</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">先继续导入几件，分组视图会自动整理出来。</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--color-neutral-dark)]">先按{modeLabel}扫一眼全局，再点进组里继续编辑和整理。</p>
        {activeGroupValue ? (
          <button
            type="button"
            className="text-xs font-medium text-[var(--color-primary)] underline underline-offset-2"
            onClick={onClearGroup}
          >
            清除分组筛选
          </button>
        ) : null}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const isActive = activeGroupValue === group.value

          return (
            <button
              key={group.value}
              type="button"
              onClick={() => onSelectGroup(group.value)}
              className={`rounded-[1.1rem] border p-2.5 text-left transition ${
                isActive
                  ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]/60 shadow-[0_12px_28px_rgba(26,26,26,0.08)]'
                  : 'border-black/7 bg-white hover:border-[var(--color-primary)]/35 hover:bg-[var(--color-secondary)]/30'
              }`}
              aria-pressed={isActive}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  {mode === 'category' ? <ClosetCategoryIcon category={group.label} /> : <ClosetColorIcon color={group.label} />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-neutral-dark)]">{group.label}</p>
                    <p className="text-[11px] text-[var(--color-neutral-dark)]">
                      {group.count} 件{mode === 'category' ? '同类单品' : '同色单品'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-[var(--color-neutral-dark)] shadow-sm">
                  {modeLabel}
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {group.items.slice(0, 8).map((item) => (
                  <div key={item.id} className="aspect-square overflow-hidden rounded-[0.75rem] bg-[var(--color-secondary)]">
                    {item.imageUrl ? (
                      <ClosetItemImage
                        src={item.imageUrl}
                        alt={`${group.label} 缩略图`}
                        rotated={Boolean(item.imageFlipped)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-neutral-dark)]">暂无图</div>
                    )}
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
