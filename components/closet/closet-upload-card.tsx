'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClosetCollageSplitter } from '@/components/closet/closet-collage-splitter'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'
import { SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

type Phase = 'idle' | 'analyzing' | 'confirming' | 'error'

type UploadQueueItem = {
  id: string
  kind: 'local' | 'remote'
  file: File
  previewUrl: string
}

type CurrentUpload = UploadQueueItem & {
  phase: Exclude<Phase, 'idle'>
  draft: ClosetAnalysisDraft | null
  errorMessage: string | null
}

type ClosetUploadCardProps = {
  userId: string
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  analyzeImportUrl: (input: { sourceUrl: string }) => Promise<{ error: string | null; draft: ClosetAnalysisDraft | null }>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
}

export function ClosetUploadCard({ userId, storageBucket, analyzeUpload, analyzeImportUrl, saveItem }: ClosetUploadCardProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [currentUpload, setCurrentUpload] = useState<CurrentUpload | null>(null)
  const [pendingUploads, setPendingUploads] = useState<UploadQueueItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [importSourceUrl, setImportSourceUrl] = useState('')
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const previewUrlsRef = useRef<string[]>([])
  const hasSavedItemsRef = useRef(false)
  const activeRequestIdRef = useRef(0)
  const isAnalyzingRef = useRef(false)

  const registerPreviewUrl = (previewUrl: string) => {
    previewUrlsRef.current.push(previewUrl)
  }

  const revokePreviewUrl = (previewUrl: string) => {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    previewUrlsRef.current = previewUrlsRef.current.filter((item) => item !== previewUrl)
  }

  useEffect(() => {
    return () => {
      activeRequestIdRef.current += 1
      isAnalyzingRef.current = false
      for (const previewUrl of previewUrlsRef.current) {
        URL.revokeObjectURL(previewUrl)
      }
      previewUrlsRef.current = []
    }
  }, [])

  const queueNextUpload = (remainingUploads: UploadQueueItem[], nextCompletedCount: number, shouldRefresh: boolean) => {
    if (remainingUploads.length === 0) {
      if (shouldRefresh || hasSavedItemsRef.current) {
        router.refresh()
      }

      activeRequestIdRef.current += 1
      isAnalyzingRef.current = false
      hasSavedItemsRef.current = false
      setIsAnalyzing(false)
      setCurrentUpload(null)
      setPendingUploads([])
      setCompletedCount(0)
      setTotalCount(0)
      return
    }

    const [nextUpload, ...nextPending] = remainingUploads
    const nextRequestId = activeRequestIdRef.current + 1

    activeRequestIdRef.current = nextRequestId
    setPendingUploads(nextPending)
    setCompletedCount(nextCompletedCount)
    setCurrentUpload({
      ...nextUpload,
      phase: 'analyzing',
      draft: null,
      errorMessage: null
    })
    void startUploadAndAnalyze(nextUpload, nextRequestId)
  }

  const startUploadAndAnalyze = async (uploadItem: UploadQueueItem, requestId: number) => {
    if (isAnalyzingRef.current) {
      return
    }

    isAnalyzingRef.current = true
    setIsAnalyzing(true)
    setCurrentUpload((current) =>
      current?.id === uploadItem.id
        ? {
            ...current,
            phase: 'analyzing',
            draft: null,
            errorMessage: null
          }
        : current
    )

    try {
      const path = buildClosetUploadPath(userId, uploadItem.file.name)
      const { error } = await supabase.storage.from(storageBucket).upload(path, uploadItem.file)

      if (requestId !== activeRequestIdRef.current) {
        return
      }

      if (error) {
        setCurrentUpload((current) =>
          current?.id === uploadItem.id
            ? {
                ...current,
                phase: 'error',
                errorMessage: '图片上传失败，请重试'
              }
            : current
        )
        return
      }

      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path)
      const analysis = await analyzeUpload({ imageUrl: data.publicUrl })

      if (requestId !== activeRequestIdRef.current) {
        return
      }

      setCurrentUpload((current) =>
        current?.id === uploadItem.id
          ? {
              ...current,
              phase: 'confirming',
              draft: { imageUrl: data.publicUrl, ...analysis },
              errorMessage: null
            }
          : current
      )
    } catch {
      if (requestId !== activeRequestIdRef.current) {
        return
      }

      setCurrentUpload((current) =>
        current?.id === uploadItem.id
          ? {
              ...current,
              phase: 'error',
              errorMessage: 'AI 分析失败，请重试'
            }
          : current
      )
    } finally {
      if (requestId === activeRequestIdRef.current) {
        isAnalyzingRef.current = false
        setIsAnalyzing(false)
      }
    }
  }

  const enqueueLocalFiles = (files: File[]) => {
    if (files.length === 0 || currentUpload || isSaving) {
      return
    }

    const uploads = files.map((file, index) => {
      const previewUrl = URL.createObjectURL(file)
      registerPreviewUrl(previewUrl)

      return {
        id: `${Date.now()}-${index}-${file.name}`,
        kind: 'local' as const,
        file,
        previewUrl
      }
    })

    const [firstUpload, ...restUploads] = uploads
    const nextRequestId = activeRequestIdRef.current + 1

    activeRequestIdRef.current = nextRequestId
    setCompletedCount(0)
    setTotalCount(uploads.length)
    setPendingUploads(restUploads)
    setCurrentUpload({
      ...firstUpload,
      phase: 'analyzing',
      draft: null,
      errorMessage: null
    })
    void startUploadAndAnalyze(firstUpload, nextRequestId)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])

    event.target.value = ''
    enqueueLocalFiles(files)
  }

  const runImportFromUrl = async (nextId: string) => {
    try {
      const result = await analyzeImportUrl({ sourceUrl: importSourceUrl })

      if (result.error || !result.draft) {
        setCurrentUpload((current) =>
          current?.id === nextId
            ? {
                ...current,
                phase: 'error',
                errorMessage: result.error ?? '导入失败，请换一个链接试试'
              }
            : current
        )
        return
      }

      const nextDraft = result.draft

      setCurrentUpload((current) =>
        current?.id === nextId
          ? {
              ...current,
              previewUrl: nextDraft.imageUrl,
              phase: 'confirming',
              draft: nextDraft,
              errorMessage: null
            }
          : current
      )
    } catch {
      setCurrentUpload((current) =>
        current?.id === nextId
          ? {
              ...current,
              phase: 'error',
              errorMessage: '导入失败，请换一个链接试试'
            }
          : current
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleRetry = () => {
    if (!currentUpload || isAnalyzingRef.current || isSaving) {
      return
    }

    if (currentUpload.kind === 'remote') {
      const nextId = currentUpload.id
      setIsAnalyzing(true)
      setCurrentUpload((current) =>
        current
          ? {
              ...current,
              phase: 'analyzing',
              draft: null,
              errorMessage: null
            }
          : current
      )
      void runImportFromUrl(nextId)
      return
    }

    const nextRequestId = activeRequestIdRef.current + 1

    activeRequestIdRef.current = nextRequestId
    setCurrentUpload((current) =>
      current
        ? {
            ...current,
            phase: 'analyzing',
            draft: null,
            errorMessage: null
          }
        : current
    )
    void startUploadAndAnalyze(currentUpload, nextRequestId)
  }

  const handleImportFromUrl = async () => {
    if (isFlowActive || !importSourceUrl.trim()) {
      return
    }

    const nextId = `remote-${Date.now()}`
    setCompletedCount(0)
    setTotalCount(1)
    setPendingUploads([])
    setIsAnalyzing(true)
    setCurrentUpload({
      id: nextId,
      kind: 'remote',
      file: new File([], 'remote-import.jpg'),
      previewUrl: '',
      phase: 'analyzing',
      draft: null,
      errorMessage: null
    })
    await runImportFromUrl(nextId)
  }

  const handleSkipCurrent = () => {
    if (!currentUpload || isSaving) {
      return
    }

    revokePreviewUrl(currentUpload.previewUrl)
    queueNextUpload(pendingUploads, completedCount + 1, false)
  }

  const isFlowActive = currentUpload !== null
  const isMutating = isAnalyzing || isSaving

  const handleSave = async (nextDraft: ClosetAnalysisDraft) => {
    if (!currentUpload) {
      return
    }

    setIsSaving(true)
    setCurrentUpload((current) =>
      current
        ? {
            ...current,
            errorMessage: null
          }
        : current
    )

    try {
      await saveItem(nextDraft)
      hasSavedItemsRef.current = true
      revokePreviewUrl(currentUpload.previewUrl)
      queueNextUpload(pendingUploads, completedCount + 1, false)
    } catch {
      setCurrentUpload((current) =>
        current
          ? {
              ...current,
              errorMessage: '保存失败，请稍后再试'
            }
          : current
      )
    } finally {
      setIsSaving(false)
    }
  }

  const currentStep = currentUpload ? completedCount + 1 : 0

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">添加衣物</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">支持一次多选相册图片，或者直接贴商品链接 / 图片链接，系统会顺着同一条识别链路帮你确认后入橱。</p>
          </div>
          <label
            className={`inline-flex rounded-md border border-[var(--color-neutral-mid)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] ${
              isFlowActive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            {isAnalyzing ? '分析中' : '选择图片'}
            <input
              aria-label="选择衣物图片"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={handleFileChange}
              disabled={isFlowActive}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-neutral-mid)] p-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>商品链接或图片链接</span>
            <input
              aria-label="衣物商品链接或图片链接"
              value={importSourceUrl}
              onChange={(event) => setImportSourceUrl(event.target.value)}
              placeholder="https://..."
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
              disabled={isFlowActive}
            />
          </label>
          <div className="flex justify-end">
            <SecondaryButton type="button" onClick={() => void handleImportFromUrl()} disabled={isFlowActive || !importSourceUrl.trim()}>
              通过链接导入
            </SecondaryButton>
          </div>
        </div>

        <ClosetCollageSplitter disabled={isFlowActive} onSplitComplete={enqueueLocalFiles} />

        {currentUpload ? (
          <div className="rounded-lg bg-[var(--color-secondary)] p-3 text-sm text-[var(--color-neutral-dark)]">
            当前正在处理第 {currentStep} / {totalCount} 张
            {pendingUploads.length > 0 ? `，后面还有 ${pendingUploads.length} 张排队` : '，这是这一轮的最后一张'}
          </div>
        ) : null}

        {currentUpload?.previewUrl ? <img src={currentUpload.previewUrl} alt="本地预览" className="aspect-square w-full rounded-lg object-cover" /> : null}

        {currentUpload?.phase === 'analyzing' ? <p className="text-sm">AI 正在分析图片</p> : null}

        {currentUpload?.phase === 'confirming' && currentUpload.draft ? (
          <ClosetUploadForm initialDraft={currentUpload.draft} disabled={isSaving} onSubmit={handleSave} />
        ) : null}

        {currentUpload?.phase === 'error' && currentUpload.errorMessage ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-600">{currentUpload.errorMessage}</p>
            <SecondaryButton type="button" onClick={handleRetry} disabled={isMutating}>
              重试分析
            </SecondaryButton>
            <SecondaryButton type="button" onClick={handleSkipCurrent} disabled={isMutating}>
              跳过这张
            </SecondaryButton>
          </div>
        ) : null}

        {currentUpload?.phase === 'confirming' ? (
          <div className="flex justify-end">
            <SecondaryButton type="button" onClick={handleSkipCurrent} disabled={isMutating}>
              跳过这张
            </SecondaryButton>
          </div>
        ) : null}

        {currentUpload?.phase !== 'error' && currentUpload?.errorMessage ? <p className="text-sm text-red-600">{currentUpload.errorMessage}</p> : null}
      </div>
    </Card>
  )
}
