'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'
import { SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

type Phase = 'idle' | 'preview' | 'analyzing' | 'confirming'

type ClosetUploadCardProps = {
  userId: string
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
}

export function ClosetUploadCard({ userId, storageBucket, analyzeUpload, saveItem }: ClosetUploadCardProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [draft, setDraft] = useState<ClosetAnalysisDraft | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const previewUrlRef = useRef<string | null>(null)
  const activeRequestIdRef = useRef(0)
  const isAnalyzingRef = useRef(false)

  const clearPreviewUrl = () => {
    if (!previewUrlRef.current) {
      return
    }

    URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
  }

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    return () => {
      activeRequestIdRef.current += 1
      isAnalyzingRef.current = false
      clearPreviewUrl()
    }
  }, [])

  const startUploadAndAnalyze = async (file: File, requestId: number) => {
    if (isAnalyzingRef.current) {
      return
    }

    isAnalyzingRef.current = true
    setIsAnalyzing(true)
    setPhase('analyzing')
    setErrorMessage(null)

    try {
      const path = buildClosetUploadPath(userId, file.name)
      const { error } = await supabase.storage.from(storageBucket).upload(path, file)

      if (requestId !== activeRequestIdRef.current) {
        return
      }

      if (error) {
        setPhase('preview')
        setErrorMessage('图片上传失败，请重试')
        return
      }

      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path)
      const analysis = await analyzeUpload({ imageUrl: data.publicUrl })

      if (requestId !== activeRequestIdRef.current) {
        return
      }

      setDraft({ imageUrl: data.publicUrl, ...analysis })
      setPhase('confirming')
    } catch {
      if (requestId !== activeRequestIdRef.current) {
        return
      }

      setPhase('preview')
      setErrorMessage('AI 分析失败，请重试')
    } finally {
      if (requestId === activeRequestIdRef.current) {
        isAnalyzingRef.current = false
        setIsAnalyzing(false)
      }
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file || isAnalyzingRef.current) {
      return
    }

    clearPreviewUrl()

    const nextPreviewUrl = URL.createObjectURL(file)
    const nextRequestId = activeRequestIdRef.current + 1

    activeRequestIdRef.current = nextRequestId
    setSelectedFile(file)
    setPreviewUrl(nextPreviewUrl)
    setDraft(null)
    setErrorMessage(null)
    setPhase('preview')
    void startUploadAndAnalyze(file, nextRequestId)
  }

  const handleRetry = () => {
    if (!selectedFile || !previewUrl || isAnalyzingRef.current) {
      return
    }

    const nextRequestId = activeRequestIdRef.current + 1

    activeRequestIdRef.current = nextRequestId
    setDraft(null)
    void startUploadAndAnalyze(selectedFile, nextRequestId)
  }

  const resetUploadState = () => {
    activeRequestIdRef.current += 1
    isAnalyzingRef.current = false
    setIsAnalyzing(false)
    clearPreviewUrl()
    setSelectedFile(null)
    setPreviewUrl(null)
    setDraft(null)
    setErrorMessage(null)
    setPhase('idle')
  }

  const isBusy = isAnalyzing || isSaving

  const handleSave = async (nextDraft: ClosetAnalysisDraft) => {
    setIsSaving(true)
    setErrorMessage(null)

    try {
      await saveItem(nextDraft)
      resetUploadState()
      router.refresh()
    } catch {
      setErrorMessage('保存失败，请稍后再试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">添加衣物</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">上传一张单件衣物图片，AI 会先给你分类建议。</p>
          </div>
          <label
            className={`inline-flex rounded-md border border-[var(--color-neutral-mid)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] ${
              isBusy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            {isAnalyzing ? '分析中' : '选择图片'}
            <input
              aria-label="选择衣物图片"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isBusy}
            />
          </label>
        </div>

        {previewUrl ? <img src={previewUrl} alt="本地预览" className="aspect-square w-full rounded-lg object-cover" /> : null}

        {phase === 'analyzing' ? <p className="text-sm">AI 正在分析图片</p> : null}

        {phase === 'confirming' && draft ? (
          <ClosetUploadForm initialDraft={draft} disabled={isSaving} onSubmit={handleSave} />
        ) : null}

        {phase === 'preview' && errorMessage ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-600">{errorMessage}</p>
            <SecondaryButton type="button" onClick={handleRetry} disabled={isBusy}>
              重试分析
            </SecondaryButton>
          </div>
        ) : null}

        {phase !== 'preview' && errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>
    </Card>
  )
}
