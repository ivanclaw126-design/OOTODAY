'use client'

import { useState } from 'react'
import { ThemeSettingsCard } from '@/components/theme/theme-settings-card'
import { TodayAccountSecurityCard } from '@/components/today/today-account-security-card'
import { PrimaryButton } from '@/components/ui/button'

export function TodaySettingsPanel({
  accountEmail,
  passwordBootstrapped,
  passwordChangedAt,
  changePassword,
  signOut
}: {
  accountEmail: string | null
  passwordBootstrapped: boolean
  passwordChangedAt: string | null
  changePassword: (input: { password: string; confirmPassword: string }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="pt-2">
      <PrimaryButton
        type="button"
        className="w-full bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent)]/90"
        onClick={() => setIsSettingsOpen(true)}
      >
        设置
      </PrimaryButton>

      {isSettingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={() => setIsSettingsOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Today 设置"
            className="relative z-10 w-full max-w-3xl"
          >
            <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-[1.75rem] border border-black/7 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,245,240,0.95)_100%)] p-4 shadow-[0_24px_60px_rgba(26,26,26,0.18)] sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-primary)]">Settings</p>
                  <h2 className="text-lg font-semibold text-[var(--color-neutral-dark)]">主题与账号设置</h2>
                </div>
                <PrimaryButton
                  type="button"
                  className="shrink-0 bg-[var(--color-accent)] px-3 py-2 text-[var(--color-primary)] hover:bg-[var(--color-accent)]/90"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  关闭
                </PrimaryButton>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2 pr-1">
                <ThemeSettingsCard />
                <TodayAccountSecurityCard
                  email={accountEmail}
                  passwordBootstrapped={passwordBootstrapped}
                  passwordChangedAt={passwordChangedAt}
                  changePassword={changePassword}
                  signOut={signOut}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
