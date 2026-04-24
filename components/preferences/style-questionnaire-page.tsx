'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { PrimaryButton } from '@/components/ui/button'
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

const STYLE_QUESTIONNAIRE_IMAGE_BASE = '/style-questionnaire'

type HardAvoidOption = (typeof HARD_AVOID_OPTIONS)[number]

function imagePath(fileName: string) {
  return `${STYLE_QUESTIONNAIRE_IMAGE_BASE}/${fileName}`
}

function QuestionnaireOptionImage({ fileName, label }: { fileName: string; label: string }) {
  return (
    <span className="relative block h-full w-full">
      <Image
        src={imagePath(fileName)}
        alt={`${label} 示例`}
        fill
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
        className="object-contain"
      />
    </span>
  )
}

const sceneImages: Record<StyleQuestionnaireAnswers['scenes'][number], string> = {
  work: '01-01-scene-work.png',
  casual: '01-02-scene-casual.png',
  date: '01-03-scene-date.png',
  travel: '01-04-scene-travel.png',
  outdoor: '01-05-scene-outdoor.png'
}

const silhouetteImages: Record<SilhouettePreference, string> = {
  shortTopHighWaist: '02-01-silhouette-short-top-high-waist.png',
  looseTopSlimBottom: '02-02-silhouette-loose-top-slim-bottom.png',
  fittedTopWideBottom: '02-03-silhouette-fitted-top-wide-bottom.png',
  relaxedAll: '02-04-silhouette-relaxed-all.png',
  onePiece: '02-05-silhouette-one-piece.png'
}

const colorImages: Record<ColorPalettePreference, string> = {
  neutral: '03-01-color-neutral.png',
  tonal: '03-02-color-tonal.png',
  softColor: '03-03-color-soft.png',
  oneAccent: '03-04-color-one-accent.png',
  boldContrast: '03-05-color-bold-contrast.png'
}

const layeringImages: Record<QuestionnaireLayeringComplexity, string> = {
  simple: '04-01-layering-simple.png',
  lightLayer: '04-02-layering-light-layer.png',
  threeLayer: '04-03-layering-three-layer.png',
  textureMix: '04-04-layering-texture-mix.png'
}

const focalPointImages: Record<PreferenceProfile['focalPointPreference'], string> = {
  upperBody: '05-01-focal-upper-body.png',
  waist: '05-02-focal-waist.png',
  shoes: '05-03-focal-shoes.png',
  bagAccessory: '05-04-focal-bag-accessory.png',
  subtle: '05-05-focal-subtle.png'
}

const practicalityImages: Record<QuestionnairePracticality, string> = {
  comfort: '06-01-practicality-comfort.png',
  balanced: '06-02-practicality-balanced.png',
  style: '06-03-practicality-style.png',
  weekdayComfortWeekendStyle: '06-04-practicality-weekday-weekend.png'
}

const slotImages: Record<keyof PreferenceProfile['slotPreference'], string> = {
  outerwear: '07-01-slot-outerwear.png',
  shoes: '07-02-slot-shoes.png',
  bag: '07-03-slot-bag.png',
  accessories: '07-04-slot-accessories.png'
}

const explorationImages: Record<QuestionnaireExploration, string> = {
  stable: '08-01-exploration-stable.png',
  slight: '08-02-exploration-slight.png',
  inspiration: '08-03-exploration-inspiration.png',
  bold: '08-04-exploration-bold.png'
}

const hardAvoidImages: Record<HardAvoidOption, string> = {
  不喜欢紧身: '09-01-avoid-tight.png',
  不喜欢高跟鞋: '09-02-avoid-heels.png',
  不喜欢短裙: '09-03-avoid-short-skirt.png',
  不喜欢无袖: '09-04-avoid-sleeveless.png',
  不喜欢大面积亮色: '09-05-avoid-bright-color.png',
  不喜欢复杂叠穿: '09-06-avoid-complex-layering.png',
  不喜欢露腰: '10-01-avoid-crop-waist.png',
  '不喜欢大 logo': '10-02-avoid-logo.png',
  不喜欢帽子: '10-03-avoid-hat.png',
  不喜欢太正式: '10-04-avoid-formal.png',
  不喜欢太运动: '10-05-avoid-sporty.png'
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
          {SCENE_OPTIONS.map((option) => (
            <VisualChoiceCard
              key={option.value}
              title={option.label}
              description={option.description}
              selected={scenes.includes(option.value)}
              onClick={() => setScenes(toggleListValue(scenes, option.value, 2))}
              visual={<QuestionnaireOptionImage fileName={sceneImages[option.value]} label={option.label} />}
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
              visual={<QuestionnaireOptionImage fileName={silhouetteImages[option.value]} label={option.label} />}
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
              visual={<QuestionnaireOptionImage fileName={colorImages[option.value]} label={option.label} />}
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
              visual={<QuestionnaireOptionImage fileName={layeringImages[option.value]} label={option.label} />}
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
              visual={<QuestionnaireOptionImage fileName={focalPointImages[option.value]} label={option.label} />}
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
              visual={<QuestionnaireOptionImage fileName={practicalityImages[option.value]} label={option.label} />}
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
              visual={<QuestionnaireOptionImage fileName={slotImages[option.value]} label={option.label} />}
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
              visual={<QuestionnaireOptionImage fileName={explorationImages[option.value]} label={option.label} />}
            />
          ))}
        </div>
      </Section>

      <Section eyebrow="09 / Avoid" title="明确不喜欢的元素" selectionRule={`可多选，选择 0-${HARD_AVOID_OPTIONS.length} 个都可以。`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HARD_AVOID_OPTIONS.map((option) => {
            const selected = hardAvoids.includes(option)

            return (
              <VisualChoiceCard
                key={option}
                ariaLabel={option}
                title={option}
                description="选中后作为明确避雷项。"
                selected={selected}
                onClick={() => setHardAvoids(toggleListValue(hardAvoids, option))}
                visual={<QuestionnaireOptionImage fileName={hardAvoidImages[option]} label={option} />}
              />
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
