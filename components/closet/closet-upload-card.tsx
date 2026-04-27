'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FeedbackLink } from '@/components/beta/feedback-link'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'
import { SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
import { sendBetaEventFromClient, sendBetaIssueFromClient } from '@/lib/beta/telemetry'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

const ClosetCollageSplitter = dynamic(
  () => import('@/components/closet/closet-collage-splitter').then((module) => module.ClosetCollageSplitter),
  {
    loading: () => <div className="rounded-lg border border-[var(--color-neutral-mid)] p-3 text-sm text-[var(--color-neutral-dark)]">正在加载拼图拆分工具…</div>
  }
)

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
        void sendBetaIssueFromClient({
          code: 'closet_upload_failed',
          surface: 'closet_upload_card',
          recoverable: true,
          context: {
            kind: uploadItem.kind
          }
        })

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

      void sendBetaIssueFromClient({
        code: uploadItem.kind === 'remote' ? 'closet_import_ai_failed' : 'closet_analyze_failed',
        surface: 'closet_upload_card',
        recoverable: true,
        context: {
          kind: uploadItem.kind
        }
      })

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

    void sendBetaEventFromClient({
      event: 'closet_import_started',
      surface: 'closet_upload_local',
      metadata: {
        fileCount: files.length
      }
    })

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

    void sendBetaEventFromClient({
      event: 'closet_import_started',
      surface: 'closet_upload_url'
    })

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
      void sendBetaEventFromClient({
        event: 'closet_item_saved',
        surface: 'closet_upload_card',
        metadata: {
          category: nextDraft.category
        }
      })
      hasSavedItemsRef.current = true
      revokePreviewUrl(currentUpload.previewUrl)
      queueNextUpload(pendingUploads, completedCount + 1, false)
    } catch {
      void sendBetaIssueFromClient({
        code: 'closet_item_save_failed',
        surface: 'closet_upload_card',
        recoverable: true
      })
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
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--color-primary)]">导入入口</p>
            <p className="text-base font-medium text-[var(--color-neutral-dark)]">添加衣物</p>
            <p className="max-w-2xl text-sm text-[var(--color-neutral-dark)]">
              支持一次多选相册图片，或者直接贴商品链接 / 图片链接，系统会顺着同一条识别链路帮你确认后入橱。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--color-neutral-dark)]">
            <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">相册多选</span>
            <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">商品链接</span>
            <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1">拼图拆分</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div className="min-w-0 flex flex-col gap-4">
            <div className="rounded-[1.25rem] border border-black/7 bg-[var(--color-secondary)]/45 p-4">
              <div className="mb-3 flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-[var(--color-neutral-dark)]">相册 / 拍照</p>
                  <p className="text-sm text-[var(--color-neutral-dark)]">一次多选后会自动排队逐张分析，方便把整批衣物顺着同一条流程入橱。</p>
                </div>
                <label
                  className={`inline-flex shrink-0 rounded-md border border-[var(--color-neutral-mid)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] ${
                    isFlowActive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  {isAnalyzing ? '分析中' : '选择图片'}
                  <input
                    aria-label="选择衣物图片"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={isFlowActive}
                  />
                </label>
              </div>
              <p className="text-sm text-[var(--color-neutral-dark)]">也可以直接从手机相册连选多张，完成后会自动进入确认区。</p>
            </div>

            <div className="rounded-[1.25rem] border border-black/7 bg-white p-4 shadow-[0_12px_28px_rgba(26,26,26,0.05)]">
              <div className="mb-3 space-y-1">
                <p className="text-sm font-medium text-[var(--color-neutral-dark)]">商品链接或图片链接</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">贴商品页或图片直链都可以，系统会复用同一条识别链路帮你确认后入橱。</p>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span>链接地址</span>
                <input
                  aria-label="衣物商品链接或图片链接"
                  value={importSourceUrl}
                  onChange={(event) => setImportSourceUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full min-w-0 rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
                  disabled={isFlowActive}
                />
              </label>
              <div className="mt-3 flex justify-end">
                <SecondaryButton
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => void handleImportFromUrl()}
                  disabled={isFlowActive || !importSourceUrl.trim()}
                >
                  通过链接导入
                </SecondaryButton>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-black/7 bg-[var(--color-secondary)]/35 p-4">
              <div className="mb-3 space-y-1">
                <p className="text-sm font-medium text-[var(--color-neutral-dark)]">拼图拆分</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">先手动框出 2-4 个单品，再拆成多张图片继续排队处理。</p>
              </div>
              <ClosetCollageSplitter disabled={isFlowActive} onSplitComplete={enqueueLocalFiles} />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-[var(--color-line)] bg-white/70 px-3 py-3 text-sm text-[var(--color-neutral-dark)]">
              <p>导入、识别或保存失败时，直接发反馈会更快定位。</p>
              <FeedbackLink
                surface="closet_upload"
                label="反馈导入问题"
                className="inline-flex shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
              />
            </div>
          </div>

          <div className="min-w-0 flex flex-col gap-3 rounded-[1.25rem] border border-black/7 bg-white/95 p-4 shadow-[0_12px_30px_rgba(26,26,26,0.06)]">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-[var(--color-neutral-dark)]">处理面板</p>
                <p className="text-sm text-[var(--color-neutral-dark)]">分析、确认、报错和跳过都在这里完成。</p>
              </div>
              {currentUpload ? (
                <div className="shrink-0 rounded-full bg-[var(--color-secondary)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-dark)]">
                  第 {currentStep} / {totalCount} 张
                </div>
              ) : (
                <div className="shrink-0 rounded-full bg-[var(--color-secondary)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-dark)]">
                  等待导入
                </div>
              )}
            </div>

            {currentUpload ? (
              <div className="rounded-[1rem] bg-[var(--color-secondary)] p-3 text-sm text-[var(--color-neutral-dark)]">
                当前正在处理第 {currentStep} / {totalCount} 张
                {pendingUploads.length > 0 ? `，后面还有 ${pendingUploads.length} 张排队` : '，这是这一轮的最后一张'}
              </div>
            ) : (
              <div className="rounded-[1rem] border border-dashed border-[var(--color-neutral-mid)] p-4 text-sm text-[var(--color-neutral-dark)]">
                选一张图片、贴一个链接，或者先从拼图里拆出单品，这里会接住后续确认。
              </div>
            )}

            {currentUpload?.phase === 'analyzing' && currentUpload.previewUrl ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-[1rem]">
                <Image
                  src={currentUpload.previewUrl}
                  alt="本地预览"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 420px"
                />
              </div>
            ) : null}

            {currentUpload?.phase === 'analyzing' ? <p className="text-sm text-[var(--color-neutral-dark)]">AI 正在分析图片</p> : null}

            {currentUpload?.phase === 'confirming' && currentUpload.draft ? (
              <ClosetUploadForm initialDraft={currentUpload.draft} disabled={isSaving} onSubmit={handleSave} />
            ) : null}

            {currentUpload?.phase === 'error' && currentUpload.errorMessage ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-red-600">{currentUpload.errorMessage}</p>
                <div className="flex flex-wrap gap-2">
                  <SecondaryButton type="button" onClick={handleRetry} disabled={isMutating}>
                    重试分析
                  </SecondaryButton>
                  <SecondaryButton type="button" onClick={handleSkipCurrent} disabled={isMutating}>
                    跳过这张
                  </SecondaryButton>
                </div>
              </div>
            ) : null}

            {currentUpload?.phase === 'confirming' ? (
              <div className="flex justify-end">
                <SecondaryButton type="button" className="w-full sm:w-auto" onClick={handleSkipCurrent} disabled={isMutating}>
                  跳过这张
                </SecondaryButton>
              </div>
            ) : null}

            {currentUpload?.phase !== 'error' && currentUpload?.errorMessage ? <p className="text-sm text-red-600">{currentUpload.errorMessage}</p> : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
