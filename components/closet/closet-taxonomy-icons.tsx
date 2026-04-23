import {
  getColorDefinition,
  normalizeCategoryValue,
  normalizeColorValue,
  normalizeInput,
  OUTER_LAYER_CATEGORY,
  ONE_PIECE_CATEGORY,
  UNKNOWN_COLOR
} from '@/lib/closet/taxonomy'

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

  if (normalizedCategory === ONE_PIECE_CATEGORY) {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M12.5 7h7l2 4-2.4 3.1.9 10.4H12L13 14.1 10.5 11z" />
      </svg>
    )
  }

  if (normalizedCategory === OUTER_LAYER_CATEGORY) {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M11.6 7.4 14.3 6h3.4l2.7 1.4 2.8 4.2-1.9 2.2-2.2-1.4V26h-7.2V12.4l-2.2 1.4-1.9-2.2z" />
        <path d="M16 8.8V26" />
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

  if (normalizedCategory === '家居/睡衣') {
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

function SubCategorySvg({ subCategory, size = 'md' }: { subCategory: string | null | undefined; size?: 'sm' | 'md' }) {
  const normalized = normalizeInput(subCategory)
  const className = iconClassName(size)
  const baseProps = {
    viewBox: '0 0 32 32',
    'aria-hidden': 'true',
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8
  }

  if (['t恤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M10.5 11.2 14 8h4l3.5 3.2 2.5 1.7-1.5 3.4-2-.9V24H11.5v-8.6l-2 .9L8 12.9z" /></svg>
  }
  if (['衬衫'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12 7.5 14.8 10h2.4L20 7.5l3.2 2.6-1.8 3.1-2.2-1V25h-6.4V12.1l-2.2 1-1.8-3.1z" /><path d="M16 10v15" /></svg>
  }
  if (['polo'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11 8.2 14.5 6h3L21 8.2l2 2.8-2 2-2.3-1.2V25H13.3V11.8L11 13l-2-2z" /><path d="M15 9h2l-1 3z" /></svg>
  }
  if (['背心/吊带'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12 8.5c.8 1.2 1.8 1.8 3 1.8h2c1.2 0 2.2-.6 3-1.8l1.5 1.8V25H10.5V10.3z" /></svg>
  }
  if (['针织上衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.5 10.5 14 7.8h4L20.5 10.5l2.2 1.7-1.4 3-2.1-.9V25h-6.4V14.3l-2.1.9-1.4-3z" /><path d="M12.5 14h7" /><path d="M12.5 17.5h7" /></svg>
  }
  if (['毛衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M10.8 10.7 13.8 7h4.4l3 3.7 2.6 2-1.8 3.8-2.1-1V25H12V15.5l-2.1 1-1.8-3.8z" /><path d="M13 13.2h6" /></svg>
  }
  if (['卫衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M10.5 11 13.8 7.4h4.4l3.3 3.6 2.4 1.9-1.7 3.5-2.2-.9V25H12V15.5l-2.2.9-1.7-3.5z" /><path d="M12 24.5h8" /></svg>
  }
  if (['运动上衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11 11.5 14.2 7h3.6l3.2 4.5 2.4 1.6-1.5 3.2-2.4-.8V25h-7V15.5l-2.4.8-1.5-3.2z" /><path d="M15 14.5h2" /><path d="M16 13.5v2" /></svg>
  }
  if (['打底上衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12.2 9 14.6 11h2.8L19.8 9l1.7 2.1V25H10.5V11.1z" /><path d="M14 9.8V7.4" /><path d="M18 9.8V7.4" /></svg>
  }
  if (['牛仔裤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.2 6.8h9.6l1.3 17.2-4.1 1.5-1.9-8.1L14 25.5 9.9 24z" /></svg>
  }
  if (['休闲裤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11 7.2h10l1 17.5-3.9 1.1-2.1-8.6-2.1 8.6-3.9-1.1z" /></svg>
  }
  if (['西裤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.5 7h9l1.1 18-4 1.2-1.6-8.5-1.6 8.5-4-1.2z" /><path d="M16 7v5" /></svg>
  }
  if (['工装裤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.2 7h9.6l1 17.6-3.9 1.1-1.9-8.1-1.9 8.1-3.9-1.1z" /><path d="M10.4 14.5h3" /><path d="M18.6 14.5h3" /></svg>
  }
  if (['运动裤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.5 7h9l1 17.2-3.6 1.5-1.3-8.3-1.3 8.3-3.6-1.5z" /><path d="M13 9.8h6" /></svg>
  }
  if (['打底裤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12.5 7h7l.7 18.4-2.7.8L16 17.5l-1.5 8.7-2.7-.8z" /></svg>
  }
  if (['短裤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11 7.5h10l.7 7.4-3.8 1.3L16 12.8l-1.9 3.4-3.8-1.3z" /></svg>
  }
  if (['短裙'].includes(normalized)) {
    return <svg {...baseProps}><path d="M10.5 8h11l1.5 8.8H9z" /><path d="M12.5 11h7" /></svg>
  }
  if (['长裙'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12 7.5h8l2 16.8H10z" /><path d="M14.5 10.5 13 24" /><path d="M17.5 10.5 19 24" /></svg>
  }
  if (['连衣裙'].includes(normalized)) {
    return <svg {...baseProps}><path d="M13 7.5h6l1.6 4-2 2.6 2.5 10.4h-10l2.5-10.4-2-2.6z" /></svg>
  }
  if (['衬衫裙'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12 7.5 14.6 10h2.8L20 7.5l2.4 2.2-1.6 3.1-1.7-.7 2 11.4H11l2-11.4-1.7.7-1.6-3.1z" /><path d="M16 10v13" /></svg>
  }
  if (['针织连衣裙'].includes(normalized)) {
    return <svg {...baseProps}><path d="M13 7.3h6l1.7 3.4-1.6 2.3 2 11.2H11l2-11.2-1.6-2.3z" /><path d="M13.2 15.2h5.6" /></svg>
  }
  if (['吊带裙'].includes(normalized)) {
    return <svg {...baseProps}><path d="M13.5 8.5c.6 1 1.4 1.4 2.5 1.4s1.9-.4 2.5-1.4l1.5 1.8-1.2 3.3 2.3 10.4H10.9l2.3-10.4-1.2-3.3z" /></svg>
  }
  if (['连体裤/衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12.6 7.2 14.8 9h2.4l2.2-1.8 2 2.1-1.7 2.6.8 4.4-2.8 8.2-1.7-5.4-1.7 5.4-2.8-8.2.8-4.4-1.7-2.6z" /><path d="M16 9v8.3" /></svg>
  }
  if (['背带裤'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12.5 9h2.8v2.7h1.4V9h2.8v4.1l1.8 1V25h-10.6V14.1l1.8-1z" /><path d="M13.6 9V7" /><path d="M18.4 9V7" /></svg>
  }
  if (['西装外套'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.6 7.4 14.3 6h3.4l2.7 1.4 2.8 4.2-1.9 2.2-2.2-1.4V26h-7.2V12.4l-2.2 1.4-1.9-2.2z" /><path d="M16 8.8V26" /><path d="M14.1 11.5 16 14l1.9-2.5" /></svg>
  }
  if (['夹克'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.4 8 14 6.7h4l2.6 1.3 2.6 3.6-1.8 2-2.1-1.2V25H12.7V12.4l-2.1 1.2-1.8-2z" /><path d="M16 8.7V25" /></svg>
  }
  if (['牛仔外套'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.4 7.8 14 6.5h4l2.6 1.3 2.7 3.8-1.9 2-2.2-1.3V25.2h-7.6V12.3L10 13.6l-1.9-2z" /><path d="M16 8.6V25.2" /><path d="M14 10.3h.2" /><path d="M17.8 10.3h.2" /></svg>
  }
  if (['开衫'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12 8.1 14.2 6.8h3.6L20 8.1l2.3 3.5-1.6 1.8-2.1-1.3V25.6h-5.2V12.1l-2.1 1.3-1.6-1.8z" /><path d="M16 8.3V25.6" /></svg>
  }
  if (['风衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.4 7.4 14.2 6h3.6l2.8 1.4 2.9 4.4-1.9 2.3-2.4-1.5V26h-8.2V12.6l-2.4 1.5-1.9-2.3z" /><path d="M16 8.8V26" /><path d="M13.5 14h5" /></svg>
  }
  if (['大衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.5 7.2 14.2 6h3.6l2.7 1.2 2.9 4.5-2 2.4-2.3-1.6V26h-8.2V12.5l-2.3 1.6-2-2.4z" /><path d="M16 8.6V26" /></svg>
  }
  if (['羽绒服'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.5 7.8 14.1 6.5h3.8l2.6 1.3 2.8 4-1.9 2.1-2.2-1.4V25.4h-7.4V12.5l-2.2 1.4-1.9-2.1z" /><path d="M12.9 13.5h6.2" /><path d="M12.9 16.3h6.2" /><path d="M12.9 19.1h6.2" /><path d="M12.9 21.9h6.2" /></svg>
  }
  if (['棉服'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.5 7.8 14.1 6.5h3.8l2.6 1.3 2.8 4-1.9 2.1-2.2-1.4V25.4h-7.4V12.5l-2.2 1.4-1.9-2.1z" /><path d="M13.1 14.5h5.8" /><path d="M13.1 18.1h5.8" /></svg>
  }
  if (['冲锋衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.4 7.8 14 6.4h4l2.6 1.4 2.8 4-1.9 2-2.2-1.4V25.5h-7.6V12.4l-2.2 1.4-1.9-2z" /><path d="M14.3 9.2 16 10.9l1.7-1.7" /><path d="M16 10.9V25.5" /></svg>
  }
  if (['皮衣'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.4 7.8 14 6.5h4l2.6 1.3 2.8 4-1.9 2.1-2.3-1.5V25.5h-7.4V12.4l-2.3 1.5-1.9-2.1z" /><path d="M14.2 10 16 12l1.8-2" /><path d="M13.8 15.2 18.2 11.2" /></svg>
  }
  if (['运动鞋'].includes(normalized)) {
    return <svg {...baseProps}><path d="M7.5 18.6c2 0 3-1.6 3.9-3.8l4.2 2.3c1 .6 2 .8 3.4.8h2c1.9 0 3.5 1.5 3.5 3.4V24H7.5z" /></svg>
  }
  if (['靴子'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12 8.5h6v8l5 1.8V24H9v-4.8l3-1.2z" /></svg>
  }
  if (['休闲鞋'].includes(normalized)) {
    return <svg {...baseProps}><path d="M8 19.2c2.1 0 3.4-1.2 4.8-3l3.8 1.8c1.3.6 2.4.8 4 .8h2.1c1.3 0 2.3 1 2.3 2.3V24H8z" /><path d="M13.4 15.5h4.8" /></svg>
  }
  if (['凉鞋/拖鞋'].includes(normalized)) {
    return <svg {...baseProps}><path d="M8.8 22.3h14.4" /><path d="M10 18.4h11.2" /><path d="M11.4 13.2v9.1" /><path d="M18.8 11.4v10.9" /></svg>
  }
  if (['高跟鞋'].includes(normalized)) {
    return <svg {...baseProps}><path d="M10.2 17.2h9.8c.8 0 1.4.6 1.4 1.4v.7h-3.5l-2 3.9H9.8v-1.6z" /><path d="M19.8 17.2 22.6 23.2" /><path d="M12.5 17.2c1.1-2.8 3-5.1 5.5-6.8" /></svg>
  }
  if (['托特包'].includes(normalized)) {
    return <svg {...baseProps}><path d="M9 12.5h14l-1.2 12H10.2z" /><path d="M12.3 12.5V10a3.7 3.7 0 0 1 7.4 0v2.5" /></svg>
  }
  if (['单肩包'].includes(normalized)) {
    return <svg {...baseProps}><path d="M10 13.5h12l-1 10.5H11z" /><path d="M12.5 13.5a4.3 4.3 0 0 1 7-3.3" /></svg>
  }
  if (['斜挎包'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11 14h11l-.9 9.8H11.9z" /><path d="M9.5 8.5 22.5 23" /></svg>
  }
  if (['双肩包'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11 12a5 5 0 0 1 10 0v11H11z" /><path d="M13 12V10.5a3 3 0 0 1 6 0V12" /></svg>
  }
  if (['帽子'].includes(normalized)) {
    return <svg {...baseProps}><path d="M11.5 14.5a4.5 4.5 0 1 1 9 0" /><path d="M7.5 19h17" /></svg>
  }
  if (['围巾'].includes(normalized)) {
    return <svg {...baseProps}><path d="M12 7.5h8v8h-8z" /><path d="M15 15.5v9" /><path d="M19 15.5l-2 9" /></svg>
  }
  if (['腰带'].includes(normalized)) {
    return <svg {...baseProps}><path d="M7.5 16h11.5" /><rect x="19" y="13.5" width="5.5" height="5" rx="1" /></svg>
  }
  if (['首饰'].includes(normalized)) {
    return <svg {...baseProps}><path d="M16 9.5 20.5 14 16 22.5 11.5 14z" /><path d="M13 8h6" /></svg>
  }
  if (['家居套装'].includes(normalized)) {
    return <svg {...baseProps}><path d="M10.8 8h10.4v5.5H10.8z" /><path d="M11.5 13.5 9.8 24" /><path d="M20.5 13.5 22.2 24" /></svg>
  }
  if (['睡裙'].includes(normalized)) {
    return <svg {...baseProps}><path d="M13 8.5c.6 1 1.5 1.5 3 1.5s2.4-.5 3-1.5l1.4 1.6-1.3 3.2 2 10.7H11l2-10.7-1.3-3.2z" /></svg>
  }

  return (
    <svg {...baseProps}>
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

function wrapperClassName(size: 'sm' | 'md') {
  return size === 'sm'
    ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.75rem] bg-white text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_6px_14px_rgba(36,28,20,0.06)]'
    : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.95rem] bg-white text-[var(--color-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_8px_18px_rgba(36,28,20,0.08)]'
}

export function ClosetCategoryIcon({ category, size = 'md' }: { category: string | null | undefined; size?: 'sm' | 'md' }) {
  return (
    <span className={wrapperClassName(size)} aria-hidden="true">
      <CategorySvg category={category} size={size} />
    </span>
  )
}

export function ClosetSubCategoryIcon({ subCategory, size = 'md' }: { subCategory: string | null | undefined; size?: 'sm' | 'md' }) {
  return (
    <span className={wrapperClassName(size)} aria-hidden="true">
      <SubCategorySvg subCategory={subCategory} size={size} />
    </span>
  )
}

export function ClosetColorIcon({ color, size = 'md' }: { color: string | null | undefined; size?: 'sm' | 'md' }) {
  const { background, pattern } = getColorStyles(color)
  const outerClass =
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
    <span className={outerClass} style={{ background }}>
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

export function ClosetSubCategoryBadge({ subCategory, className = '' }: { subCategory: string | null | undefined; className?: string }) {
  const label = subCategory ?? '未分类'

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-black/7 bg-white/78 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)] ${className}`.trim()}
    >
      <ClosetSubCategoryIcon subCategory={label} size="sm" />
      <span>{label}</span>
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
