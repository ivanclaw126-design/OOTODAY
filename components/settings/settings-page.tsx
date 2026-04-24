'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBanner } from '@/components/ui/status-banner'
import type { PreferenceSource } from '@/lib/recommendation/preference-types'

const sourceLabels: Record<PreferenceSource, string> = {
  default: 'default',
  questionnaire: 'questionnaire',
  adaptive: 'adaptive'
}

const sourceDescriptions: Record<PreferenceSource, string> = {
  default: '当前使用 App 默认推荐权重。',
  questionnaire: '当前使用风格问卷生成的初始推荐偏好。',
  adaptive: '当前使用风格问卷和评分反馈共同调整后的推荐偏好。'
}

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
  restartQuestionnaire
}: {
  source: PreferenceSource
  updatedAt: string
  resetPreferences: () => Promise<{ error: string | null }>
  restartQuestionnaire: () => Promise<{ error: string | null }>
}) {
  const [currentSource, setCurrentSource] = useState(source)
  const [isResetting, setIsResetting] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReset() {
    setIsResetting(true)
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
    setMessage(null)
    setError(null)

    const result = await restartQuestionnaire()
    setIsRestarting(false)

    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="bg-[linear-gradient(180deg,rgba(21,21,18,0.94)_0%,rgba(55,61,43,0.92)_100%)] text-white">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">Recommendation mode</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em]">{sourceLabels[currentSource]}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/72">{sourceDescriptions[currentSource]}</p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/78">
              更新于 {formatUpdatedAt(updatedAt)}
            </span>
          </div>
        </div>
      </Card>

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
                disabled={isResetting || isRestarting}
                onClick={handleReset}
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
                disabled={isResetting || isRestarting}
                onClick={handleRestart}
              >
                {isRestarting ? '正在进入' : '重新填写风格问卷'}
              </PrimaryButton>
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
    </div>
  )
}
