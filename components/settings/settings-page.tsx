'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBanner } from '@/components/ui/status-banner'
import type { PreferenceSource } from '@/lib/recommendation/preference-types'

const sourceLabels: Record<PreferenceSource, string> = {
  default: '默认权重',
  questionnaire: '问卷校准',
  adaptive: '反馈学习中'
}

const sourceDescriptions: Record<PreferenceSource, string> = {
  default: '当前使用 App 默认推荐权重。',
  questionnaire: '当前使用风格问卷生成的初始推荐偏好。',
  adaptive: '当前使用风格问卷和评分反馈共同调整后的推荐偏好。'
}

type ConfirmAction = 'reset' | 'restart' | 'copy-demo' | 'clear-closet'

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '未知'
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function SettingsPage({
  source,
  updatedAt,
  resetPreferences,
  restartQuestionnaire,
  copyDemoCloset,
  clearCloset
}: {
  source: PreferenceSource
  updatedAt: string
  resetPreferences: () => Promise<{ error: string | null }>
  restartQuestionnaire: () => Promise<{ error: string | null }>
  copyDemoCloset: () => Promise<{ error: string | null; copiedCount: number }>
  clearCloset: () => Promise<{ error: string | null }>
}) {
  const [currentSource, setCurrentSource] = useState(source)
  const [isResetting, setIsResetting] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isCopyingDemo, setIsCopyingDemo] = useState(false)
  const [isClearingCloset, setIsClearingCloset] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isBusy = isResetting || isRestarting || isCopyingDemo || isClearingCloset

  async function handleReset() {
    setIsResetting(true)
    setConfirmAction(null)
    setMessage(null)
    setError(null)

    const result = await resetPreferences()
    setIsResetting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setCurrentSource('default')
    setMessage('推荐权重已重置为默认')
  }

  async function handleRestart() {
    setIsRestarting(true)
    setConfirmAction(null)
    setMessage(null)
    setError(null)

    const result = await restartQuestionnaire()
    setIsRestarting(false)

    if (result?.error) {
      setError(result.error)
    }
  }

  async function handleCopyDemo() {
    setIsCopyingDemo(true)
    setConfirmAction(null)
    setMessage(null)
    setError(null)

    const result = await copyDemoCloset()
    setIsCopyingDemo(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessage(`已复制 ${result.copiedCount} 件演示衣物`)
  }

  async function handleClearCloset() {
    setIsClearingCloset(true)
    setConfirmAction(null)
    setMessage(null)
    setError(null)

    const result = await clearCloset()
    setIsClearingCloset(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessage('衣橱已清空')
  }

  return (
    <div className="space-y-5">
      <section
        className="relative overflow-hidden rounded-[1.9rem] border border-black/12 p-5 text-white shadow-[0_24px_54px_rgba(21,21,18,0.18)]"
        style={{ background: 'linear-gradient(180deg, rgba(21,21,18,0.96) 0%, rgba(55,61,43,0.94) 100%)' }}
      >
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Recommendation engine</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em]">{sourceLabels[currentSource]}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/78">{sourceDescriptions[currentSource]}</p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-white/18 bg-white/12 px-3 py-1.5 text-xs font-semibold text-white">
              更新于 {formatUpdatedAt(updatedAt)}
            </span>
          </div>
        </div>
      </section>

      <Card>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-neutral-dark)]">Preferences</p>
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">推荐偏好</h2>
            <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">
              重置只恢复推荐权重，不会删除衣橱单品、OOTD 记录或历史评分事件。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border border-[var(--color-line)] bg-white/68 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-primary)]">重置推荐权重</p>
                <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">回到 App 默认参数，后续评分会从新的默认版本重新开始。</p>
              </div>
              <SecondaryButton
                type="button"
                className="mt-4 w-full"
                disabled={isBusy}
                onClick={() => setConfirmAction('reset')}
              >
                {isResetting ? '重置中' : '重置推荐权重'}
              </SecondaryButton>
            </div>

            <div className="rounded-[1.2rem] border border-[var(--color-line)] bg-white/68 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-primary)]">重新填写风格问卷</p>
                <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">进入问卷前会先重置为默认；如果中途退出，会保持默认状态。</p>
              </div>
              <PrimaryButton
                type="button"
                className="mt-4 w-full"
                disabled={isBusy}
                onClick={() => setConfirmAction('restart')}
              >
                {isRestarting ? '正在进入' : '重新填写风格问卷'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-neutral-dark)]">Demo closet</p>
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">演示衣橱</h2>
            <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">
              复制演示衣橱会把 demo 单品追加到当前账号；清空衣橱只删除当前账号的数据，不影响演示账号。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border border-[var(--color-line)] bg-white/68 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-primary)]">复制演示衣橱</p>
                <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">导入一套可用于 Today、Shop、Looks、Travel 的示例单品。</p>
              </div>
              <PrimaryButton
                type="button"
                className="mt-4 w-full"
                disabled={isBusy}
                onClick={() => setConfirmAction('copy-demo')}
              >
                {isCopyingDemo ? '复制中' : '复制演示衣橱'}
              </PrimaryButton>
            </div>

            <div className="rounded-[1.2rem] border border-red-200 bg-red-50/70 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-red-800">清空我的衣橱</p>
                <p className="text-sm leading-6 text-red-900/72">删除当前账号的衣物、今日穿搭、保存搭配和旅行方案。</p>
              </div>
              <SecondaryButton
                type="button"
                className="mt-4 w-full border-red-200 text-red-800 hover:bg-red-100"
                disabled={isBusy}
                onClick={() => setConfirmAction('clear-closet')}
              >
                {isClearingCloset ? '清空中' : '清空我的衣橱'}
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Card>

      {error ? <StatusBanner message={error} /> : null}
      {message ? <StatusBanner message={message} /> : null}

      <div className="flex justify-end">
        <Link
          href="/today"
          className="text-sm font-semibold text-[var(--color-primary)] underline decoration-[var(--color-line)] underline-offset-4"
        >
          返回 Today
        </Link>
      </div>

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/38 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setConfirmAction(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              confirmAction === 'reset'
                ? '确认重置推荐权重'
                : confirmAction === 'restart'
                  ? '确认重新填写风格问卷'
                  : confirmAction === 'copy-demo'
                    ? '确认复制演示衣橱'
                    : '确认清空衣橱'
            }
            className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-[0_24px_60px_rgba(21,21,18,0.22)]"
          >
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-neutral-dark)]">Confirm</p>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">
                {confirmAction === 'reset'
                  ? '确认重置推荐权重？'
                  : confirmAction === 'restart'
                    ? '确认重新填写风格问卷？'
                    : confirmAction === 'copy-demo'
                      ? '确认复制演示衣橱？'
                      : '确认清空衣橱？'}
              </h2>
              <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">
                {confirmAction === 'reset'
                  ? '这会把推荐引擎恢复到默认参数。衣橱、OOTD 记录和历史评分事件不会被删除。'
                  : confirmAction === 'restart'
                    ? '进入问卷前会先把推荐权重恢复到默认；如果中途退出，会保持默认状态。'
                    : confirmAction === 'copy-demo'
                      ? '这会把演示账号里的单品复制到当前账号，现有衣橱不会被删除。'
                      : '这会删除当前账号的衣物、今日穿搭、保存搭配和旅行方案。演示账号不会受到影响。'}
              </p>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <SecondaryButton type="button" onClick={() => setConfirmAction(null)} disabled={isBusy}>
                取消
              </SecondaryButton>
              <PrimaryButton
                type="button"
                disabled={isBusy}
                onClick={() => {
                  if (confirmAction === 'reset') {
                    void handleReset()
                    return
                  }

                  if (confirmAction === 'restart') {
                    void handleRestart()
                    return
                  }

                  if (confirmAction === 'copy-demo') {
                    void handleCopyDemo()
                    return
                  }

                  void handleClearCloset()
                }}
              >
                {confirmAction === 'reset'
                  ? '确认重置推荐权重'
                  : confirmAction === 'restart'
                    ? '确认重新填写'
                    : confirmAction === 'copy-demo'
                      ? '确认复制'
                      : '确认清空'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
