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

  const runAnalysis = async (nextSourceUrl: string, manageSubmittingState = true) => {
    if (manageSubmittingState) {
      setIsSubmitting(true)
    }

    setError(null)
    const result = await analyzeCandidate({ sourceUrl: nextSourceUrl })

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
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium">买前分析</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">
              先贴商品链接、商品主图链接，或者直接上传本地图片，我们会结合你现有衣橱判断它值不值得买。
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SecondaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                上传本地图片
              </SecondaryButton>
              <input
                ref={fileInputRef}
                aria-label="上传商品图片"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <span className="text-sm text-[var(--color-neutral-dark)]">电脑端支持拖拽，iPhone / iPad 可直接从相册或拍照上传。</span>
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
              <span className="font-medium text-[var(--color-primary)]">拖拽图片到这里</span>
              <span>{selectedFileName ? `已选择：${selectedFileName}` : '也可以点击上方按钮选择本地图片'}</span>
            </label>

            {previewUrl ? (
              <div className="overflow-hidden rounded-lg border border-[var(--color-neutral-mid)]">
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
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span>商品链接或图片链接</span>
            <input
              aria-label="商品链接或图片链接"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://..."
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
            />
          </label>

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
        <Card>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-[var(--color-neutral-dark)]">识别结果</p>
              {analysis.candidate.sourceTitle ? (
                <p className="text-sm text-[var(--color-neutral-dark)]">{analysis.candidate.sourceTitle}</p>
              ) : null}
              <p className="text-lg font-medium">
                {analysis.candidate.subCategory} · {analysis.candidate.colorCategory}
              </p>
              <p className="text-sm text-[var(--color-neutral-dark)]">
                {analysis.candidate.category} · {analysis.candidate.styleTags.join(' / ') || '无明显风格标签'}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-3">
                <p className="text-sm text-[var(--color-neutral-dark)]">结论</p>
                <p className="text-base font-medium">{recommendationLabel(analysis.recommendation)}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-secondary)] p-3">
                <p className="text-sm text-[var(--color-neutral-dark)]">重复风险</p>
                <p className="text-base font-medium">{duplicateRiskLabel(analysis.duplicateRisk)}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-secondary)] p-3">
                <p className="text-sm text-[var(--color-neutral-dark)]">预计可搭套数</p>
                <p className="text-base font-medium">{analysis.estimatedOutfitCount}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">建议原因</p>
              <p className="text-sm text-[var(--color-neutral-dark)]">{analysis.recommendationReason}</p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">衣橱里相近的单品</p>
              {analysis.duplicateItems.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {analysis.duplicateItems.map((item) => (
                    <p key={item.id} className="text-sm text-[var(--color-neutral-dark)]">
                      {item.subCategory ?? item.category}
                      {item.colorCategory ? ` · ${item.colorCategory}` : ''}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-neutral-dark)]">当前没找到明显重复的单品。</p>
              )}
            </div>

            {analysis.missingCategoryHints.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">还缺什么</p>
                {analysis.missingCategoryHints.map((hint) => (
                  <p key={hint} className="text-sm text-[var(--color-neutral-dark)]">
                    {hint}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}
    </AppShell>
  )
}
