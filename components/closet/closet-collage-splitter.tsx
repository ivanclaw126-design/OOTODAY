'use client'

import { ChangeEvent, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { SecondaryButton } from '@/components/ui/button'
import {
  createDefaultCropBox,
  MAX_CROP_BOXES,
  MIN_CROP_BOXES,
  moveCropBox,
  resizeCropBox,
  splitCollageFile,
  type CropBox
} from '@/lib/closet/split-collage-client'

type DragMode = 'move' | 'resize'

type DragState = {
  boxId: string
  mode: DragMode
  startClientX: number
  startClientY: number
}

type ClosetCollageSplitterProps = {
  disabled?: boolean
  onSplitComplete: (files: File[]) => void
}

function toPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export function ClosetCollageSplitter({ disabled = false, onSplitComplete }: ClosetCollageSplitterProps) {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [cropBoxes, setCropBoxes] = useState<CropBox[]>([createDefaultCropBox(0), createDefaultCropBox(1)])
  const [activeBoxId, setActiveBoxId] = useState<string>(cropBoxes[0]?.id ?? '')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSplitting, setIsSplitting] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const activeBox = useMemo(() => cropBoxes.find((box) => box.id === activeBoxId) ?? cropBoxes[0] ?? null, [activeBoxId, cropBoxes])

  const replaceCropBox = (boxId: string, updater: (box: CropBox) => CropBox) => {
    setCropBoxes((current) => current.map((box) => (box.id === boxId ? updater(box) : box)))
  }

  const handleSourceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    event.target.value = ''

    if (!nextFile || disabled) {
      return
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    const nextPreviewUrl = URL.createObjectURL(nextFile)
    setSourceFile(nextFile)
    setPreviewUrl(nextPreviewUrl)
    setCropBoxes([createDefaultCropBox(0), createDefaultCropBox(1)])
    setActiveBoxId('crop-1')
    setErrorMessage(null)
  }

  const handleAddCropBox = () => {
    setCropBoxes((current) => {
      if (current.length >= MAX_CROP_BOXES) {
        return current
      }

      const nextBox = createDefaultCropBox(current.length)
      setActiveBoxId(nextBox.id)
      return [...current, nextBox]
    })
  }

  const handleRemoveCropBox = (boxId: string) => {
    setCropBoxes((current) => {
      if (current.length <= MIN_CROP_BOXES) {
        return current
      }

      const nextBoxes = current.filter((box) => box.id !== boxId)
      if (activeBoxId === boxId) {
        setActiveBoxId(nextBoxes[0]?.id ?? '')
      }
      return nextBoxes
    })
  }

  const beginDrag = (boxId: string, mode: DragMode, clientX: number, clientY: number) => {
    if (disabled || !containerRef.current) {
      return
    }

    setActiveBoxId(boxId)
    dragStateRef.current = {
      boxId,
      mode,
      startClientX: clientX,
      startClientY: clientY
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || !containerRef.current) {
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = (event.clientX - dragStateRef.current.startClientX) / rect.width
    const deltaY = (event.clientY - dragStateRef.current.startClientY) / rect.height
    const boxId = dragStateRef.current.boxId

    if (dragStateRef.current.mode === 'move') {
      replaceCropBox(boxId, (box) => moveCropBox(box, deltaX, deltaY))
    } else {
      replaceCropBox(boxId, (box) => resizeCropBox(box, deltaX, deltaY))
    }

    dragStateRef.current = {
      ...dragStateRef.current,
      startClientX: event.clientX,
      startClientY: event.clientY
    }
  }

  const endDrag = () => {
    dragStateRef.current = null
  }

  const handleSplit = async () => {
    if (!sourceFile || cropBoxes.length < MIN_CROP_BOXES || cropBoxes.length > MAX_CROP_BOXES || disabled) {
      return
    }

    setIsSplitting(true)
    setErrorMessage(null)

    try {
      const files = await splitCollageFile(sourceFile, cropBoxes)
      onSplitComplete(files)
      setSourceFile(null)
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl('')
      setCropBoxes([createDefaultCropBox(0), createDefaultCropBox(1)])
      setActiveBoxId('crop-1')
    } catch {
      setErrorMessage('拼图拆分失败，请调整裁剪框后重试')
    } finally {
      setIsSplitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-neutral-mid)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">拼图拆分导入</p>
          <p className="text-sm text-[var(--color-neutral-dark)]">适合一张图里放了多件单品的截图。先选 1 张拼图，再手动保留 2-4 个裁剪框，拆好的图片会自动进入现有导入队列。</p>
        </div>
        <label
          className={`inline-flex rounded-md border border-[var(--color-neutral-mid)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary)] ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {sourceFile ? '重新选择拼图' : '选择拼图'}
          <input
            aria-label="选择拼图图片"
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={handleSourceChange}
          />
        </label>
      </div>

      {previewUrl ? (
        <>
          <div
            ref={containerRef}
            className="relative aspect-square w-full overflow-hidden rounded-lg border border-[var(--color-neutral-mid)] bg-[var(--color-secondary)]"
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <img src={previewUrl} alt="拼图预览" className="h-full w-full object-contain" />

            {cropBoxes.map((box, index) => (
              <button
                key={box.id}
                type="button"
                aria-label={`裁剪框 ${index + 1}`}
                className={`absolute border-2 ${
                  box.id === activeBox?.id ? 'border-[var(--color-primary)]' : 'border-white'
                } bg-white/10 text-left text-xs text-white shadow-sm`}
                style={{
                  left: toPercent(box.x),
                  top: toPercent(box.y),
                  width: toPercent(box.width),
                  height: toPercent(box.height)
                }}
                onClick={() => setActiveBoxId(box.id)}
                onPointerDown={(event) => {
                  event.preventDefault()
                  beginDrag(box.id, 'move', event.clientX, event.clientY)
                }}
              >
                <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5">#{index + 1}</span>
                <span
                  className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize rounded-tl bg-[var(--color-primary)]"
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    beginDrag(box.id, 'resize', event.clientX, event.clientY)
                  }}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <SecondaryButton type="button" onClick={handleAddCropBox} disabled={disabled || cropBoxes.length >= MAX_CROP_BOXES}>
              新增裁剪框
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => activeBox && handleRemoveCropBox(activeBox.id)} disabled={disabled || cropBoxes.length <= MIN_CROP_BOXES || !activeBox}>
              删除当前裁剪框
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => void handleSplit()} disabled={disabled || isSplitting || cropBoxes.length < MIN_CROP_BOXES}>
              {isSplitting ? '拆分中' : `拆成 ${cropBoxes.length} 张并继续导入`}
            </SecondaryButton>
          </div>

          <div className="rounded-lg bg-[var(--color-secondary)] p-3 text-sm text-[var(--color-neutral-dark)]">
            已选 {cropBoxes.length} 个裁剪框，支持 2-4 个。拖动框体可移动，右下角手柄可调大小。
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--color-neutral-dark)]">还没选择拼图图片。建议先挑一张包含 2-4 件单品、边界比较清晰的拼图。</p>
      )}

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
    </div>
  )
}
