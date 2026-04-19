'use client'

import { useEffect, useState } from 'react'
import { PrimaryButton } from '@/components/ui/button'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'

type ClosetUploadFormProps = {
  initialDraft: ClosetAnalysisDraft
  disabled?: boolean
  onSubmit: (draft: ClosetAnalysisDraft) => void | Promise<void>
}

export function ClosetUploadForm({ initialDraft, disabled = false, onSubmit }: ClosetUploadFormProps) {
  const [draft, setDraft] = useState(initialDraft)
  const [styleTagsText, setStyleTagsText] = useState(initialDraft.styleTags.join(', '))

  useEffect(() => {
    setDraft(initialDraft)
    setStyleTagsText(initialDraft.styleTags.join(', '))
  }, [initialDraft])

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit({
          ...draft,
          styleTags: styleTagsText
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        })
      }}
    >
      <img src={draft.imageUrl} alt="衣物预览" className="aspect-square w-full rounded-lg object-cover" />

      <label className="flex flex-col gap-1 text-sm">
        <span>分类</span>
        <input
          aria-label="分类"
          value={draft.category}
          onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>子分类</span>
        <input
          aria-label="子分类"
          value={draft.subCategory}
          onChange={(event) => setDraft((current) => ({ ...current, subCategory: event.target.value }))}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>颜色</span>
        <input
          aria-label="颜色"
          value={draft.colorCategory}
          onChange={(event) => setDraft((current) => ({ ...current, colorCategory: event.target.value }))}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
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

      <PrimaryButton type="submit" disabled={disabled}>
        保存到衣橱
      </PrimaryButton>
    </form>
  )
}
