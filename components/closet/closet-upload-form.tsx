'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { PrimaryButton } from '@/components/ui/button'
import {
  ClosetCategoryIcon,
  ClosetColorIcon,
  ClosetSubCategoryIcon
} from '@/components/closet/closet-taxonomy-icons'
import {
  getCategoryOptions,
  getColorOptions,
  getSubCategoryOptions,
  UNKNOWN_CATEGORY,
  UNKNOWN_COLOR,
  UNKNOWN_SUBCATEGORY,
  normalizeCategoryValue,
  normalizeClosetFields,
  normalizeSubCategoryValue
} from '@/lib/closet/taxonomy'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'

type ClosetUploadFormProps = {
  initialDraft: ClosetAnalysisDraft
  disabled?: boolean
  submitLabel?: string
  onSubmit: (draft: ClosetAnalysisDraft) => void | Promise<void>
}

function getDraftSignature(draft: ClosetAnalysisDraft) {
  return JSON.stringify(draft)
}

function joinStyleTags(styleTags: string[]) {
  return styleTags.join(', ')
}

function parseStyleTags(styleTagsText: string) {
  return styleTagsText
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

const conditionOptions = ['全新', '良好', '常穿', '待观察'] as const
const activeChoiceClassName =
  'border-[var(--color-primary)] bg-[var(--color-accent)] text-[var(--color-primary)] shadow-[0_10px_22px_rgba(17,14,9,0.12)] ring-1 ring-[var(--color-primary)]/10'
const inactiveChoiceClassName = 'border-[var(--color-neutral-mid)] bg-white/88 text-[var(--color-neutral-dark)]'
const activeIconClassName = 'bg-[var(--color-primary)] text-[var(--color-accent)]'
const inactiveIconClassName = 'bg-white/72'
const selectedSummaryClassName = `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${activeChoiceClassName}`

export function ClosetUploadForm({ initialDraft, disabled = false, submitLabel = '保存到衣橱', onSubmit }: ClosetUploadFormProps) {
  const normalizedInitialDraft = {
    ...initialDraft,
    ...normalizeClosetFields(initialDraft)
  }
  const [draft, setDraft] = useState(normalizedInitialDraft)
  const [styleTagsText, setStyleTagsText] = useState(joinStyleTags(normalizedInitialDraft.styleTags))
  const initialDraftSignatureRef = useRef(getDraftSignature(initialDraft))
  const categoryOptions = getCategoryOptions().filter((option) => option.value !== UNKNOWN_CATEGORY)
  const colorOptions = getColorOptions().filter((option) => option.value !== UNKNOWN_COLOR)
  const subCategoryOptions = getSubCategoryOptions(draft.category).filter((option) => option.value !== UNKNOWN_SUBCATEGORY)

  useEffect(() => {
    const nextSignature = getDraftSignature(initialDraft)

    if (initialDraftSignatureRef.current === nextSignature) {
      return
    }

    initialDraftSignatureRef.current = nextSignature
    setDraft({
      ...initialDraft,
      ...normalizeClosetFields(initialDraft)
    })
    setStyleTagsText(joinStyleTags(initialDraft.styleTags))
  }, [initialDraft])

  const handleCategoryChange = (nextCategory: string) => {
    setDraft((current) => {
      const normalizedCategory = normalizeCategoryValue(nextCategory)
      const normalizedSubCategory = normalizeSubCategoryValue(current.subCategory, normalizedCategory)

      return {
        ...current,
        category: normalizedCategory,
        subCategory: normalizedSubCategory
      }
    })
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit({
          ...draft,
          purchasePrice: draft.purchasePrice ?? null,
          purchaseYear: draft.purchaseYear?.trim() ? draft.purchaseYear.trim() : null,
          itemCondition: draft.itemCondition?.trim() ? draft.itemCondition.trim() : null,
          styleTags: parseStyleTags(styleTagsText)
        })
      }}
    >
      <div className="rounded-[1rem] border border-black/7 bg-[var(--color-secondary)]/35 p-3">
        {draft.imageUrl ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-[0.85rem]">
            <Image
              src={draft.imageUrl}
              alt="衣物预览"
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 420px"
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-[0.85rem] bg-white text-sm text-[var(--color-neutral-dark)]">
            暂无图片
          </div>
        )}
        <p className="mt-2 text-xs text-[var(--color-neutral-dark)]">确认图片和识别结果无误后再保存，后面还能继续在衣橱里整理和筛选。</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>分类</span>
          <div className="flex flex-wrap gap-2">
            <span className={selectedSummaryClassName}>
              <span className={`rounded-full p-1 ${activeIconClassName}`}>
                <ClosetCategoryIcon category={draft.category} size="sm" />
              </span>
              <span>{draft.category}</span>
            </span>
          </div>
          <input aria-label="分类" value={draft.category} readOnly className="sr-only" />
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryOptions.map((option) => {
              const isActive = draft.category === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleCategoryChange(option.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive ? activeChoiceClassName : inactiveChoiceClassName
                  }`}
                >
                  <span className={`rounded-full p-1 ${isActive ? activeIconClassName : inactiveIconClassName}`}>
                    <ClosetCategoryIcon category={option.value} size="sm" />
                  </span>
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
          {draft.category === UNKNOWN_CATEGORY ? <p className="text-xs text-[var(--color-neutral-dark)]">AI 还没认准，点一个最接近的分类。</p> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>子分类</span>
          <div className="flex flex-wrap gap-2">
            <span className={selectedSummaryClassName}>
              <span className={`rounded-full p-1 ${activeIconClassName}`}>
                <ClosetSubCategoryIcon subCategory={draft.subCategory} size="sm" />
              </span>
              <span>{draft.subCategory}</span>
            </span>
          </div>
          <input aria-label="子分类" value={draft.subCategory} readOnly className="sr-only" />
          <div className="mt-2 flex flex-wrap gap-2">
            {subCategoryOptions.map((option) => {
              const isActive = draft.subCategory === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, subCategory: option.value }))}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive ? activeChoiceClassName : inactiveChoiceClassName
                  }`}
                >
                  <span className={`rounded-full p-1 ${isActive ? activeIconClassName : inactiveIconClassName}`}>
                    <ClosetSubCategoryIcon subCategory={option.value} size="sm" />
                  </span>
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
          {subCategoryOptions.length === 0 ? (
            <p className="text-xs text-[var(--color-neutral-dark)]">先选分类，子分类就会缩到对应范围。</p>
          ) : draft.subCategory === UNKNOWN_SUBCATEGORY ? (
            <p className="text-xs text-[var(--color-neutral-dark)]">AI 暂时没认准，点一个更准确的子分类。</p>
          ) : null}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>颜色</span>
          <div className="flex flex-wrap gap-2">
            <span className={selectedSummaryClassName}>
              <span className={`rounded-full p-1 ${activeIconClassName}`}>
                <ClosetColorIcon color={draft.colorCategory} size="sm" />
              </span>
              <span>{draft.colorCategory}</span>
            </span>
          </div>
          <input aria-label="颜色" value={draft.colorCategory} readOnly className="sr-only" />
          <div className="mt-2 flex flex-wrap gap-2">
            {colorOptions.map((option) => {
              const isActive = draft.colorCategory === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, colorCategory: option.value }))}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive ? activeChoiceClassName : inactiveChoiceClassName
                  }`}
                >
                  <span className={`rounded-full p-1 ${isActive ? activeIconClassName : inactiveIconClassName}`}>
                    <ClosetColorIcon color={option.value} size="sm" />
                  </span>
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
          {draft.colorCategory === UNKNOWN_COLOR ? <p className="text-xs text-[var(--color-neutral-dark)]">AI 暂时没认准，点一个更准确的颜色。</p> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>风格标签</span>
          <input
            aria-label="风格标签"
            value={styleTagsText}
            onChange={(event) => setStyleTagsText(event.target.value)}
            className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
          />
        </label>
      </div>

      <div className="rounded-[1rem] border border-black/7 bg-white/82 p-3">
        <div className="mb-2 space-y-1">
          <p className="text-sm font-medium text-[var(--color-primary)]">补充信息</p>
          <p className="text-xs text-[var(--color-neutral-dark)]">Beta 期先记住价格、年份和状态，后面 Today / Shop 才更容易给出更像你的建议。</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>购买价格</span>
            <input
              aria-label="购买价格"
              type="number"
              min="0"
              step="0.01"
              value={draft.purchasePrice ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  purchasePrice: event.target.value ? Number(event.target.value) : null
                }))
              }
              placeholder="例如 299"
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>购买年份</span>
            <input
              aria-label="购买年份"
              inputMode="numeric"
              maxLength={4}
              value={draft.purchaseYear ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  purchaseYear: event.target.value.replace(/[^\d]/g, '').slice(0, 4)
                }))
              }
              placeholder="例如 2024"
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>当前状态</span>
            <select
              aria-label="当前状态"
              value={draft.itemCondition ?? ''}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  itemCondition: event.target.value || null
                }))
              }
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
            >
              <option value="">暂不填写</option>
              {conditionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <PrimaryButton type="submit" disabled={disabled}>
        {submitLabel}
      </PrimaryButton>
    </form>
  )
}
