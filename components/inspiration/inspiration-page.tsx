'use client'

import Image from 'next/image'
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ItemShowcase } from '@/components/ui/item-showcase'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
import { useSessionState } from '@/lib/hooks/use-session-state'
import type { InspirationAnalysis } from '@/lib/inspiration/types'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const LOOKS_STORAGE_KEY = 'ootoday:looks-page'

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
  const [sourceUrl, setSourceUrl] = useSessionState(`${LOOKS_STORAGE_KEY}:sourceUrl`, '')
  const [analysis, setAnalysis] = useSessionState<InspirationAnalysis | null>(`${LOOKS_STORAGE_KEY}:analysis`, null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useSessionState<string | null>(`${LOOKS_STORAGE_KEY}:previewUrl`, null)
  const [selectedFileName, setSelectedFileName] = useSessionState<string | null>(`${LOOKS_STORAGE_KEY}:selectedFileName`, null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  function revokePreviewUrl(url: string | null) {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    return () => {
      revokePreviewUrl(previewUrlRef.current)
    }
  }, [])

  const resetLocalPreview = () => {
    revokePreviewUrl(previewUrlRef.current)
    previewUrlRef.current = null

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
      previewUrlRef.current = data.publicUrl
      setPreviewUrl(data.publicUrl)
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
    <AppShell title="Looks">
      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(241,235,226,0.94)_100%)]">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Looks Breakdown</p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">先拆掉这套灵感的骨架，再看你衣橱里能借什么。</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">贴一张图，我会拆出核心搭配，再对照你衣橱里能借用的单品。</p>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.8rem] border border-[var(--color-line)] bg-[#111111] p-4 text-white shadow-[var(--shadow-strong)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex flex-wrap gap-2">
                <SecondaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting} className="shrink-0 whitespace-nowrap">
                  上传灵感图
                </SecondaryButton>
                {selectedFileName ? (
                  <SecondaryButton type="button" onClick={clearSelectedImage} disabled={isSubmitting} className="shrink-0 whitespace-nowrap">
                    删除当前图片
                  </SecondaryButton>
                ) : null}
                <input
                  ref={fileInputRef}
                  aria-label="上传灵感图片"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </div>
              <span className="text-sm text-white/82">支持电脑端拖拽，也支持 iPhone / iPad 相册或拍照上传。</span>
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
                  ? 'border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-primary)]'
                  : 'border-white/18 bg-white/8 text-white/82'
              }`}
            >
              <span className={`font-medium ${isDragging ? 'text-[var(--color-primary)]' : 'text-white'}`}>拖拽灵感图到这里</span>
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
            <span className="font-medium text-[var(--color-primary)]">灵感图片链接</span>
            <input
              aria-label="灵感图片链接"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://..."
              className="rounded-[1rem] border border-[var(--color-line)] bg-white/74 px-3 py-3"
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
          <Card className="overflow-hidden bg-[#111111] text-white shadow-[var(--shadow-strong)]">
            <div className="flex flex-col gap-5">
              <div className="grid gap-4 md:grid-cols-[0.88fr_1.12fr]">
                <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/4">
                  <Image
                    src={analysis.imageUrl}
                    alt={analysis.sourceTitle ? `${analysis.sourceTitle} 灵感图` : '灵感图'}
                    width={960}
                    height={960}
                    unoptimized
                    className="h-64 w-full object-cover"
                  />
                </div>

                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/70">一句话总结 At A Glance</p>
                  {analysis.sourceTitle ? (
                    <p className="mt-3 text-sm text-white/72">{analysis.sourceTitle}</p>
                  ) : null}
                  <p className="mt-3 text-[1.55rem] font-semibold leading-[1.28] tracking-[-0.04em] text-white sm:text-[1.8rem]">
                    {analysis.breakdown.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-white/82">{analysis.breakdown.scene}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-white/82">{analysis.breakdown.vibe}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-white">关键单品 Key Pieces</p>
                {analysis.breakdown.keyItems.map((item) => (
                  <div key={item.id} className="rounded-[1.2rem] border border-white/10 bg-white/4 p-3">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-sm text-white/82">
                      {item.category}
                      {item.colorHint ? ` · ${item.colorHint}` : ''}
                      {item.styleTags.length > 0 ? ` · ${item.styleTags.join(' / ')}` : ''}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-white">搭配逻辑 Styling Logic</p>
                {analysis.breakdown.stylingTips.map((tip) => (
                  <p key={tip} className="text-sm text-white/82">
                    {tip}
                  </p>
                ))}
              </div>

              {(analysis.breakdown.colorStrategyNotes ?? []).length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-[var(--color-accent)]">颜色为什么成立 Color Notes</p>
                  {(analysis.breakdown.colorStrategyNotes ?? []).map((note) => (
                    <p key={note} className="text-sm text-white/86">
                      {note}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium">你衣橱里能借什么 Closet Matches</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">先从已有单品里找最接近这套灵感的借用点。</p>
              </div>

              {analysis.closetMatches.map((group) => (
                <div key={group.inspirationItem.id} className="flex flex-col gap-2 rounded-[1.3rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.72)] p-3">
                  <p className="text-sm font-medium">
                    {group.inspirationItem.label} · {group.inspirationItem.category}
                  </p>
                  {group.matchedItems.length > 0 ? (
                    <ItemShowcase
                      items={group.matchedItems.map((item) => ({
                        id: item.id,
                        imageUrl: item.imageUrl,
                        label: item.subCategory ?? item.category,
                        meta: [item.colorCategory, item.styleTags[0]].filter(Boolean).join(' · ')
                      }))}
                      title="可借单品 Borrow From Closet"
                      subtitle={group.matchedItems
                        .map((item) =>
                          [item.subCategory ?? item.category, item.colorCategory, item.styleTags.join(' / ')].filter(Boolean).join(' · ')
                        )
                        .join(' / ')}
                    />
                  ) : (
                    <p className="text-sm text-[var(--color-neutral-dark)]">你衣橱里暂时没有很接近的同类单品。</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium">{analysis.remixPlan.title}</p>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">Remix Plan</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">{analysis.remixPlan.summary}</p>
              </div>

              <div className="rounded-[1.3rem] border border-[var(--color-line)] bg-[#111111] p-4 text-white">
                <p className="text-sm font-medium">
                  完成度：{analysis.remixPlan.matchedCount}/{analysis.remixPlan.totalCount}
                </p>
                <p className="text-sm text-white/82">{analysis.remixPlan.coverageLabel}</p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">复刻步骤 Remix Steps</p>
                {analysis.remixPlan.steps.map((step) => (
                  <div key={step.inspirationItem.id} className="rounded-[1.3rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.72)] p-3">
                    <p className="text-sm font-medium">
                      {step.inspirationItem.label}
                      {step.inspirationItem.colorHint ? ` · ${step.inspirationItem.colorHint}` : ''}
                    </p>
                    <p className="text-sm text-[var(--color-neutral-dark)]">{step.note}</p>
                    {step.matchedItem ? (
                      <div className="mt-3">
                        <ItemShowcase
                          compact
                          items={[
                            {
                              id: step.matchedItem.id,
                              imageUrl: step.matchedItem.imageUrl,
                              label: step.matchedItem.subCategory ?? step.matchedItem.category,
                              meta: [step.matchedItem.colorCategory, step.matchedItem.styleTags[0]].filter(Boolean).join(' · ')
                            }
                          ]}
                          title="这件来代替 Use This"
                          subtitle={[step.matchedItem.colorCategory, step.matchedItem.styleTags.join(' / ')].filter(Boolean).join(' · ')}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {analysis.remixPlan.missingItems.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">当前缺口 Missing Pieces</p>
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
