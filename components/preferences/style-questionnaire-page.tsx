'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBanner } from '@/components/ui/status-banner'
import { VisualChoiceCard } from '@/components/preferences/visual-choice-card'
import {
  COLOR_PALETTE_OPTIONS,
  EXPLORATION_OPTIONS,
  FOCAL_POINT_OPTIONS,
  HARD_AVOID_OPTIONS,
  LAYERING_OPTIONS,
  PRACTICALITY_OPTIONS,
  SCENE_OPTIONS,
  SILHOUETTE_OPTIONS,
  SLOT_OPTIONS
} from '@/lib/recommendation/questionnaire-config'
import type {
  ColorPalettePreference,
  PreferenceProfile,
  QuestionnaireExploration,
  QuestionnaireLayeringComplexity,
  QuestionnairePracticality,
  SilhouettePreference,
  StyleQuestionnaireAnswers
} from '@/lib/recommendation/preference-types'

function SwatchStack({ colors }: { colors: string[] }) {
  return (
    <div className="flex h-14 w-full items-center justify-center gap-1.5">
      {colors.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="h-11 w-7 rounded-full border border-white/70 shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function OutfitGlyph({ variant }: { variant: string }) {
  const isRelaxed = variant === 'relaxedAll'
  const isOnePiece = variant === 'onePiece'

  return (
    <div className="flex h-16 items-end justify-center gap-1.5">
      <span className="h-4 w-5 rounded-full bg-[var(--color-primary)]" />
      {isOnePiece ? (
        <span className="h-12 w-8 rounded-t-[1.2rem] rounded-b-sm bg-[var(--color-accent)]" />
      ) : (
        <>
          <span className={`${isRelaxed ? 'w-10' : 'w-7'} h-8 rounded-t-[1rem] bg-[var(--color-secondary)]`} />
          <span className={`${variant === 'fittedTopWideBottom' ? 'w-10' : 'w-7'} h-10 rounded-b-[1rem] bg-[var(--color-primary)]`} />
        </>
      )}
    </div>
  )
}

function LayerGlyph({ count }: { count: number }) {
  return (
    <div className="relative h-16 w-20">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="absolute bottom-2 h-11 w-8 rounded-[0.8rem] border border-white/70 shadow-[0_8px_16px_rgba(0,0,0,0.1)]"
          style={{
            left: `${18 + index * 10}px`,
            backgroundColor: ['#f2efe8', '#d9c8a8', '#3f4a3c', '#151512'][index] ?? '#f2efe8'
          }}
        />
      ))}
    </div>
  )
}

function FocusGlyph({ value }: { value: PreferenceProfile['focalPointPreference'] }) {
  const positions = {
    upperBody: 'top-2 left-1/2 -translate-x-1/2',
    waist: 'top-8 left-1/2 -translate-x-1/2',
    shoes: 'bottom-1 left-1/2 -translate-x-1/2',
    bagAccessory: 'top-7 right-3',
    subtle: 'top-6 left-1/2 -translate-x-1/2 opacity-45'
  }

  return (
    <div className="relative h-16 w-16">
      <span className="absolute left-1/2 top-1 h-3 w-4 -translate-x-1/2 rounded-full bg-[var(--color-primary)]" />
      <span className="absolute left-1/2 top-5 h-9 w-7 -translate-x-1/2 rounded-[0.9rem] bg-[var(--color-secondary)]" />
      <span className={`absolute h-4 w-4 rounded-full bg-[var(--color-accent)] shadow-[0_0_0_4px_rgba(231,255,55,0.24)] ${positions[value]}`} />
    </div>
  )
}

function SceneGlyph({ index }: { index: number }) {
  const palette = ['#151512', '#e7ff37', '#d9c8a8', '#6b7a5d', '#9fb7d4']
  return (
    <div className="grid h-14 w-20 grid-cols-3 gap-1">
      {Array.from({ length: 6 }, (_, cell) => (
        <span
          key={cell}
          className="rounded-[0.45rem] border border-white/60"
          style={{ backgroundColor: palette[(cell + index) % palette.length] }}
        />
      ))}
    </div>
  )
}

function SlotGlyph({ value }: { value: keyof PreferenceProfile['slotPreference'] }) {
  const glyphs = {
    outerwear: ['h-12 w-9 rounded-t-[1.2rem]', 'h-8 w-6 rounded-[0.8rem]'],
    shoes: ['h-4 w-8 rounded-full', 'h-4 w-8 rounded-full'],
    bag: ['h-9 w-10 rounded-[0.8rem]', 'h-4 w-6 rounded-t-full'],
    accessories: ['h-8 w-8 rounded-full', 'h-3 w-14 rounded-full']
  }

  return (
    <div className="flex h-14 items-center justify-center gap-2">
      {glyphs[value].map((shape, index) => (
        <span
          key={index}
          className={`${shape} border border-white/70 bg-[var(--color-primary)] shadow-[0_8px_16px_rgba(0,0,0,0.12)]`}
        />
      ))}
    </div>
  )
}

function Section({
  eyebrow,
  title,
  selectionRule,
  children
}: {
  eyebrow: string
  title: string
  selectionRule: string
  children: ReactNode
}) {
  return (
    <Card>
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-neutral-dark)]">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--color-primary)]">{title}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-neutral-dark)]">{selectionRule}</p>
        </div>
        {children}
      </div>
    </Card>
  )
}

function toggleListValue<TValue extends string>(values: TValue[], value: TValue, max?: number) {
  if (values.includes(value)) {
    return values.filter((item) => item !== value)
  }

  const next = [...values, value]
  return max ? next.slice(-max) : next
}

const colorVisuals: Record<ColorPalettePreference, string[]> = {
  neutral: ['#151512', '#f2efe8', '#9d988d'],
  tonal: ['#f4efe6', '#d9c8a8', '#8f7656'],
  softColor: ['#d8bfd6', '#b7c9b1', '#d7c8a6'],
  oneAccent: ['#151512', '#f2efe8', '#e7ff37'],
  boldContrast: ['#151512', '#e7ff37', '#3f61ff']
}

const layerCounts: Record<QuestionnaireLayeringComplexity, number> = {
  simple: 1,
  lightLayer: 2,
  threeLayer: 3,
  textureMix: 4
}

const practicalityVisuals: Record<QuestionnairePracticality, string[]> = {
  comfort: ['#f2efe8', '#d9c8a8'],
  balanced: ['#151512', '#d9c8a8'],
  style: ['#151512', '#e7ff37'],
  weekdayComfortWeekendStyle: ['#d9c8a8', '#151512', '#e7ff37']
}

const explorationVisuals: Record<QuestionnaireExploration, string[]> = {
  stable: ['#151512', '#f2efe8'],
  slight: ['#151512', '#d9c8a8', '#b7c9b1'],
  inspiration: ['#151512', '#d9c8a8', '#e7ff37'],
  bold: ['#151512', '#e7ff37', '#3f61ff', '#d64b4b']
}

export function StyleQuestionnairePage({
  submitAnswers
}: {
  submitAnswers: (answers: StyleQuestionnaireAnswers) => Promise<{ error: string | null }>
}) {
  const [scenes, setScenes] = useState<StyleQuestionnaireAnswers['scenes']>(['casual'])
  const [silhouettes, setSilhouettes] = useState<SilhouettePreference[]>([])
  const [colorPalette, setColorPalette] = useState<ColorPalettePreference>('oneAccent')
  const [layeringComplexity, setLayeringComplexity] = useState<QuestionnaireLayeringComplexity>('lightLayer')
  const [focalPoint, setFocalPoint] = useState<PreferenceProfile['focalPointPreference']>('subtle')
  const [practicality, setPracticality] = useState<QuestionnairePracticality>('balanced')
  const [slots, setSlots] = useState<PreferenceProfile['slotPreference']>({
    outerwear: true,
    shoes: true,
    bag: true,
    accessories: false
  })
  const [exploration, setExploration] = useState<QuestionnaireExploration>('slight')
  const [hardAvoids, setHardAvoids] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canSubmit = scenes.length > 0 && !isSubmitting

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)
    setSaved(false)

    const result = await submitAnswers({
      scenes,
      silhouettes,
      colorPalette,
      layeringComplexity,
      focalPoint,
      practicality,
      slots,
      exploration,
      hardAvoids
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSaved(true)
  }

  return (
    <div className="space-y-5">
      <section
        className="relative overflow-hidden rounded-[1.9rem] border border-black/12 p-5 text-white shadow-[0_24px_54px_rgba(21,21,18,0.18)]"
        style={{ background: 'linear-gradient(180deg, rgba(21,21,18,0.96) 0%, rgba(55,61,43,0.94) 100%)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Style profile</p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em]">让推荐先认识你的穿法</h2>
            <p className="max-w-2xl text-sm leading-6 text-white/82">从日常场景、轮廓、颜色和避雷项开始，先建立一版稳定的个人风格底色。</p>
          </div>
          <Link
            href="/today"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/18 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] shadow-[0_12px_28px_rgba(0,0,0,0.16)] hover:bg-[var(--color-accent)]"
          >
            回 Today
          </Link>
        </div>
      </section>

      <Section eyebrow="01 / Scene" title="你最常需要穿搭服务的场景是什么？" selectionRule="至少选择 1 个，最多选择 2 个。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SCENE_OPTIONS.map((option, index) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={scenes.includes(option.value)}
              onClick={() => setScenes(toggleListValue(scenes, option.value, 2))}
              visual={<SceneGlyph index={index} />}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="02 / Silhouette" title="你更喜欢哪种全身轮廓？" selectionRule="可多选，选择 0-5 个都可以。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SILHOUETTE_OPTIONS.map((option) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={silhouettes.includes(option.value)}
              onClick={() => setSilhouettes(toggleListValue(silhouettes, option.value))}
              visual={<OutfitGlyph variant={option.value} />}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="03 / Color" title="你更喜欢哪种配色？" selectionRule="单选，只能选择 1 个。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_PALETTE_OPTIONS.map((option) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={colorPalette === option.value}
              onClick={() => setColorPalette(option.value)}
              visual={<SwatchStack colors={colorVisuals[option.value]} />}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="04 / Layering" title="你能接受多复杂的叠穿？" selectionRule="单选，只能选择 1 个。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LAYERING_OPTIONS.map((option) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={layeringComplexity === option.value}
              onClick={() => setLayeringComplexity(option.value)}
              visual={<LayerGlyph count={layerCounts[option.value]} />}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="05 / Focus" title="你希望一套穿搭的视觉中心通常在哪里？" selectionRule="单选，只能选择 1 个。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FOCAL_POINT_OPTIONS.map((option) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={focalPoint === option.value}
              onClick={() => setFocalPoint(option.value)}
              visual={<FocusGlyph value={option.value} />}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="06 / Practicality" title="你更看重舒适实用，还是造型感？" selectionRule="单选，只能选择 1 个。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRACTICALITY_OPTIONS.map((option) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={practicality === option.value}
              onClick={() => setPracticality(option.value)}
              visual={<SwatchStack colors={practicalityVisuals[option.value]} />}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="07 / Slots" title="你希望推荐包含哪些单品层级？" selectionRule="可多选，选择 0-4 个都可以。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SLOT_OPTIONS.map((option) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={slots[option.value]}
              onClick={() => setSlots((current) => ({ ...current, [option.value]: !current[option.value] }))}
              visual={<SlotGlyph value={option.value} />}
              compact
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="08 / Explore" title="你愿意偶尔尝试和平时不同的风格吗？" selectionRule="单选，只能选择 1 个。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORATION_OPTIONS.map((option) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={exploration === option.value}
              onClick={() => setExploration(option.value)}
              visual={<SwatchStack colors={explorationVisuals[option.value]} />}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="09 / Avoid" title="明确不喜欢的元素" selectionRule={`可多选，选择 0-${HARD_AVOID_OPTIONS.length} 个都可以。`}>
        <div className="flex flex-wrap gap-2">
          {HARD_AVOID_OPTIONS.map((option) => {
            const selected = hardAvoids.includes(option)

            return (
              <SecondaryButton
                key={option}
                type="button"
                aria-pressed={selected}
                className={selected ? 'border-[var(--color-primary)] bg-[var(--color-accent)] text-[var(--color-primary)]' : ''}
                onClick={() => setHardAvoids(toggleListValue(hardAvoids, option))}
              >
                {option}
              </SecondaryButton>
            )
          })}
        </div>
      </Section>

      {error ? <StatusBanner message={error} /> : null}
      {saved ? (
        <section
          className="relative overflow-hidden rounded-[1.9rem] border border-black/10 p-5 text-white shadow-[0_24px_54px_rgba(21,21,18,0.18)]"
          style={{ background: 'linear-gradient(135deg, rgba(21,21,18,0.96) 0%, rgba(63,74,60,0.94) 100%)' }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Saved</p>
              <h2 className="text-xl font-semibold tracking-[-0.04em]">风格问卷已保存</h2>
              <p className="text-sm leading-6 text-white/82">回到 Today 后，推荐会按这版风格偏好重新排序。</p>
            </div>
            <Link
              href="/today"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] shadow-[0_12px_28px_rgba(0,0,0,0.14)] hover:bg-[var(--color-accent)]"
            >
              回 Today 看新推荐
            </Link>
          </div>
        </section>
      ) : null}

      <Card className="sticky bottom-24 z-10 bg-white/86 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-neutral-dark)]">已选择 {scenes.length} 个场景、{silhouettes.length} 个轮廓、{hardAvoids.length} 个避雷项。</p>
          <PrimaryButton type="button" disabled={!canSubmit} onClick={handleSubmit}>
            {isSubmitting ? '保存中' : '保存风格偏好'}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  )
}
