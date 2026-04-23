'use client'

import { AppShell } from '@/components/app-shell'
import { buildClosetBrowseGroups, ClosetGroupBrowser, type ClosetBrowseMode } from '@/components/closet/closet-group-browser'
import { ClosetInsightsPanel } from '@/components/closet/closet-insights'
import { ClosetItemGrid } from '@/components/closet/closet-item-grid'
import { ClosetCategoryBadge, ClosetColorBadge } from '@/components/closet/closet-taxonomy-icons'
import { ClosetUploadCard } from '@/components/closet/closet-upload-card'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { isBottomCategory, isOuterwearCategory, isTopCategory } from '@/lib/closet/taxonomy'
import type { ClosetAnalysisDraft, ClosetAnalysisResult, ClosetInsights, ClosetItemCardData } from '@/lib/closet/types'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

function ClosetSection({
  eyebrow,
  title,
  description,
  meta,
  children
}: {
  eyebrow: string
  title: string
  description: string
  meta?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-primary)]">{eyebrow}</p>
          <h2 className="text-lg font-semibold text-[var(--color-neutral-dark)]">{title}</h2>
          <p className="max-w-2xl text-sm text-[var(--color-neutral-dark)]">{description}</p>
        </div>
        {meta ? (
          <div className="shrink-0 rounded-full border border-black/7 bg-white px-3 py-1 text-xs font-medium text-[var(--color-neutral-dark)] shadow-sm">
            {meta}
          </div>
        ) : null}
      </div>

      {children}
    </section>
  )
}

type ClosetPageProps = {
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
}

export function ClosetPage({
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
  deleteItem
}: ClosetPageProps) {
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [reanalyzingItemId, setReanalyzingItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<ClosetAnalysisDraft | null>(null)
  const [editingError, setEditingError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [browseMode, setBrowseMode] = useState<'all' | ClosetBrowseMode>('all')
  const [activeBrowseGroupValue, setActiveBrowseGroupValue] = useState<string | null>(null)
  const router = useRouter()

  const activeMissingBasic = useMemo(
    () => insights.missingBasics.find((item) => item.id === activeFilterId) ?? null,
    [activeFilterId, insights.missingBasics]
  )

  const insightFilteredItems = useMemo(() => {
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
      return items.filter((item) => isBottomCategory(item.category))
    }

    if (activeFilterId === 'outerwear') {
      return items.filter((item) => isOuterwearCategory(item.category))
    }

    if (activeFilterId === 'basic-top') {
      return items.filter((item) => isTopCategory(item.category))
    }

    return items
  }, [activeFilterId, insights.duplicateGroups, insights.idleItems, items])

  const browseGroups = useMemo(() => {
    if (browseMode === 'all') {
      return []
    }

    return buildClosetBrowseGroups(insightFilteredItems, browseMode)
  }, [browseMode, insightFilteredItems])

  const visibleItems = useMemo(() => {
    if (browseMode === 'all' || !activeBrowseGroupValue) {
      return insightFilteredItems
    }

    return insightFilteredItems.filter((item) => {
      if (browseMode === 'category') {
        return item.category === activeBrowseGroupValue
      }

      return (item.colorCategory ?? '未标颜色') === activeBrowseGroupValue
    })
  }, [activeBrowseGroupValue, browseMode, insightFilteredItems])

  const activeFilterSummary = useMemo(() => {
    if (!activeFilterId) {
      return null
    }

    const duplicateGroup = insights.duplicateGroups.find((group) => group.id === activeFilterId)

    if (duplicateGroup) {
      return {
        label: `重复款：${duplicateGroup.label}`,
        detail: `先看这组里最常穿的版本，剩下的可以暂时降级观察。`
      }
    }

    const idleItem = insights.idleItems.find((item) => item.id === activeFilterId)

    if (idleItem) {
      return {
        label: `闲置提醒：${idleItem.label}`,
        detail: `优先判断它是版型不合适，还是搭配场景还没建立起来。`
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
        label: '基础缺口：外套',
        detail: '先补一件好叠穿的外套，通勤和天气变化都会更省心。'
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

  const gridEmptyTitle = activeMissingBasic ? `${activeMissingBasic.label} 当前还没补进衣橱` : '当前没有符合条件的单品'
  const gridEmptyDescription = activeMissingBasic
    ? activeMissingBasic.reason
    : '换个筛选看看，或者继续往衣橱里补新的单品。'

  const currentEditingItem = useMemo(
    () => items.find((item) => item.id === editingItemId) ?? null,
    [editingItemId, items]
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

  function handleEditItem(item: ClosetItemCardData) {
    setEditingItemId(item.id)
    setEditingError(null)
    setEditingDraft({
      imageUrl: item.imageUrl ?? '',
      category: item.category,
      subCategory: item.subCategory ?? '未知类型请手动选择',
      colorCategory: item.colorCategory ?? '未知颜色请手动选择',
      styleTags: item.styleTags
    })
  }

  async function handleReanalyzeItem(item: ClosetItemCardData) {
    setEditingItemId(item.id)
    setEditingDraft({
      imageUrl: item.imageUrl ?? '',
      category: item.category,
      subCategory: item.subCategory ?? '未知类型请手动选择',
      colorCategory: item.colorCategory ?? '未知颜色请手动选择',
      styleTags: item.styleTags
    })
    setReanalyzingItemId(item.id)
    setEditingError(null)

    try {
      const nextDraft = await reanalyzeItem({ itemId: item.id })
      setEditingDraft(nextDraft)
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

  return (
    <AppShell title="Closet">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-primary)]">衣橱管理</p>
            <h1 className="text-xl font-semibold text-[var(--color-neutral-dark)]">先导入，再整理，再回看</h1>
            <p className="max-w-2xl text-sm text-[var(--color-neutral-dark)]">
              相册多选、商品链接和拼图拆分都走同一条入橱链路，下面的建议会直接把清理重点挑出来。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--color-neutral-dark)]">
            <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">已收录 {itemCount} 件单品</span>
            <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">支持多入口导入</span>
          </div>
        </div>
      </Card>

      <ClosetSection
        eyebrow="Step 1"
        title="导入衣物"
        description="相册多选、商品链接和拼图拆分都在这里进入同一条识别与确认流程。"
        meta="先从这里开始"
      >
        <ClosetUploadCard
          userId={userId}
          storageBucket={storageBucket}
          analyzeUpload={analyzeUpload}
          analyzeImportUrl={analyzeImportUrl}
          saveItem={saveItem}
        />
      </ClosetSection>

      {itemCount > 0 ? (
        <ClosetSection
          eyebrow="Step 2"
          title="整理建议"
          description="先把重复、闲置和基础缺口看清楚，衣橱才会越用越顺手。"
          meta={activeFilterSummary ? '已选中筛选' : '按优先级查看'}
        >
          <ClosetInsightsPanel
            insights={insights}
            activeFilterId={activeFilterId}
            onSelectFilter={(id) => setActiveFilterId((current) => (current === id ? null : id))}
            onClearFilter={() => setActiveFilterId(null)}
          />
        </ClosetSection>
      ) : (
        <EmptyState
          title="先把第一件衣物放进来"
          description="上传一张单件衣物图片，AI 会先给你分类建议，再保存进衣橱。"
        />
      )}

      {itemCount > 0 ? (
        <ClosetSection
          eyebrow="Step 3"
          title="衣橱浏览"
          description={
            activeFilterSummary
              ? `当前筛选：${activeFilterSummary.label}。${activeFilterSummary.detail}`
              : '全部、按类型、按颜色三种方式都能看，小缩略图视图更适合先做整体管理。'
          }
          meta={activeFilterId || activeBrowseGroupLabel ? `${visibleItems.length} 件当前结果` : `${itemCount} 件全部单品`}
        >
          <div className="rounded-[1.5rem] border border-black/7 bg-white/92 p-4 shadow-[0_14px_34px_rgba(26,26,26,0.06)] backdrop-blur sm:p-5">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
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
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'border border-[var(--color-neutral-mid)] bg-white text-[var(--color-neutral-dark)]'
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
                  reanalyzingItemId={reanalyzingItemId}
                  deletingItemId={deletingItemId}
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

                  <div className="rounded-[1.25rem] border border-black/7 bg-[var(--color-secondary)]/25 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-neutral-dark)]">
                          {browseMode === 'category' ? '类型分组详情' : '颜色分组详情'}
                        </p>
                        <p className="text-xs text-[var(--color-neutral-dark)]">
                          {activeBrowseGroupLabel
                            ? `当前查看：${activeBrowseGroupLabel}`
                            : `点一个${browseMode === 'category' ? '类型' : '颜色'}卡片，看这一组里的单品。`}
                        </p>
                      </div>
                      {activeBrowseGroupLabel ? (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-neutral-dark)]">
                          {visibleItems.length} 件
                        </span>
                      ) : null}
                    </div>

                    <ClosetItemGrid
                      items={visibleItems}
                      onEditItem={handleEditItem}
                      onReanalyzeItem={handleReanalyzeItem}
                      onDeleteItem={handleDeleteItem}
                      reanalyzingItemId={reanalyzingItemId}
                      deletingItemId={deletingItemId}
                      emptyTitle={gridEmptyTitle}
                      emptyDescription={gridEmptyDescription}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </ClosetSection>
      ) : null}

      {editingItemId && editingDraft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={closeEditor} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="编辑识别结果"
            className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden"
          >
            <Card>
              <div className="flex max-h-[calc(100vh-2rem)] flex-col overflow-y-auto pr-1">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-primary)]">编辑面板</p>
                      <h2 className="text-lg font-semibold text-[var(--color-neutral-dark)]">编辑识别结果</h2>
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
    </AppShell>
  )
}
