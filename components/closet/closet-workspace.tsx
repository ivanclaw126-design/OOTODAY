'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClosetInsightsPanel } from '@/components/closet/closet-insights'
import { ClosetItemGrid } from '@/components/closet/closet-item-grid'
import { ClosetSection } from '@/components/closet/closet-section'
import { ClosetCategoryBadge, ClosetColorBadge } from '@/components/closet/closet-taxonomy-icons'
import { ClosetUploadCard } from '@/components/closet/closet-upload-card'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'
import { buildClosetBrowseGroups, ClosetGroupBrowser, type ClosetBrowseMode } from '@/components/closet/closet-group-browser'
import { Card } from '@/components/ui/card'
import { isRestoreWindowActive, normalizeQuarterTurns } from '@/lib/closet/image-rotation'
import { isBottomCategory, isOuterwearCategory, isTopCategory } from '@/lib/closet/taxonomy'
import type { ClosetAnalysisDraft, ClosetAnalysisResult, ClosetInsights, ClosetItemCardData } from '@/lib/closet/types'

type UsageView = 'all' | 'most-worn' | 'least-recently-worn'

export function ClosetWorkspace({
  userId,
  itemCount,
  items,
  insights,
  storageBucket,
  analyzeUpload,
  analyzeImportUrl,
  saveItem,
  updateItem,
  reanalyzeItem,
  deleteItem,
  updateImageRotation
}: {
  userId: string
  itemCount: number
  items: ClosetItemCardData[]
  insights: ClosetInsights
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  analyzeImportUrl: (input: { sourceUrl: string }) => Promise<{ error: string | null; draft: ClosetAnalysisDraft | null }>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
  updateItem: (input: { itemId: string; draft: ClosetAnalysisDraft }) => Promise<void>
  reanalyzeItem: (input: { itemId: string }) => Promise<ClosetAnalysisDraft>
  deleteItem: (input: { itemId: string }) => Promise<void>
  updateImageRotation: (input: {
    itemId: string
    operation: 'rotate-right-90' | 'restore-original'
  }) => Promise<{
    persisted: boolean
    imageUrl?: string | null
    imageFlipped?: boolean
    imageOriginalUrl?: string | null
    imageRotationQuarterTurns?: number
    imageRestoreExpiresAt?: string | null
    canRestoreOriginal?: boolean
  }>
}) {
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [reanalyzingItemId, setReanalyzingItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<ClosetAnalysisDraft | null>(null)
  const [editingError, setEditingError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [browseMode, setBrowseMode] = useState<'all' | ClosetBrowseMode>('category')
  const [activeBrowseGroupValue, setActiveBrowseGroupValue] = useState<string | null>(null)
  const [usageView, setUsageView] = useState<UsageView>('all')
  const [isImportCollapsed, setIsImportCollapsed] = useState(itemCount > 0)
  const [isInsightsCollapsed, setIsInsightsCollapsed] = useState(itemCount > 0)
  const [flippingItemId, setFlippingItemId] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const [imageOverrides, setImageOverrides] = useState<
    Record<
      string,
      {
        imageFlipped?: boolean
        imageUrl?: string | null
        imageOriginalUrl?: string | null
        imageRotationQuarterTurns?: number
        imageRestoreExpiresAt?: string | null
        canRestoreOriginal?: boolean
      }
    >
  >({})
  const router = useRouter()

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30 * 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  const displayItems = useMemo(
    () =>
      items.map((item) => {
        const override = imageOverrides[item.id]
        const imageRestoreExpiresAt = override?.imageRestoreExpiresAt ?? item.imageRestoreExpiresAt ?? null
        const imageRotationQuarterTurns = normalizeQuarterTurns(
          override?.imageRotationQuarterTurns ?? item.imageRotationQuarterTurns ?? 0
        )
        const imageOriginalUrl = override?.imageOriginalUrl ?? item.imageOriginalUrl ?? null
        const canRestoreOriginal =
          Boolean(imageOriginalUrl) && imageRotationQuarterTurns > 0 && isRestoreWindowActive(imageRestoreExpiresAt, now)

        return {
          ...item,
          imageFlipped: canRestoreOriginal,
          imageUrl: override?.imageUrl ?? item.imageUrl,
          imageOriginalUrl,
          imageRotationQuarterTurns,
          imageRestoreExpiresAt,
          canRestoreOriginal
        }
      }),
    [imageOverrides, items, now]
  )

  const usageHighlights = useMemo(() => {
    const mostWorn = [...displayItems].filter((item) => item.wearCount > 0).sort((left, right) => right.wearCount - left.wearCount).slice(0, 6)
    const leastRecentlyWorn = [...displayItems]
      .filter((item) => item.lastWornDate || item.wearCount === 0)
      .sort((left, right) => {
        if (!left.lastWornDate && !right.lastWornDate) {
          return left.createdAt.localeCompare(right.createdAt)
        }
        if (!left.lastWornDate) {
          return -1
        }
        if (!right.lastWornDate) {
          return 1
        }

        return left.lastWornDate.localeCompare(right.lastWornDate)
      })
      .slice(0, 6)
    return {
      mostWorn,
      leastRecentlyWorn
    }
  }, [displayItems])

  const activeMissingBasic = useMemo(
    () => insights.missingBasics.find((item) => item.id === activeFilterId) ?? null,
    [activeFilterId, insights.missingBasics]
  )

  const insightFilteredItems = useMemo(() => {
    if (!activeFilterId) {
      return displayItems
    }

    const duplicateGroup = insights.duplicateGroups.find((group) => group.id === activeFilterId)

    if (duplicateGroup) {
      return displayItems.filter((item) => duplicateGroup.itemIds.includes(item.id))
    }

    const idleItem = insights.idleItems.find((item) => item.id === activeFilterId)

    if (idleItem) {
      return displayItems.filter((item) => item.id === idleItem.id)
    }

    if (activeFilterId === 'dark-bottom') {
      return displayItems.filter((item) => isBottomCategory(item.category))
    }

    if (activeFilterId === 'outerwear') {
      return displayItems.filter((item) => isOuterwearCategory(item.category))
    }

    if (activeFilterId === 'basic-top') {
      return displayItems.filter((item) => isTopCategory(item.category))
    }

    return displayItems
  }, [activeFilterId, displayItems, insights.duplicateGroups, insights.idleItems])

  const usageFilteredItems = useMemo(() => {
    if (usageView === 'most-worn') {
      return usageHighlights.mostWorn
    }

    if (usageView === 'least-recently-worn') {
      return usageHighlights.leastRecentlyWorn
    }

    return insightFilteredItems
  }, [insightFilteredItems, usageHighlights.leastRecentlyWorn, usageHighlights.mostWorn, usageView])

  const browseGroups = useMemo(() => {
    if (browseMode === 'all') {
      return []
    }

    return buildClosetBrowseGroups(usageFilteredItems, browseMode)
  }, [browseMode, usageFilteredItems])

  const visibleItems = useMemo(() => {
    if (browseMode === 'all') {
      return usageFilteredItems
    }

    if (!activeBrowseGroupValue) {
      return []
    }

    return usageFilteredItems.filter((item) => {
      if (browseMode === 'category') {
        return item.category === activeBrowseGroupValue
      }

      return (item.colorCategory ?? '未标颜色') === activeBrowseGroupValue
    })
  }, [activeBrowseGroupValue, browseMode, usageFilteredItems])

  const activeFilterSummary = useMemo(() => {
    if (!activeFilterId) {
      return null
    }

    const duplicateGroup = insights.duplicateGroups.find((group) => group.id === activeFilterId)

    if (duplicateGroup) {
      return {
        label: `重复款：${duplicateGroup.label}`,
        detail: '先看这组里最常穿的版本，剩下的可以暂时降级观察。'
      }
    }

    const idleItem = insights.idleItems.find((item) => item.id === activeFilterId)

    if (idleItem) {
      return {
        label: `闲置提醒：${idleItem.label}`,
        detail: '优先判断它是版型不合适，还是搭配场景还没建立起来。'
      }
    }

    const missingBasic = insights.missingBasics.find((item) => item.id === activeFilterId)

    if (missingBasic) {
      return {
        label: `基础缺口：${missingBasic.label}`,
        detail: missingBasic.reason
      }
    }

    if (activeFilterId === 'dark-bottom') {
      return {
        label: '基础缺口：深色下装',
        detail: '深色下装通常最容易把搭配和出门效率先稳住。'
      }
    }

    if (activeFilterId === 'outerwear') {
      return {
        label: '基础缺口：外层',
        detail: '先补一件好叠穿的外层，通勤和天气变化都会更省心。'
      }
    }

    if (activeFilterId === 'basic-top') {
      return {
        label: '基础缺口：上衣',
        detail: '先把最常穿的上衣打稳，后面整个衣橱都会更好搭。'
      }
    }

    return null
  }, [activeFilterId, insights.duplicateGroups, insights.idleItems, insights.missingBasics])

  const activeBrowseGroupLabel =
    browseMode === 'all'
      ? null
      : browseGroups.find((group) => group.value === activeBrowseGroupValue)?.label ?? activeBrowseGroupValue

  const usageViewSummary =
    usageView === 'most-worn'
      ? '当前视图：最常穿，优先确认哪些单品真的在支撑你的日常。'
      : usageView === 'least-recently-worn'
        ? '当前视图：最久没穿，优先判断这些单品是否值得继续保留。'
        : null

  const gridEmptyTitle =
    browseMode !== 'all' && !activeBrowseGroupValue
      ? `先点一个${browseMode === 'category' ? '类型' : '颜色'}卡片`
      : activeMissingBasic
        ? `${activeMissingBasic.label} 当前还没补进衣橱`
        : '当前没有符合条件的单品'
  const gridEmptyDescription =
    browseMode !== 'all' && !activeBrowseGroupValue
      ? `先按${browseMode === 'category' ? '类型' : '颜色'}扫一眼，再展开具体单品，浏览会清楚很多。`
      : activeMissingBasic
        ? activeMissingBasic.reason
        : usageViewSummary ?? '换个筛选看看，或者继续往衣橱里补新的单品。'

  const currentEditingItem = useMemo(
    () => displayItems.find((item) => item.id === editingItemId) ?? null,
    [displayItems, editingItemId]
  )

  useEffect(() => {
    if (!editingItemId) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [editingItemId])

  function closeEditor() {
    setEditingItemId(null)
    setEditingDraft(null)
    setEditingError(null)
  }

  function handleBrowseModeChange(nextMode: 'all' | ClosetBrowseMode) {
    setBrowseMode(nextMode)
    setActiveBrowseGroupValue(null)
  }

  function handleUsageViewChange(nextView: UsageView) {
    setUsageView(nextView)
    setActiveBrowseGroupValue(null)
  }

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

  async function handleRotateImage(item: ClosetItemCardData) {
    setFlippingItemId(item.id)

    try {
      const result = await updateImageRotation({
        itemId: item.id,
        operation: 'rotate-right-90'
      })
      setImageOverrides((current) => ({
        ...current,
        [item.id]: {
          imageFlipped: result.imageFlipped ?? false,
          imageUrl: result.imageUrl ?? item.imageUrl,
          imageOriginalUrl: result.imageOriginalUrl ?? item.imageOriginalUrl ?? item.imageUrl,
          imageRotationQuarterTurns: result.imageRotationQuarterTurns ?? normalizeQuarterTurns((item.imageRotationQuarterTurns ?? 0) + 1),
          imageRestoreExpiresAt: result.imageRestoreExpiresAt ?? item.imageRestoreExpiresAt ?? null,
          canRestoreOriginal: result.canRestoreOriginal ?? true
        }
      }))

      if (result.persisted) {
        router.refresh()
      }
    } finally {
      setFlippingItemId(null)
    }
  }

  async function handleRestoreOriginalImage(item: ClosetItemCardData) {
    setFlippingItemId(item.id)

    try {
      const result = await updateImageRotation({
        itemId: item.id,
        operation: 'restore-original'
      })
      setImageOverrides((current) => ({
        ...current,
        [item.id]: {
          imageFlipped: false,
          imageUrl: result.imageUrl ?? item.imageOriginalUrl ?? item.imageUrl,
          imageOriginalUrl: result.imageOriginalUrl ?? null,
          imageRotationQuarterTurns: result.imageRotationQuarterTurns ?? 0,
          imageRestoreExpiresAt: result.imageRestoreExpiresAt ?? null,
          canRestoreOriginal: false
        }
      }))

      if (result.persisted) {
        router.refresh()
      }
    } finally {
      setFlippingItemId(null)
    }
  }

  function handleEditItem(item: ClosetItemCardData) {
    setEditingItemId(item.id)
    setEditingError(null)
    setEditingDraft({
      imageUrl: item.imageUrl ?? '',
      category: item.category,
      subCategory: item.subCategory ?? '未知类型请手动选择',
      colorCategory: item.colorCategory ?? '未知颜色请手动选择',
      styleTags: item.styleTags,
      purchasePrice: item.purchasePrice ?? null,
      purchaseYear: item.purchaseYear ?? null,
      itemCondition: item.itemCondition ?? null
    })
  }

  async function handleReanalyzeItem(item: ClosetItemCardData) {
    setEditingItemId(item.id)
    setEditingDraft({
      imageUrl: item.imageUrl ?? '',
      category: item.category,
      subCategory: item.subCategory ?? '未知类型请手动选择',
      colorCategory: item.colorCategory ?? '未知颜色请手动选择',
      styleTags: item.styleTags,
      purchasePrice: item.purchasePrice ?? null,
      purchaseYear: item.purchaseYear ?? null,
      itemCondition: item.itemCondition ?? null
    })
    setReanalyzingItemId(item.id)
    setEditingError(null)

    try {
      const nextDraft = await reanalyzeItem({ itemId: item.id })
      setEditingDraft((current) => ({
        ...nextDraft,
        purchasePrice: current?.purchasePrice ?? item.purchasePrice ?? null,
        purchaseYear: current?.purchaseYear ?? item.purchaseYear ?? null,
        itemCondition: current?.itemCondition ?? item.itemCondition ?? null
      }))
    } catch (error) {
      setEditingError(error instanceof Error ? error.message : '重新识别失败，请稍后再试')
    } finally {
      setReanalyzingItemId(null)
    }
  }

  async function handleSaveEdit(nextDraft: ClosetAnalysisDraft) {
    if (!editingItemId) {
      return
    }

    setIsSavingEdit(true)
    setEditingError(null)

    try {
      await updateItem({ itemId: editingItemId, draft: nextDraft })
      closeEditor()
      router.refresh()
    } catch (error) {
      setEditingError(error instanceof Error ? error.message : '保存失败，请稍后再试')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const usageViewCards = [
    {
      value: 'all' as const,
      label: '全部',
      detail: '当前筛选'
    },
    {
      value: 'most-worn' as const,
      label: '最常穿',
      detail: usageHighlights.mostWorn.length > 0 ? `${usageHighlights.mostWorn.length} 件` : '暂无'
    },
    {
      value: 'least-recently-worn' as const,
      label: '最久没穿',
      detail: usageHighlights.leastRecentlyWorn.length > 0 ? `${usageHighlights.leastRecentlyWorn.length} 件` : '暂无'
    }
  ]

  return (
    <>
      <div className="grid gap-3">
        <ClosetSection
          eyebrow="Step 1"
          title="导入衣物"
          description="相册、链接、拼图都从这里进。"
          collapsible
          collapsed={isImportCollapsed}
          tone="import"
          onToggle={() => setIsImportCollapsed((current) => !current)}
        >
          <ClosetUploadCard
            userId={userId}
            storageBucket={storageBucket}
            analyzeUpload={analyzeUpload}
            analyzeImportUrl={analyzeImportUrl}
            saveItem={saveItem}
          />
        </ClosetSection>

        <ClosetSection
          eyebrow="Step 2"
          title="整理建议"
          description="重复、闲置、基础缺口都在这里。"
          collapsible
          collapsed={isInsightsCollapsed}
          tone="insights"
          onToggle={() => setIsInsightsCollapsed((current) => !current)}
        >
          <ClosetInsightsPanel
            insights={insights}
            activeFilterId={activeFilterId}
            onSelectFilter={(id) => setActiveFilterId((current) => (current === id ? null : id))}
            onClearFilter={() => setActiveFilterId(null)}
          />
        </ClosetSection>
      </div>

      <ClosetSection
        eyebrow="Step 3"
        title="衣橱浏览"
        description={
          activeFilterSummary
            ? `当前筛选：${activeFilterSummary.label}。${activeFilterSummary.detail}`
            : usageViewSummary ?? '先按类型浏览，再决定要不要切到颜色视图。'
        }
        emphasize
        tone="browse"
      >
        <div className="rounded-[1.45rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)] p-3 shadow-[var(--shadow-soft)] backdrop-blur sm:p-4">
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">使用状态</p>
              <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="inline-flex min-w-max rounded-full border border-[var(--color-line)] bg-white/72 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {usageViewCards.map((option) => {
                  const isActive = usageView === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                        isActive
                          ? 'bg-[var(--color-primary)] text-white shadow-[0_10px_22px_rgba(0,0,0,0.14)] ring-1 ring-[var(--color-accent)]/70'
                          : 'text-[var(--color-neutral-dark)] hover:bg-white/86'
                      }`}
                      onClick={() => handleUsageViewChange(option.value)}
                      aria-pressed={isActive}
                    >
                      <span>{option.label}</span>
                      <span
                        className={
                          isActive
                            ? 'rounded-full bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[var(--color-primary)]'
                            : 'font-medium text-[var(--color-neutral-dark)]'
                        }
                      >
                        {option.detail}
                      </span>
                    </button>
                  )
                })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: 'all', label: '全部衣物' },
                { value: 'category', label: '按类型' },
                { value: 'color', label: '按颜色' }
              ].map((option) => {
                const isActive = browseMode === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition sm:text-sm ${
                      isActive
                        ? 'bg-[var(--color-primary)] text-white shadow-[0_14px_28px_rgba(0,0,0,0.16)]'
                        : 'border border-[var(--color-line)] bg-white/80 text-[var(--color-neutral-dark)]'
                    }`}
                    onClick={() => handleBrowseModeChange(option.value as 'all' | ClosetBrowseMode)}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>

            {browseMode === 'all' ? (
              <ClosetItemGrid
                items={visibleItems}
                onEditItem={handleEditItem}
                onReanalyzeItem={handleReanalyzeItem}
                onDeleteItem={handleDeleteItem}
                onRotateImageItem={handleRotateImage}
                onRestoreOriginalImageItem={handleRestoreOriginalImage}
                reanalyzingItemId={reanalyzingItemId}
                deletingItemId={deletingItemId}
                flippingItemId={flippingItemId}
                emptyTitle={gridEmptyTitle}
                emptyDescription={gridEmptyDescription}
              />
            ) : (
              <div className="space-y-4">
                <ClosetGroupBrowser
                  groups={browseGroups}
                  mode={browseMode}
                  activeGroupValue={activeBrowseGroupValue}
                  onSelectGroup={(value) => setActiveBrowseGroupValue((current) => (current === value ? null : value))}
                  onClearGroup={() => setActiveBrowseGroupValue(null)}
                />

                <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.56)] p-3">
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--color-primary)]">
                        {browseMode === 'category' ? '类型分组详情' : '颜色分组详情'}
                      </p>
                      <p className="text-[11px] text-[var(--color-neutral-dark)]">
                        {activeBrowseGroupLabel
                          ? `当前查看：${activeBrowseGroupLabel}`
                          : `点一个${browseMode === 'category' ? '类型' : '颜色'}卡片继续看。`}
                      </p>
                    </div>
                    {activeBrowseGroupLabel ? (
                      <span className="rounded-full border border-[var(--color-line)] bg-white/82 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-neutral-dark)]">
                        {visibleItems.length} 件
                      </span>
                    ) : null}
                  </div>

                  <ClosetItemGrid
                    items={visibleItems}
                    onEditItem={handleEditItem}
                    onReanalyzeItem={handleReanalyzeItem}
                    onDeleteItem={handleDeleteItem}
                    onRotateImageItem={handleRotateImage}
                    onRestoreOriginalImageItem={handleRestoreOriginalImage}
                    reanalyzingItemId={reanalyzingItemId}
                    deletingItemId={deletingItemId}
                    flippingItemId={flippingItemId}
                    emptyTitle={gridEmptyTitle}
                    emptyDescription={gridEmptyDescription}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ClosetSection>

      {editingItemId && editingDraft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={closeEditor} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="编辑识别结果"
            className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden"
          >
            <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(243,238,230,0.98)_100%)]">
              <div className="flex max-h-[calc(100vh-2rem)] flex-col overflow-y-auto pr-1">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">编辑面板</p>
                      <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">编辑识别结果</h2>
                      <p className="text-sm text-[var(--color-neutral-dark)]">
                        这里会立刻显示当前草稿。点“一键重新识别”后，新结果也会直接回到这个面板里。
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-sm text-[var(--color-neutral-dark)] underline underline-offset-2"
                      onClick={closeEditor}
                    >
                      关闭
                    </button>
                  </div>

                  {currentEditingItem ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--color-neutral-dark)]">
                      <span className="text-xs font-medium text-[var(--color-neutral-dark)]">当前衣物</span>
                      <ClosetCategoryBadge category={currentEditingItem.category} />
                      {currentEditingItem.colorCategory ? <ClosetColorBadge color={currentEditingItem.colorCategory} /> : null}
                      {currentEditingItem.subCategory ? (
                        <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">
                          {currentEditingItem.subCategory}
                        </span>
                      ) : null}
                      {reanalyzingItemId === currentEditingItem.id ? (
                        <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-white">重新识别中…</span>
                      ) : null}
                    </div>
                  ) : null}

                  <ClosetUploadForm initialDraft={editingDraft} disabled={isSavingEdit} submitLabel="保存修改" onSubmit={handleSaveEdit} />

                  {editingError ? <p className="text-sm text-red-600">{editingError}</p> : null}

                  {currentEditingItem ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-[var(--color-primary)] underline underline-offset-2"
                        onClick={() => void handleReanalyzeItem(currentEditingItem)}
                        disabled={reanalyzingItemId === currentEditingItem.id}
                      >
                        {reanalyzingItemId === currentEditingItem.id ? '重新识别中…' : '再次识别当前图片'}
                      </button>
                      <p className="text-xs text-[var(--color-neutral-dark)]">保存后会立刻刷新衣橱卡片和 Today 相关数据。</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  )
}
