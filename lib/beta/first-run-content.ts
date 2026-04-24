export type FirstRunStep = {
  id: string
  step: string
  label: string
  detail: string
}

export const firstRunSteps: FirstRunStep[] = [
  {
    id: 'import',
    step: '01',
    label: '导入 3-5 件常穿衣服',
    detail: '先用最常穿、最能代表你的单品把衣橱起起来。'
  },
  {
    id: 'today',
    step: '02',
    label: '去 Today 看推荐',
    detail: '先确认推荐能不能帮你快速做决定，再继续扩衣橱。'
  },
  {
    id: 'feedback',
    step: '03',
    label: '记录一次反馈',
    detail: '给满意度或留言，后面的推荐才会更像你。'
  }
]

const defaultFeedbackHref = 'mailto:ivanclaw@163.com?subject=OOTODAY%20beta%20feedback'

export function getBetaFeedbackHref(surface?: string) {
  const configured = process.env.NEXT_PUBLIC_BETA_FEEDBACK_URL?.trim()

  if (!configured) {
    if (!surface) {
      return defaultFeedbackHref
    }

    return `${defaultFeedbackHref}&body=${encodeURIComponent(`页面：${surface}\n问题或建议：`)}`.trim()
  }

  try {
    const url = new URL(configured)

    if (surface) {
      url.searchParams.set('surface', surface)
    }

    return url.toString()
  } catch {
    return configured
  }
}
