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
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Looks Breakdown</p>
            <div className="space-y-2">
              <p className="text-xl font-semibold tracking-[-0.03em] text-[var(--color-primary)]">先拆掉这套灵感的骨架，再看你衣橱里能借什么</p>
              <p className="max-w-2xl text-sm text-[var(--color-neutral-dark)]">给我一张图或链接，我会先拆出关键单品、搭配逻辑，再落到你现有衣橱能怎么复刻。</p>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[var(--color-line)] bg-[#111111] p-4 text-white shadow-[var(--shadow-strong)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/70">Input</p>
                <p className="mt-2 text-sm text-white/82">上传截图或粘贴图片链接，我会先拆出整套穿搭公式，再用你的衣橱找可复刻的版本。</p>
              </div>

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
                <span className="text-sm text-white/82">电脑端支持拖拽，iPhone / iPad 可直接从相册或拍照上传。</span>
              </div>

              <label
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => void handleDrop(event)}
                className={`flex min-h-32 flex-col items-center justify-center rounded-[1.25rem] border border-dashed px-4 py-6 text-center text-sm transition ${
                  isDragging
                    ? 'border-[var(--color-primary)] bg-[var(--color-secondary)] text-[var(--color-primary)]'
                    : 'border-white/18 bg-white/8 text-white/82'
                }`}
              >
                <span className={`font-medium ${isDragging ? 'text-[var(--color-primary)]' : 'text-white'}`}>拖拽灵感图到这里</span>
                <span className="mt-1 max-w-sm leading-6">{selectedFileName ? `已选择：${selectedFileName}` : '也可以点击上方按钮选择本地图片'}</span>
              </label>

              {previewUrl ? (
                <div className="overflow-hidden rounded-[1.25rem] border border-[var(--color-neutral-mid)] bg-white/70">
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

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-white/82">灵感图片链接</span>
                <input
                  aria-label="灵感图片链接"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                  className="rounded-[1rem] border border-white/18 bg-white/10 px-3 py-3 text-white placeholder:text-white/45"
                />
              </label>
            </div>
          </div>

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

                <div className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/56">一句话总结 At A Glance</p>
                  {analysis.sourceTitle ? (
                    <p className="mt-3 text-sm font-medium text-white/76">{analysis.sourceTitle}</p>
                  ) : null}
                  <div className="mt-3 rounded-[1.2rem] border border-white/8 bg-black/26 p-4">
                    <div className="mb-3 h-1.5 w-14 rounded-full bg-[var(--color-accent)]/90" />
                    <p className="max-w-[18rem] text-[1.58rem] font-semibold leading-[1.28] tracking-[-0.045em] text-white sm:max-w-none sm:text-[1.84rem]">
                      {analysis.breakdown.summary}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-white/84">场景 · {analysis.breakdown.scene}</span>
                    <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-white/84">气质 · {analysis.breakdown.vibe}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <p className="rounded-[1rem] border border-white/10 bg-white/8 px-3 py-2 text-white/84">
                      色彩公式 · {analysis.breakdown.colorFormula ?? '按关键单品颜色复刻'}
                    </p>
                    <p className="rounded-[1rem] border border-white/10 bg-white/8 px-3 py-2 text-white/84">
                      轮廓公式 · {analysis.breakdown.silhouetteFormula ?? '先保住核心轮廓比例'}
                    </p>
                    <p className="rounded-[1rem] border border-white/10 bg-white/8 px-3 py-2 text-white/84">
                      叠穿公式 · {analysis.breakdown.layeringFormula ?? '按内外层关系复刻'}
                    </p>
                    <p className="rounded-[1rem] border border-white/10 bg-white/8 px-3 py-2 text-white/84">
                      视觉中心 · {analysis.breakdown.focalPoint ?? '保住最显眼的关键单品'}
                    </p>
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
                      {item.slot ? ` · ${item.slot}` : ''}
                      {item.colorHint ? ` · ${item.colorHint}` : ''}
                      {(item.silhouette ?? []).length > 0 ? ` · ${(item.silhouette ?? []).join(' / ')}` : ''}
                      {item.layerRole ? ` · ${item.layerRole}` : ''}
                      {item.importance ? ` · ${item.importance}` : ''}
                      {item.styleTags.length > 0 ? ` · ${item.styleTags.join(' / ')}` : ''}
                    </p>
                    {(item.alternatives ?? []).length > 0 ? (
                      <p className="mt-1 text-sm text-white/68">可替代：{(item.alternatives ?? []).join(' / ')}</p>
                    ) : null}
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
                  <p className="text-sm text-[var(--color-neutral-dark)]">{group.matchReason}</p>
                  {group.preferenceNote ? (
                    <p className="text-sm text-[var(--color-neutral-dark)]">{group.preferenceNote}</p>
                  ) : null}
                  {group.scoreBreakdown ? (
                    <p className="text-xs text-[var(--color-neutral-dark)]">
                      匹配分 {Math.round(group.scoreBreakdown.total * 100)} · 类别 {Math.round(group.scoreBreakdown.categoryScore * 100)} / slot {Math.round(group.scoreBreakdown.slotScore * 100)} / 颜色 {Math.round(group.scoreBreakdown.colorScore * 100)} / 轮廓 {Math.round(group.scoreBreakdown.silhouetteScore * 100)} / 风格 {Math.round(group.scoreBreakdown.styleScore * 100)} / 层次 {Math.round(group.scoreBreakdown.layerRoleScore * 100)}
                    </p>
                  ) : null}
                  {group.substituteSuggestion ? (
                    <p className="text-sm text-[var(--color-neutral-dark)]">{group.substituteSuggestion}</p>
                  ) : null}
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
                    <p className="text-sm text-[var(--color-neutral-dark)]">你衣橱里暂时没有很接近的单品，先按公式记住它承担的角色。</p>
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
