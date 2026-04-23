'use client'

import { Card } from '@/components/ui/card'
import { themeOptions, useTheme } from '@/components/theme/theme-provider'

export function ThemeSettingsCard() {
  const { theme, setTheme } = useTheme()

  return (
    <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(239,232,221,0.96)_100%)] sm:p-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Theme</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">界面配色主题</h2>
            <p className="max-w-xl text-sm leading-6 text-[var(--color-neutral-dark)]">
              保持当前结构和视觉语言不变，只切换整个产品的色彩性格。每次切换都会记住你的选择。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/76 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            {themeOptions.find((option) => option.id === theme)?.label ?? themeOptions[0].label}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {themeOptions.map((option) => {
          const isActive = option.id === theme

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isActive}
              aria-label={`切换到 ${option.label}`}
              onClick={() => setTheme(option.id)}
              className={`group relative overflow-hidden rounded-[1.55rem] border p-3 text-left transition-all duration-500 ${
                isActive
                  ? 'border-[var(--color-primary)] shadow-[0_20px_44px_rgba(0,0,0,0.12)]'
                  : 'border-[var(--color-line)] bg-white/68 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-white/82'
              }`}
              style={isActive ? { background: 'color-mix(in srgb, var(--color-accent) 16%, white)' } : undefined}
            >
              <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                <div
                  className="relative overflow-hidden rounded-[1.25rem] border border-black/6 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                  style={{
                    background: `linear-gradient(180deg, ${option.swatches[1]} 0%, ${option.swatches[1]}dd 48%, ${option.swatches[3]} 100%)`
                  }}
                >
                  <div
                    className="absolute inset-x-4 top-4 h-14 rounded-[1rem]"
                    style={{
                      background: `linear-gradient(135deg, ${option.swatches[2]}55, transparent 62%)`
                    }}
                  />
                  <div
                    className="relative rounded-[1.1rem] px-3 py-3"
                    style={{
                      background: `linear-gradient(180deg, ${option.swatches[0]} 0%, ${option.swatches[0]}f2 100%)`
                    }}
                  >
                    <div className="mb-8 flex items-start justify-between gap-3">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: option.swatches[1] }}
                      >
                        {option.shortLabel} / {option.label}
                      </span>
                      <span
                        className="rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]"
                        style={{ backgroundColor: option.swatches[2], color: option.swatches[0] }}
                      >
                        Accent
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {option.swatches.map((swatch) => (
                        <span
                          key={swatch}
                          className="h-7 rounded-[0.8rem] border border-white/12"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[var(--color-primary)] px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                      {option.shortLabel}
                    </span>
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--color-primary)]">{option.label}</h3>
                    <span className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">
                      {option.accentLabel}
                    </span>
                  </div>

                  <p className="max-w-xl text-sm leading-6 text-[var(--color-neutral-dark)]">{option.description}</p>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-2">
                      {option.swatches.map((swatch) => (
                        <span
                          key={`${option.id}-${swatch}`}
                          className="h-4 w-4 rounded-full border border-black/8"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${
                        isActive
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'border border-[var(--color-line)] text-[var(--color-neutral-dark)] group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)]'
                      }`}
                    >
                      {isActive ? 'Current theme' : 'Tap to apply'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
