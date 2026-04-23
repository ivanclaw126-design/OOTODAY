'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DEFAULT_ACCOUNT_PASSWORD } from '@/lib/auth/password'

export function TodayAccountSecurityCard({
  email,
  passwordBootstrapped,
  passwordChangedAt,
  changePassword
}: {
  email: string | null
  passwordBootstrapped: boolean
  passwordChangedAt: string | null
  changePassword: (input: { password: string; confirmPassword: string }) => Promise<{ error: string | null }>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const result = await changePassword({ password, confirmPassword })

      if (result.error) {
        setErrorMessage(result.error)
        return
      }

      setSuccessMessage('密码已更新，之后可以直接用新密码登录。')
      setPassword('')
      setConfirmPassword('')
      setIsEditing(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(239,232,221,0.94)_100%)] sm:p-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Account</p>
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">邮箱密码登录</h2>
        <p className="text-sm text-[var(--color-neutral-dark)]">
          当前账号：{email ?? '未读取到邮箱'}。以后除了 magic link，也可以直接用邮箱和密码登录。
        </p>
      </div>

      <div className="mt-4 rounded-[1.4rem] bg-[var(--color-panel)] p-4 text-sm text-white/78">
        {passwordBootstrapped ? (
          passwordChangedAt ? (
            <p>这个账号已经改过密码了。你仍然可以随时再换一次。</p>
          ) : (
            <p>
              这个账号当前可用默认密码 <span className="font-medium text-[var(--color-accent)]">{DEFAULT_ACCOUNT_PASSWORD}</span> 登录，建议你尽快改掉。
            </p>
          )
        ) : (
          <p>这个账号暂时还没有启用密码登录。先继续用 magic link 进来一次，系统会自动补上默认密码。</p>
        )}
      </div>

      {isEditing ? (
        <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
          <label className="flex flex-col gap-1 text-sm">
            <span>新密码</span>
            <input
              aria-label="新密码"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>确认新密码</span>
            <input
              aria-label="确认新密码"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
              required
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中…' : '更新密码'}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                setIsEditing(false)
                setPassword('')
                setConfirmPassword('')
                setErrorMessage(null)
              }}
            >
              取消
            </SecondaryButton>
          </div>
        </form>
      ) : (
        <div className="mt-4">
          <SecondaryButton type="button" onClick={() => setIsEditing(true)}>
            {passwordChangedAt ? '重新修改密码' : '立即修改密码'}
          </SecondaryButton>
        </div>
      )}

      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? <p className="mt-3 text-sm text-[var(--color-accent)]">{successMessage}</p> : null}
    </Card>
  )
}
