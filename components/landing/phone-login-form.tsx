'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const COUNTRY_CODES = [
  { label: '中国 +86', value: '+86' },
  { label: '香港 +852', value: '+852' },
  { label: '澳门 +853', value: '+853' },
  { label: '台湾 +886', value: '+886' },
  { label: '美国 +1', value: '+1' },
  { label: '英国 +44', value: '+44' },
  { label: '日本 +81', value: '+81' },
  { label: '新加坡 +65', value: '+65' }
]

function normalizeNationalPhone(value: string) {
  return value.replace(/[^\d]/g, '')
}

function getPhoneErrorMessage(message: string | null | undefined) {
  const normalized = (message ?? '').toLowerCase()

  if (normalized.includes('rate limit') || normalized.includes('security purposes')) {
    return '验证码发送太频繁了，请等倒计时结束后再试。'
  }

  if (normalized.includes('invalid') || normalized.includes('phone')) {
    return '手机号或验证码不正确，请检查后再试。'
  }

  if (normalized.includes('expired')) {
    return '验证码已过期，请重新获取。'
  }

  return '手机号登录失败，请稍后再试。'
}

export function PhoneLoginForm() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [countryCode, setCountryCode] = useState('+86')
  const [nationalPhone, setNationalPhone] = useState('')
  const [sentPhone, setSentPhone] = useState('')
  const [token, setToken] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const normalizedNationalPhone = normalizeNationalPhone(nationalPhone)
  const phone = normalizedNationalPhone ? `${countryCode}${normalizedNationalPhone}` : ''
  const canSend = Boolean(phone) && countdown === 0 && !isPending
  const canVerify = token.length === 6 && Boolean(sentPhone) && !isPending

  useEffect(() => {
    if (countdown <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [countdown])

  function requestOtp() {
    if (!canSend) {
      return
    }

    startTransition(async () => {
      setError(null)
      setMessage(null)

      const { error: signInError } = await supabase.auth.signInWithOtp({ phone })

      if (signInError) {
        setError(getPhoneErrorMessage(signInError.message))
        return
      }

      setSentPhone(phone)
      setToken('')
      setCountdown(60)
      setMessage('验证码已发送，请查看短信。')
    })
  }

  function verifyOtp() {
    if (!canVerify) {
      return
    }

    startTransition(async () => {
      setError(null)
      setMessage(null)

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: sentPhone,
        token,
        type: 'sms'
      })

      if (verifyError) {
        setError(getPhoneErrorMessage(verifyError.message))
        return
      }

      const userId = data.user?.id

      if (!userId) {
        setError('验证码已通过，但没有拿到登录用户，请重新试一次。')
        return
      }

      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle()
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, phone: sentPhone, updated_at: new Date().toISOString() }, { onConflict: 'id' })

      if (profileError) {
        setError('登录成功，但用户资料写入失败，请刷新后再试。')
        return
      }

      router.replace(existingProfile ? '/today' : '/closet?onboarding=1')
      router.refresh()
    })
  }

  return (
    <div className="mt-5 rounded-[1.5rem] border border-[var(--color-line)] bg-white p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-primary)]">手机号验证码登录</p>
        <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">
          选择国家区号并输入手机号，收到 6 位短信验证码后即可登录。权限仍然只按当前登录用户的 `auth.uid()` 判断。
        </p>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-[8.5rem_1fr]">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
          <span>国家区号</span>
          <select
            aria-label="国家区号"
            className="min-h-12 w-full min-w-0 rounded-2xl border border-[var(--color-neutral-mid)] bg-white px-3 py-3 text-base outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
          >
            {COUNTRY_CODES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
          <span>手机号</span>
          <input
            aria-label="手机号"
            className="min-h-12 w-full min-w-0 rounded-2xl border border-[var(--color-neutral-mid)] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[var(--color-neutral-dark)]/50 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
            inputMode="tel"
            name="phone"
            placeholder="13800138000"
            type="tel"
            value={nationalPhone}
            onChange={(event) => setNationalPhone(event.target.value)}
          />
        </label>
      </div>

      <button
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[var(--color-neutral-mid)] bg-white px-5 py-3 text-base font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)] disabled:cursor-not-allowed disabled:opacity-55"
        type="button"
        disabled={!canSend}
        onClick={requestOtp}
      >
        {isPending ? '处理中...' : countdown > 0 ? `${countdown} 秒后可重发` : '发送短信验证码'}
      </button>

      {sentPhone ? (
        <div className="mt-4 flex min-w-0 flex-col gap-3">
          <label className="flex min-w-0 w-full flex-col gap-2 text-sm font-medium">
            <span>6 位验证码</span>
            <input
              aria-label="6 位验证码"
              autoComplete="one-time-code"
              className="min-h-12 w-full min-w-0 rounded-2xl border border-[var(--color-neutral-mid)] bg-white px-4 py-3 text-base tracking-[0.2em] outline-none transition placeholder:tracking-normal placeholder:text-[var(--color-neutral-dark)]/50 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            />
          </label>
          <button
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-medium text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-55"
            type="button"
            disabled={!canVerify}
            onClick={verifyOtp}
          >
            {isPending ? '验证中...' : '验证并登录'}
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 px-4 py-3 text-sm text-[var(--color-primary)]">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  )
}
