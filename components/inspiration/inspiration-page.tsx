'use client'

import Image from 'next/image'
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
import type { InspirationAnalysis } from '@/lib/inspiration/types'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function InspirationPage({
  itemCount,
  userId,
  storageBucket,
  analyzeInspiration
}: {
  itemCount: number
  userId: string
  storageBucket: string
  analyzeInspiration: (input: {
    sourceUrl: string
  }) => Promise<{ error: string | null; analysis: InspirationAnalysis | null }>
}) {
  const supabase = createSupabaseBrowserClient()
  const [sourceUrl, setSourceUrl] = useState('')
  const [analysis, setAnalysis] = useState<InspirationAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const resetLocalPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    setPreviewUrl(null)
    setSelectedFileName(null)
  }

  const clearSelectedImage = () => {
    resetLocalPreview()
    setSourceUrl('')
    setAnalysis(null)
    setError(null)
    setIsDragging(false)
  }

  const runAnalysis = async (nextSourceUrl: string, manageSubmittingState = true) => {
    if (manageSubmittingState) {
      setIsSubmitting(true)
    }

    setError(null)
    const result = await analyzeInspiration({ sourceUrl: nextSourceUrl })

    if (manageSubmittingState) {
      setIsSubmitting(false)
    }

    if (result.error || !result.analysis) {
      setAnalysis(null)
      setError(result.error ?? '分析失败，请稍后再试')
      return
    }

    setAnalysis(result.analysis)
  }

  const handleFileUpload = async (file: File) => {
    if (isSubmitting) {
      return
    }

    const localPreviewUrl = URL.createObjectURL(file)
    resetLocalPreview()
    previewUrlRef.current = localPreviewUrl
    setPreviewUrl(localPreviewUrl)
    setSelectedFileName(file.name)
    setAnalysis(null)
    setIsSubmitting(true)
    setError(null)

    try {
      const path = buildClosetUploadPath(userId, file.name)
      const { error: uploadError } = await supabase.storage.from(storageBucket).upload(path, file)

      if (uploadError) {
        setIsSubmitting(false)
        setError('图片上传失败，请重试')
        return
      }

      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path)
      setSourceUrl(data.publicUrl)
      await runAnalysis(data.publicUrl, false)
    } catch {
      setIsSubmitting(false)
      setError('图片上传失败，请重试')
      return
    }

    setIsSubmitting(false)
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    await handleFileUpload(file)
  }

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]

    if (!file || !file.type.startsWith('image/')) {
      setError('请拖入图片文件')
      return
    }

    await handleFileUpload(file)
  }

  return (
    <AppShell title="Inspiration">
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">灵感拆解</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">
              贴一张灵感图，我们会先拆解它的穿搭逻辑，再告诉你衣橱里有哪些单品可以借用。
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SecondaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                上传灵感图
              </SecondaryButton>
              {selectedFileName ? (
                <SecondaryButton type="button" onClick={clearSelectedImage} disabled={isSubmitting}>
                  删除当前图片
                </SecondaryButton>
              ) : null}
              <input
                ref={fileInputRef}
                aria-label="上传灵感图片"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <span className="text-sm text-[var(--color-neutral-dark)]">支持电脑端拖拽，也支持 iPhone / iPad 相册或拍照上传。</span>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => void handleDrop(event)}
              className={`flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center text-sm transition ${
                isDragging
                  ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]'
                  : 'border-[var(--color-neutral-mid)] text-[var(--color-neutral-dark)]'
              }`}
            >
              <span className="font-medium text-[var(--color-primary)]">拖拽灵感图到这里</span>
              <span>{selectedFileName ? `已选择：${selectedFileName}` : '也可以点击上方按钮选择本地图片'}</span>
            </label>

            {previewUrl ? (
              <div className="overflow-hidden rounded-lg border border-[var(--color-neutral-mid)]">
                <Image
                  src={previewUrl}
                  alt="待拆解灵感图预览"
                  width={960}
                  height={960}
                  unoptimized
                  className="h-56 w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span>灵感图片链接</span>
            <input
              aria-label="灵感图片链接"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://..."
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <PrimaryButton type="button" disabled={isSubmitting || !sourceUrl.trim()} onClick={() => void runAnalysis(sourceUrl)}>
            {isSubmitting ? '拆解中' : '开始拆解'}
          </PrimaryButton>
        </div>
      </Card>

      {itemCount === 0 ? (
        <EmptyState
          title="先加几件自己的衣服"
          description="灵感页会把外部穿搭和你的真实衣橱对上号，没有衣橱数据时只能做纯拆解。"
        />
      ) : null}

      {analysis ? (
        <>
          <Card>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-[var(--color-neutral-dark)]">整体判断</p>
                {analysis.sourceTitle ? (
                  <p className="text-sm text-[var(--color-neutral-dark)]">{analysis.sourceTitle}</p>
                ) : null}
                <p className="text-lg font-medium">{analysis.breakdown.summary}</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">
                  {analysis.breakdown.scene} · {analysis.breakdown.vibe}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">关键单品</p>
                {analysis.breakdown.keyItems.map((item) => (
                  <div key={item.id} className="rounded-lg bg-[var(--color-secondary)] p-3">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-sm text-[var(--color-neutral-dark)]">
                      {item.category}
                      {item.colorHint ? ` · ${item.colorHint}` : ''}
                      {item.styleTags.length > 0 ? ` · ${item.styleTags.join(' / ')}` : ''}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">搭配逻辑</p>
                {analysis.breakdown.stylingTips.map((tip) => (
                  <p key={tip} className="text-sm text-[var(--color-neutral-dark)]">
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium">你衣橱里能借什么</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">先从已有单品里找最接近这套灵感的借用点。</p>
              </div>

              {analysis.closetMatches.map((group) => (
                <div key={group.inspirationItem.id} className="flex flex-col gap-2 rounded-lg bg-[var(--color-secondary)] p-3">
                  <p className="text-sm font-medium">
                    {group.inspirationItem.label} · {group.inspirationItem.category}
                  </p>
                  {group.matchedItems.length > 0 ? (
                    group.matchedItems.map((item) => (
                      <p key={item.id} className="text-sm text-[var(--color-neutral-dark)]">
                        {item.subCategory ?? item.category}
                        {item.colorCategory ? ` · ${item.colorCategory}` : ''}
                        {item.styleTags.length > 0 ? ` · ${item.styleTags.join(' / ')}` : ''}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--color-neutral-dark)]">你衣橱里暂时没有很接近的同类单品。</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium">{analysis.remixPlan.title}</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">{analysis.remixPlan.summary}</p>
              </div>

              <div className="rounded-lg bg-[var(--color-secondary)] p-3">
                <p className="text-sm font-medium">
                  完成度：{analysis.remixPlan.matchedCount}/{analysis.remixPlan.totalCount}
                </p>
                <p className="text-sm text-[var(--color-neutral-dark)]">{analysis.remixPlan.coverageLabel}</p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">复刻步骤</p>
                {analysis.remixPlan.steps.map((step) => (
                  <div key={step.inspirationItem.id} className="rounded-lg bg-[var(--color-secondary)] p-3">
                    <p className="text-sm font-medium">
                      {step.inspirationItem.label}
                      {step.inspirationItem.colorHint ? ` · ${step.inspirationItem.colorHint}` : ''}
                    </p>
                    <p className="text-sm text-[var(--color-neutral-dark)]">{step.note}</p>
                  </div>
                ))}
              </div>

              {analysis.remixPlan.missingItems.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">当前缺口</p>
                  {analysis.remixPlan.missingItems.map((item) => (
                    <p key={item.id} className="text-sm text-[var(--color-neutral-dark)]">
                      {item.label}
                      {item.colorHint ? ` · ${item.colorHint}` : ''}
                      {item.styleTags.length > 0 ? ` · ${item.styleTags.join(' / ')}` : ''}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </>
      ) : null}
    </AppShell>
  )
}
