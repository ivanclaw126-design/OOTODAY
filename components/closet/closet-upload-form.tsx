'use client'

import { useEffect, useRef, useState } from 'react'
import { PrimaryButton } from '@/components/ui/button'
import {
  getCategoryOptions,
  getColorOptions,
  getSubCategoryOptions,
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

export function ClosetUploadForm({ initialDraft, disabled = false, submitLabel = '保存到衣橱', onSubmit }: ClosetUploadFormProps) {
  const normalizedInitialDraft = {
    ...initialDraft,
    ...normalizeClosetFields(initialDraft)
  }
  const [draft, setDraft] = useState(normalizedInitialDraft)
  const [styleTagsText, setStyleTagsText] = useState(joinStyleTags(normalizedInitialDraft.styleTags))
  const initialDraftSignatureRef = useRef(getDraftSignature(initialDraft))
  const categoryOptions = getCategoryOptions()
  const colorOptions = getColorOptions()
  const subCategoryOptions = getSubCategoryOptions(draft.category)

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
          styleTags: parseStyleTags(styleTagsText)
        })
      }}
    >
      <div className="rounded-[1rem] border border-black/7 bg-[var(--color-secondary)]/35 p-3">
        {draft.imageUrl ? (
          <img src={draft.imageUrl} alt="衣物预览" className="aspect-square w-full rounded-[0.85rem] object-cover" />
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
          <select
            aria-label="分类"
            value={draft.category}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>子分类</span>
          <select
            aria-label="子分类"
            value={draft.subCategory}
            onChange={(event) => setDraft((current) => ({ ...current, subCategory: event.target.value }))}
            className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
          >
            {subCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>颜色</span>
          <select
            aria-label="颜色"
            value={draft.colorCategory}
            onChange={(event) => setDraft((current) => ({ ...current, colorCategory: event.target.value }))}
            className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
          >
            {colorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

      <PrimaryButton type="submit" disabled={disabled}>
        {submitLabel}
      </PrimaryButton>
    </form>
  )
}
