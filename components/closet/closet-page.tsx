'use client'

import { AppShell } from '@/components/app-shell'
import { ClosetInsightsPanel } from '@/components/closet/closet-insights'
import { ClosetItemGrid } from '@/components/closet/closet-item-grid'
import { ClosetUploadCard } from '@/components/closet/closet-upload-card'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import type { ClosetAnalysisDraft, ClosetAnalysisResult, ClosetInsights, ClosetItemCardData } from '@/lib/closet/types'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type ClosetPageProps = {
  userId: string
  itemCount: number
  items: ClosetItemCardData[]
  insights: ClosetInsights
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  analyzeImportUrl: (input: { sourceUrl: string }) => Promise<{ error: string | null; draft: ClosetAnalysisDraft | null }>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
  deleteItem: (input: { itemId: string }) => Promise<void>
}

export function ClosetPage({ userId, itemCount, items, insights, storageBucket, analyzeUpload, analyzeImportUrl, saveItem, deleteItem }: ClosetPageProps) {
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const router = useRouter()

  const activeMissingBasic = useMemo(
    () => insights.missingBasics.find((item) => item.id === activeFilterId) ?? null,
    [activeFilterId, insights.missingBasics]
  )

  const filteredItems = useMemo(() => {
    if (!activeFilterId) {
      return items
    }

    const duplicateGroup = insights.duplicateGroups.find((group) => group.id === activeFilterId)

    if (duplicateGroup) {
      return items.filter((item) => duplicateGroup.itemIds.includes(item.id))
    }

    const idleItem = insights.idleItems.find((item) => item.id === activeFilterId)

    if (idleItem) {
      return items.filter((item) => item.id === idleItem.id)
    }

    if (activeFilterId === 'dark-bottom') {
      return items.filter((item) => ['裤装', '下装', '裤子'].includes(item.category))
    }

    if (activeFilterId === 'outerwear') {
      return items.filter((item) => item.category === '外套')
    }

    if (activeFilterId === 'basic-top') {
      return items.filter((item) => item.category === '上衣')
    }

    return items
  }, [activeFilterId, insights.duplicateGroups, insights.idleItems, items])

  const gridEmptyTitle = activeMissingBasic ? `${activeMissingBasic.label} 当前还没补进衣橱` : '当前没有符合条件的单品'
  const gridEmptyDescription = activeMissingBasic
    ? activeMissingBasic.reason
    : '换个筛选看看，或者继续往衣橱里补新的单品。'

  async function handleDeleteItem(item: ClosetItemCardData) {
    if (!window.confirm(`确定要删除这件${item.category}${item.subCategory ? `（${item.subCategory}）` : ''}吗？删除后需要重新上传。`)) {
      return
    }

    setDeletingItemId(item.id)

    try {
      await deleteItem({ itemId: item.id })
      router.refresh()
    } finally {
      setDeletingItemId(null)
    }
  }

  return (
    <AppShell title="Closet">
      <ClosetUploadCard
        userId={userId}
        storageBucket={storageBucket}
        analyzeUpload={analyzeUpload}
        analyzeImportUrl={analyzeImportUrl}
        saveItem={saveItem}
      />

      <Card>
        <p className="text-sm text-[var(--color-neutral-dark)]">已收录 {itemCount} 件单品</p>
      </Card>

      {itemCount > 0 ? (
        <ClosetInsightsPanel
          insights={insights}
          activeFilterId={activeFilterId}
          onSelectFilter={(id) => setActiveFilterId((current) => (current === id ? null : id))}
          onClearFilter={() => setActiveFilterId(null)}
        />
      ) : null}

      {itemCount === 0 ? (
        <EmptyState
          title="先把第一件衣物放进来"
          description="上传一张单件衣物图片，AI 会先给你分类建议，再保存进衣橱。"
        />
      ) : (
        <ClosetItemGrid
          items={filteredItems}
          onDeleteItem={handleDeleteItem}
          deletingItemId={deletingItemId}
          emptyTitle={gridEmptyTitle}
          emptyDescription={gridEmptyDescription}
        />
      )}
    </AppShell>
  )
}
