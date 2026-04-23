'use client'

import Image from 'next/image'
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ShopPurchaseAnalysis } from '@/lib/shop/types'

function recommendationLabel(recommendation: ShopPurchaseAnalysis['recommendation']) {
  if (recommendation === 'buy') {
    return '建议买'
  }

  if (recommendation === 'consider') {
    return '可考虑'
  }

  return '建议暂缓'
}

function duplicateRiskLabel(risk: ShopPurchaseAnalysis['duplicateRisk']) {
  if (risk === 'high') {
    return '高'
  }

  if (risk === 'medium') {
    return '中'
  }

  return '低'
}

export function ShopPage({
  itemCount,
  userId,
  storageBucket,
  analyzeCandidate
}: {
  itemCount: number
  userId: string
  storageBucket: string
  analyzeCandidate: (input: {
    sourceUrl: string
    preferredImageUrl?: string
  }) => Promise<{ error: string | null; analysis: ShopPurchaseAnalysis | null }>
}) {
  const supabase = createSupabaseBrowserClient()
  const [sourceUrl, setSourceUrl] = useState('')
  const [analysis, setAnalysis] = useState<ShopPurchaseAnalysis | null>(null)
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

  const runAnalysis = async (nextSourceUrl: string, manageSubmittingState = true, preferredImageUrl?: string) => {
    if (manageSubmittingState) {
      setIsSubmitting(true)
    }

    setError(null)
    const result = await analyzeCandidate({ sourceUrl: nextSourceUrl, preferredImageUrl })

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
    <AppShell title="Shop">
      <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(241,235,226,0.94)_100%)]">
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Buy Before You Buy</p>
            <div className="space-y-2">
              <p className="text-xl font-semibold tracking-[-0.03em] text-[var(--color-primary)]">先判断它值不值得进衣橱</p>
              <p className="max-w-2xl text-sm text-[var(--color-neutral-dark)]">给我链接或图片，我会直接判断值不值、会不会重复、能接上多少套。</p>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4 text-white shadow-[var(--shadow-strong)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/58">Input</p>
                <p className="mt-2 text-sm text-white/68">图片适合快速判断，链接适合直接分析商品页。</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
              <SecondaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                上传本地图片
              </SecondaryButton>
              {selectedFileName ? (
                <SecondaryButton type="button" onClick={clearSelectedImage} disabled={isSubmitting}>
                  删除当前图片
                </SecondaryButton>
              ) : null}
              <input
                ref={fileInputRef}
                aria-label="上传商品图片"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
                <span className="text-sm text-white/68">电脑端支持拖拽，iPhone / iPad 可直接从相册或拍照上传。</span>
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
                    : 'border-white/12 bg-white/6 text-white/68'
                }`}
              >
                <span className={`font-medium ${isDragging ? 'text-[var(--color-primary)]' : 'text-white'}`}>拖拽图片到这里</span>
                <span className="mt-1 max-w-sm leading-6">{selectedFileName ? `已选择：${selectedFileName}` : '也可以点击上方按钮选择本地图片'}</span>
              </label>

              {previewUrl ? (
                <div className="overflow-hidden rounded-[1.25rem] border border-[var(--color-neutral-mid)] bg-white/70">
                  <Image
                    src={previewUrl}
                    alt="待分析商品预览"
                    width={960}
                    height={960}
                    unoptimized
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-white/74">商品链接或图片链接</span>
                <input
                  aria-label="商品链接或图片链接"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                  className="rounded-[1rem] border border-white/10 bg-white/8 px-3 py-3 text-white placeholder:text-white/32"
                />
              </label>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <PrimaryButton
            type="button"
            disabled={isSubmitting || !sourceUrl.trim()}
            onClick={() => void runAnalysis(sourceUrl)}
          >
            {isSubmitting ? '分析中' : '开始分析'}
          </PrimaryButton>
        </div>
      </Card>

      {itemCount === 0 ? (
        <EmptyState
          title="先把衣橱填起来"
          description="购买分析要先知道你已经有什么，才能判断重复不重复、能搭几套。"
        />
      ) : null}

      {analysis ? (
        <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(240,233,223,0.94)_100%)]">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Analysis Result</p>
              {analysis.candidate.sourceTitle ? (
                <p className="text-sm text-[var(--color-neutral-dark)]">{analysis.candidate.sourceTitle}</p>
              ) : null}
              <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-primary)]">
                {analysis.candidate.subCategory} · {analysis.candidate.colorCategory}
              </p>
              <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">
                {analysis.candidate.category} · {analysis.candidate.styleTags.join(' / ') || '无明显风格标签'}
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.25rem] border border-[var(--color-neutral-mid)] bg-white/70">
              <Image
                src={analysis.candidate.imageUrl}
                alt={analysis.candidate.sourceTitle ? `${analysis.candidate.sourceTitle} 商品图` : '商品分析结果图'}
                width={960}
                height={960}
                unoptimized
                className="h-72 w-full object-cover"
              />
            </div>

            {analysis.candidate.imageCandidates.length > 1 ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Candidate Images</p>
                  <p className="text-sm text-[var(--color-neutral-dark)]">如果当前像模特全身图，可以直接换成更干净的单品图重跑分析。</p>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {analysis.candidate.imageCandidates.map((candidateImageUrl, index) => {
                    const isActive = candidateImageUrl === analysis.candidate.imageUrl

                    return (
                      <button
                        key={candidateImageUrl}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => void runAnalysis(analysis.candidate.sourceUrl, true, candidateImageUrl)}
                        className={`overflow-hidden rounded-[1rem] border text-left transition ${
                          isActive
                            ? 'border-[var(--color-primary)] ring-2 ring-[rgba(54,42,32,0.14)]'
                            : 'border-[var(--color-neutral-mid)] hover:border-[var(--color-primary)]'
                        }`}
                        aria-pressed={isActive}
                        aria-label={`切换候选图 ${index + 1}`}
                      >
                        <Image
                          src={candidateImageUrl}
                          alt={`候选商品图 ${index + 1}`}
                          width={320}
                          height={320}
                          unoptimized
                          className="h-24 w-full object-cover"
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4 text-white shadow-[var(--shadow-strong)]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/56">Verdict</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">{recommendationLabel(analysis.recommendation)}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.72)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-neutral-dark)]">Repeat Risk</p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">{duplicateRiskLabel(analysis.duplicateRisk)}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--color-line)] bg-[rgba(231,255,55,0.18)] p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-neutral-dark)]">Outfit Yield</p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-primary)]">{analysis.estimatedOutfitCount}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4 text-white shadow-[var(--shadow-strong)]">
                <div className="flex flex-col gap-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-white/58">Why</p>
                  <p className="text-sm leading-6 text-white/72">{analysis.recommendationReason}</p>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex flex-col gap-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">In Closet Already</p>
                  {analysis.duplicateItems.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {analysis.duplicateItems.map((item) => (
                        <p key={item.id} className="text-sm leading-6 text-[var(--color-neutral-dark)]">
                          {item.subCategory ?? item.category}
                          {item.colorCategory ? ` · ${item.colorCategory}` : ''}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">当前没找到明显重复的单品。</p>
                  )}
                </div>
              </div>
            </div>

            {analysis.missingCategoryHints.length > 0 ? (
              <div className="rounded-[1.4rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex flex-col gap-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Still Missing</p>
                  {analysis.missingCategoryHints.map((hint) => (
                    <p key={hint} className="text-sm leading-6 text-[var(--color-neutral-dark)]">
                      {hint}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {analysis.colorStrategyHints.length > 0 ? (
              <div className="rounded-[1.4rem] border border-[var(--color-line)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="flex flex-col gap-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-neutral-dark)]">Color Strategy</p>
                  {analysis.colorStrategyHints.map((hint) => (
                    <p key={hint} className="text-sm leading-6 text-[var(--color-neutral-dark)]">
                      {hint}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
    </AppShell>
  )
}
