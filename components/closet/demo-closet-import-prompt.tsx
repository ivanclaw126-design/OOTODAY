'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import type { DemoClosetAudience } from '@/lib/demo/demo-closet'

const demoClosetOptions: Array<{
  audience: DemoClosetAudience
  title: string
  countLabel: string
  description: string
  imageUrl: string
}> = [
  {
    audience: 'womens',
    title: '女装演示衣橱',
    countLabel: '48 件',
    description: '通勤、约会、旅行和灵感复刻都有完整覆盖。',
    imageUrl: '/demo-closets/studio-womens.png'
  },
  {
    audience: 'mens',
    title: '男装演示衣橱',
    countLabel: '46 件',
    description: '商务休闲、周末、轻户外和差旅场景更稳定。',
    imageUrl: '/demo-closets/studio-mens.png'
  }
]

export function DemoClosetImportPrompt({
  copyDemoCloset
}: {
  copyDemoCloset: (audience: DemoClosetAudience) => Promise<{ error: string | null; copiedCount: number }>
}) {
  const router = useRouter()
  const [isHidden, setIsHidden] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (isHidden) {
    return null
  }

  async function handleCopy(audience: DemoClosetAudience) {
    setIsCopying(true)
    setMessage(null)
    setError(null)

    const result = await copyDemoCloset(audience)
    setIsCopying(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setIsPickerOpen(false)
    setMessage(`已导入 ${result.copiedCount} 件${audience === 'mens' ? '男装' : '女装'}演示衣物`)
    router.refresh()
  }

  return (
    <div className="rounded-[1.2rem] border border-black/10 bg-[#f6f0e7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--color-primary)]">想先快速体验？</p>
          <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">
            可以先导入一套演示衣橱跑通 Today、Shop、Looks 和 Travel。体验后可在顶部「AI 造型引擎」中清空本地衣橱。
          </p>
        </div>
        <button
          type="button"
          aria-label="关闭演示衣橱提示"
          className="shrink-0 rounded-full border border-black/10 px-2.5 py-1 text-sm font-semibold text-[var(--color-neutral-dark)] hover:bg-white"
          onClick={() => setIsHidden(true)}
        >
          关闭
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <PrimaryButton type="button" disabled={isCopying} onClick={() => setIsPickerOpen(true)}>
          导入演示衣橱
        </PrimaryButton>
        {message ? <p className="text-sm font-medium text-[var(--color-primary)]">{message}</p> : null}
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      </div>

      {isPickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/38 p-3 sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={() => setIsPickerOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="选择演示衣橱"
            className="relative z-10 max-h-[calc(100svh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[1.25rem] border border-black/10 bg-white p-4 shadow-[0_24px_60px_rgba(21,21,18,0.22)] sm:rounded-[1.5rem] sm:p-5"
          >
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-neutral-dark)]">Demo closet</p>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">选择一套演示衣橱</h2>
              <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">演示单品会追加到当前账号，现有衣橱不会被删除。</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
              {demoClosetOptions.map((option) => (
                <button
                  key={option.audience}
                  type="button"
                  disabled={isCopying}
                  onClick={() => void handleCopy(option.audience)}
                  className="group overflow-hidden rounded-[1rem] border border-[var(--color-line)] bg-white text-left transition duration-200 hover:-translate-y-0.5 hover:border-black/24 hover:shadow-[0_18px_38px_rgba(21,21,18,0.13)] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-[1.2rem]"
                >
                  <span
                    role="img"
                    aria-label={`${option.title}影棚示意图`}
                    className="block aspect-[4/3] bg-cover bg-[center_18%]"
                    style={{ backgroundImage: `url(${option.imageUrl})` }}
                  />
                  <span className="block p-3 sm:p-4">
                    <span className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="text-sm font-semibold tracking-[-0.03em] text-[var(--color-primary)] sm:text-base">{option.title}</span>
                      <span className="w-fit rounded-full border border-black/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-neutral-dark)] sm:px-2.5 sm:py-1 sm:text-xs">{option.countLabel}</span>
                    </span>
                    <span className="mt-2 hidden text-sm leading-6 text-[var(--color-neutral-dark)] sm:block">{option.description}</span>
                    <span className="mt-3 inline-flex text-sm font-semibold text-[var(--color-primary)] sm:mt-4">
                      {isCopying ? '导入中' : `导入${option.audience === 'mens' ? '男装' : '女装'}衣橱`}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end sm:mt-5">
              <SecondaryButton type="button" disabled={isCopying} onClick={() => setIsPickerOpen(false)}>
                取消
              </SecondaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
