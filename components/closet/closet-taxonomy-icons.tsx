import { getColorDefinition, normalizeCategoryValue, normalizeColorValue, UNKNOWN_COLOR } from '@/lib/closet/taxonomy'

function iconClassName(size: 'sm' | 'md') {
  return size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
}

function CategorySvg({ category, size = 'md' }: { category: string | null | undefined; size?: 'sm' | 'md' }) {
  const normalizedCategory = normalizeCategoryValue(category)
  const className = iconClassName(size)

  if (normalizedCategory === '上装') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M10 10.5 13.6 7h4.8L22 10.5l3.5 2.3-2 4.2-2.5-1.4V25H11V15.6L8.5 17 6.5 12.8z" />
      </svg>
    )
  }

  if (normalizedCategory === '下装') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M11 6.5h10l1.4 18-4.5 1.5-1.9-8.6L14 26l-4.4-1.5z" />
      </svg>
    )
  }

  if (normalizedCategory === '全身装') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M12.5 7h7l2 4-2.4 3.1.9 10.4H12L13 14.1 10.5 11z" />
      </svg>
    )
  }

  if (normalizedCategory === '外套') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M11 7.5 14 6h4l3 1.5L24.5 12l-2.2 2.2-2.3-1.7V25H12V12.5l-2.3 1.7L7.5 12z" />
        <path d="M16 10.5V25" />
      </svg>
    )
  }

  if (normalizedCategory === '套装') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M7 8.5h8v6H7z" />
        <path d="M9 14.5v9.5" />
        <path d="M13 14.5v9.5" />
        <path d="M17 8.5h8v6h-8z" />
        <path d="M19 14.5v9.5" />
        <path d="M23 14.5v9.5" />
      </svg>
    )
  }

  if (normalizedCategory === '内搭') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M12 8.5 14.5 11h3L20 8.5l2.5 2v13H9.5v-13z" />
      </svg>
    )
  }

  if (normalizedCategory === '鞋履') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M7 18.5c2.2 0 3.2-1.8 4-4l4 2.2c1.2.7 2.3 1 4 1h1.5c2.2 0 4 1.8 4 4V24H7z" />
      </svg>
    )
  }

  if (normalizedCategory === '包袋') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M9 12h14l-1 12.5H10z" />
        <path d="M12 12V10a4 4 0 0 1 8 0v2" />
      </svg>
    )
  }

  if (normalizedCategory === '配饰') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M16 6.5 18.6 12l6 .8-4.4 4.2 1 6-5.2-2.8L10.8 23l1-6L7.4 12.8l6-.8z" />
      </svg>
    )
  }

  if (normalizedCategory === '家居服') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M11.5 7.5h9v5.3h-9z" />
        <path d="M11.8 12.8 9.5 24.5" />
        <path d="M20.2 12.8l2.3 11.7" />
        <path d="M14.5 12.8v11.7" />
        <path d="M17.5 12.8v11.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M9 9h14v14H9z" />
      <path d="M16 13.5a2.5 2.5 0 1 1 0 5v2" />
      <path d="M16 23.5h0" />
    </svg>
  )
}

function getColorStyles(color: string | null | undefined) {
  const normalizedColor = normalizeColorValue(color)

  const palette: Record<string, { background: string; pattern: 'stripe' | 'grid' | 'diagonal' }> = {
    白色: { background: '#F7F4EE', pattern: 'grid' },
    米白色: { background: '#F2E7D4', pattern: 'grid' },
    浅灰色: { background: '#D9DADF', pattern: 'grid' },
    灰色: { background: '#A8A8AE', pattern: 'grid' },
    深灰色: { background: '#57575E', pattern: 'grid' },
    黑色: { background: '#1A1A1F', pattern: 'grid' },
    米色: { background: '#D9C6AA', pattern: 'grid' },
    卡其色: { background: '#B89A68', pattern: 'grid' },
    驼色: { background: '#A8744A', pattern: 'diagonal' },
    棕色: { background: '#7A5337', pattern: 'diagonal' },
    深棕色: { background: '#523423', pattern: 'diagonal' },
    浅蓝色: { background: '#B8D7F5', pattern: 'stripe' },
    蓝色: { background: '#4D8CD9', pattern: 'stripe' },
    牛仔蓝: { background: '#5C6FA8', pattern: 'stripe' },
    藏蓝色: { background: '#203A68', pattern: 'stripe' },
    绿色: { background: '#4E9C68', pattern: 'stripe' },
    橄榄绿: { background: '#5F6740', pattern: 'diagonal' },
    黄色: { background: '#D5AE37', pattern: 'stripe' },
    橙色: { background: '#D67A33', pattern: 'stripe' },
    红色: { background: '#C94C46', pattern: 'stripe' },
    酒红色: { background: '#7C2E39', pattern: 'diagonal' },
    粉色: { background: '#E8B9C7', pattern: 'stripe' },
    紫色: { background: '#8F73B5', pattern: 'stripe' },
    金色: { background: '#C7A246', pattern: 'diagonal' },
    银色: { background: '#B7BDC9', pattern: 'diagonal' },
    [UNKNOWN_COLOR]: { background: '#D7D2CB', pattern: 'grid' }
  }

  return palette[normalizedColor] ?? palette[UNKNOWN_COLOR]
}

export function ClosetCategoryIcon({ category, size = 'md' }: { category: string | null | undefined; size?: 'sm' | 'md' }) {
  const wrapperClassName =
    size === 'sm'
      ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.75rem] bg-white text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_6px_14px_rgba(36,28,20,0.06)]'
      : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.95rem] bg-white text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_8px_18px_rgba(36,28,20,0.08)]'

  return (
    <span className={wrapperClassName} aria-hidden="true">
      <CategorySvg category={category} size={size} />
    </span>
  )
}

export function ClosetColorIcon({ color, size = 'md' }: { color: string | null | undefined; size?: 'sm' | 'md' }) {
  const { background, pattern } = getColorStyles(color)
  const wrapperClassName =
    size === 'sm'
      ? 'relative flex h-5 w-5 shrink-0 overflow-hidden rounded-[0.7rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_5px_12px_rgba(36,28,20,0.08)]'
      : 'relative flex h-7 w-7 shrink-0 overflow-hidden rounded-[0.9rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_7px_16px_rgba(36,28,20,0.08)]'
  const patternClassName =
    pattern === 'stripe'
      ? 'bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.95)_0_3px,transparent_3px_8px)]'
      : pattern === 'diagonal'
        ? 'bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.95)_0_4px,transparent_4px_10px)]'
        : 'bg-[linear-gradient(rgba(255,255,255,0.88)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.88)_1px,transparent_1px)] bg-[size:8px_8px]'

  return (
    <span className={wrapperClassName} style={{ background }}>
      <span aria-hidden="true" className={`absolute inset-0 opacity-25 ${patternClassName}`} />
      <span aria-hidden="true" className="absolute inset-[4px] rounded-[0.55rem] border border-white/55" />
    </span>
  )
}

export function ClosetCategoryBadge({ category, className = '' }: { category: string | null | undefined; className?: string }) {
  const normalizedCategory = normalizeCategoryValue(category)

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-black/7 bg-[var(--color-secondary)]/55 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] ${className}`.trim()}
    >
      <ClosetCategoryIcon category={normalizedCategory} size="sm" />
      <span>{normalizedCategory}</span>
    </span>
  )
}

export function ClosetColorBadge({ color, className = '' }: { color: string | null | undefined; className?: string }) {
  const normalizedColor = normalizeColorValue(color)
  const definition = getColorDefinition(normalizedColor)
  const label = definition?.value ?? normalizedColor ?? UNKNOWN_COLOR

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-black/7 bg-white/78 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] ${className}`.trim()}
    >
      <ClosetColorIcon color={label} size="sm" />
      <span>{label}</span>
    </span>
  )
}
