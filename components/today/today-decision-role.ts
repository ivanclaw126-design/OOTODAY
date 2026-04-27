import type { TodayRecommendation, TodayScene } from '@/lib/today/types'

const defaultRoles = [
  { label: '最稳妥方案', description: '适合今天直接穿' },
  { label: '更精致一点', description: '比第一套多一点造型完成度' },
  { label: '更轻松一点', description: '保留舒适和低决策成本' }
]

const sceneRoles: Record<Exclude<TodayScene, null>, Array<{ label: string; description: string }>> = {
  work: [
    { label: '最稳妥方案', description: '适合今天通勤直接穿' },
    { label: '更正式一点', description: '会议或见人时更稳' },
    { label: '更舒适一点', description: '保留通勤感但降低负担' }
  ],
  casual: [
    { label: '最稳妥方案', description: '日常直接出门不费力' },
    { label: '更轻松一点', description: '更适合散步和休闲安排' },
    { label: '更有变化', description: '在安全范围里多一点新鲜感' }
  ],
  date: [
    { label: '更有氛围', description: '先保住约会和聚会的完整感' },
    { label: '更显比例', description: '轮廓和视觉重点更清楚' },
    { label: '更轻松自然', description: '不用太用力也能成立' }
  ],
  travel: [
    { label: '最舒服', description: '优先照顾出行体感' },
    { label: '最上镜', description: '颜色和轮廓更有记忆点' },
    { label: '最耐走', description: '鞋履和轻便度更稳' }
  ],
  outdoor: [
    { label: '最实用', description: '优先处理天气和活动量' },
    { label: '更轻便', description: '减少负担，方便移动' },
    { label: '更有层次', description: '温差和轮廓更好处理' }
  ]
}

export function getTodayDecisionRole({
  index,
  scene,
  recommendation
}: {
  index: number
  scene: TodayScene
  recommendation: TodayRecommendation
}) {
  const roles = scene ? sceneRoles[scene] : defaultRoles
  const role = roles[index] ?? defaultRoles[index] ?? defaultRoles[0]

  if (recommendation.mode === 'inspiration' && index >= 2) {
    return {
      label: role.label,
      description: recommendation.dailyDifference ?? role.description
    }
  }

  return role
}
