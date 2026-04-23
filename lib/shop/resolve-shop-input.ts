import { selectBestShopProductImage } from '@/lib/shop/select-product-image'

type ResolvedShopInput =
  | {
      error: string
      imageUrl: null
      imageCandidates: []
      sourceTitle: null
      sourceUrl: null
    }
  | {
      error: null
      imageUrl: string
      imageCandidates: string[]
      sourceTitle: string | null
      sourceUrl: string
    }

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase()

  if (
    normalized === 'localhost' ||
    normalized === '0.0.0.0' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.endsWith('.local')
  ) {
    return true
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(normalized)) {
    const [a, b] = normalized.split('.').map(Number)

    if (a === 10 || a === 127 || a === 192 && b === 168 || a === 169 && b === 254) {
      return true
    }

    if (a === 172 && b >= 16 && b <= 31) {
      return true
    }
  }

  return false
}

function readMetaContent(html: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`, 'i')
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return null
}

function readTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match?.[1]?.trim() ?? null
}

function normalizeAbsoluteUrl(rawUrl: string, baseUrl: string) {
  try {
    return new URL(rawUrl, baseUrl).toString()
  } catch {
    return null
  }
}

function looksLikeImageUrl(url: URL) {
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url.pathname)
}

function hasHostname(hostname: string, suffix: string) {
  return hostname === suffix || hostname.endsWith(`.${suffix}`)
}

function decodeEmbeddedUrl(rawValue: string) {
  return rawValue
    .trim()
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/gi, '&')
}

function readEmbeddedStringField(html: string, fieldNames: string[]) {
  const values = readEmbeddedStringValues(html, fieldNames)
  return values[0] ?? null
}

function readEmbeddedStringValues(html: string, fieldNames: string[]) {
  const values: string[] = []

  for (const fieldName of fieldNames) {
    const patterns = [
      new RegExp(`["']${fieldName}["']\\s*:\\s*["']([^"']+)["']`, 'i'),
      new RegExp(`\\b${fieldName}\\b\\s*:\\s*["']([^"']+)["']`, 'i'),
      new RegExp(`\\b${fieldName}\\b\\s*=\\s*["']([^"']+)["']`, 'i')
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)

      if (match?.[1]) {
        values.push(decodeEmbeddedUrl(match[1]))
      }
    }
  }

  return Array.from(new Set(values))
}

function readEmbeddedStringArrayField(html: string, fieldNames: string[]) {
  const values = readEmbeddedStringArrayValues(html, fieldNames)
  return values[0] ?? null
}

function readEmbeddedStringArrayValues(html: string, fieldNames: string[]) {
  const values: string[] = []

  for (const fieldName of fieldNames) {
    const patterns = [
      new RegExp(`["']${fieldName}["']\\s*:\\s*\\[([^\\]]+)\\]`, 'i'),
      new RegExp(`\\b${fieldName}\\b\\s*:\\s*\\[([^\\]]+)\\]`, 'i'),
      new RegExp(`\\b${fieldName}\\b\\s*=\\s*\\[([^\\]]+)\\]`, 'i')
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)

      if (!match?.[1]) {
        continue
      }

      const firstItemMatch = match[1].match(/["']([^"']+)["']/i)

      if (firstItemMatch?.[1]) {
        values.push(decodeEmbeddedUrl(firstItemMatch[1]))
      }

      for (const itemMatch of match[1].matchAll(/["']([^"']+)["']/gi)) {
        if (itemMatch[1]) {
          values.push(decodeEmbeddedUrl(itemMatch[1]))
        }
      }
    }
  }

  return Array.from(new Set(values))
}

function readJdImageUrls(html: string) {
  const imageListMatch = html.match(/imageList\s*:\s*\[([^\]]+)\]/i)

  if (!imageListMatch?.[1]) {
    return []
  }

  const images = Array.from(imageListMatch[1].matchAll(/["']([^"']+\.(?:jpg|jpeg|png|webp|avif))["']/gi))
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value))

  return images.map((rawImage) => {
    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
      return rawImage
    }

    if (rawImage.startsWith('//')) {
      return `https:${rawImage}`
    }

    return `https://img14.360buyimg.com/n1/${rawImage.replace(/^\/+/, '')}`
  })
}

function looksLikeCatalogImage(url: string) {
  return /\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i.test(url)
}

function scoreProductImageCandidate(imageUrl: string) {
  const normalized = imageUrl.toLowerCase()
  let score = 0

  const negativeHints = [
    'model',
    'person',
    'look',
    'scene',
    'street',
    'wear',
    'full',
    'banner',
    'poster',
    'share',
    'logo',
    'avatar',
    'live',
    'video'
  ]

  const positiveHints = [
    'main',
    'sku',
    'goods',
    'product',
    'item',
    'spu',
    'gallery',
    'auction',
    'origin',
    'cover'
  ]

  for (const hint of negativeHints) {
    if (normalized.includes(hint)) {
      score -= 3
    }
  }

  for (const hint of positiveHints) {
    if (normalized.includes(hint)) {
      score += 2
    }
  }

  if (normalized.includes('detail')) {
    score -= 1
  }

  if (looksLikeCatalogImage(normalized)) {
    score += 1
  }

  return score
}

function isTaobaoLoginWall(html: string) {
  return html.includes('login.taobao.com/member/login.jhtml') || html.includes('login.m.taobao.com/login.htm')
}

async function followImageProbeRedirect(url: URL, redirectCount: number): Promise<boolean> {
  if (redirectCount > 2) {
    return false
  }

  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || isPrivateHostname(url.hostname)) {
    return false
  }

  const response = await fetch(url.toString(), {
    method: 'HEAD',
    headers: {
      Accept: 'image/*',
      'User-Agent': 'OOTODAY Shop Analyzer'
    },
    cache: 'no-store',
    redirect: 'manual'
  }).catch(() => null)

  if (!response) {
    return false
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location')

    if (!location) {
      return false
    }

    try {
      return followImageProbeRedirect(new URL(location, url), redirectCount + 1)
    } catch {
      return false
    }
  }

  if (!response.ok) {
    return false
  }

  return (response.headers.get('content-type')?.toLowerCase() ?? '').startsWith('image/')
}

async function isUsableImageCandidate(candidateUrl: string) {
  let parsed: URL

  try {
    parsed = new URL(candidateUrl)
  } catch {
    return false
  }

  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || isPrivateHostname(parsed.hostname)) {
    return false
  }

  if (looksLikeImageUrl(parsed)) {
    return true
  }

  return followImageProbeRedirect(parsed, 0)
}

async function filterImageCandidates(candidates: string[], baseUrl: string) {
  const normalizedCandidates = Array.from(
    new Set(
      candidates
        .map((candidate) => normalizeAbsoluteUrl(candidate, baseUrl))
        .filter((candidate): candidate is string => Boolean(candidate))
    )
  )

  const vettedCandidates: string[] = []

  for (const candidate of normalizedCandidates) {
    if (await isUsableImageCandidate(candidate)) {
      vettedCandidates.push(candidate)
    }
  }

  return vettedCandidates
}

async function selectBestProductImage(candidates: string[], baseUrl: string, preferredImageUrl?: string) {
  const normalizedCandidates = await filterImageCandidates(candidates, baseUrl)

  if (normalizedCandidates.length === 0) {
    return {
      imageUrl: null,
      imageCandidates: []
    }
  }

  const uniqueCandidates = Array.from(new Set(normalizedCandidates))

  if (preferredImageUrl && uniqueCandidates.includes(preferredImageUrl)) {
    return {
      imageUrl: preferredImageUrl,
      imageCandidates: uniqueCandidates
    }
  }

  const heuristicSortedCandidates = uniqueCandidates
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreProductImageCandidate(candidate)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      return a.index - b.index
    })
    .map((item) => item.candidate)

  const aiSelectedImageUrl = await selectBestShopProductImage(heuristicSortedCandidates).catch(() => null)

  return {
    imageUrl: aiSelectedImageUrl ?? heuristicSortedCandidates[0] ?? null,
    imageCandidates: heuristicSortedCandidates
  }
}

function readTaobaoImageUrls(html: string) {
  return readEmbeddedStringArrayValues(html, ['auctionImages', 'images'])
}

function readPinduoduoImageUrls(html: string) {
  return [
    ...readEmbeddedStringValues(html, ['hdThumbUrl', 'thumbUrl', 'goodsThumbUrl', 'topGallery']),
    ...readEmbeddedStringArrayValues(html, ['swiperImageList', 'topGallery'])
  ]
}

function readDewuImageUrls(html: string) {
  return [
    ...readEmbeddedStringValues(html, ['mainPic', 'imageUrl', 'pic', 'src', 'url']),
    ...readEmbeddedStringArrayValues(html, ['images', 'detailImages', 'galleryList'])
  ]
}

async function readPlatformImageUrl(hostname: string, html: string, baseUrl: string, preferredImageUrl?: string) {
  let candidates: string[] = []

  if (hasHostname(hostname, 'jd.com')) {
    candidates = readJdImageUrls(html)
  }
  else if (hasHostname(hostname, 'taobao.com') || hasHostname(hostname, 'tmall.com')) {
    candidates = readTaobaoImageUrls(html)
  }
  else if (hasHostname(hostname, 'yangkeduo.com') || hasHostname(hostname, 'pinduoduo.com')) {
    candidates = readPinduoduoImageUrls(html)
  }
  else if (hasHostname(hostname, 'dewu.com') || hasHostname(hostname, 'poizon.com')) {
    candidates = readDewuImageUrls(html)
  }

  return selectBestProductImage(candidates, baseUrl, preferredImageUrl)
}

function readPlatformTitle(hostname: string, html: string) {
  if (hasHostname(hostname, 'taobao.com') || hasHostname(hostname, 'tmall.com')) {
    return readEmbeddedStringField(html, ['title'])
  }

  if (hasHostname(hostname, 'yangkeduo.com') || hasHostname(hostname, 'pinduoduo.com')) {
    return readEmbeddedStringField(html, ['goodsName', 'title'])
  }

  if (hasHostname(hostname, 'dewu.com') || hasHostname(hostname, 'poizon.com')) {
    return readEmbeddedStringField(html, ['title', 'productName', 'spuName'])
  }

  return null
}

function isKnownGenericShareImage(hostname: string, imageUrl: string, sourceTitle: string | null) {
  if (hasHostname(hostname, 'yangkeduo.com') || hasHostname(hostname, 'pinduoduo.com')) {
    return imageUrl.includes('/base/share_logo.') || sourceTitle === '拼多多商城'
  }

  return false
}

export async function resolveShopInput(inputUrl: string, options?: { preferredImageUrl?: string }): Promise<ResolvedShopInput> {
  let parsed: URL

  try {
    parsed = new URL(inputUrl)
  } catch {
    return {
      error: '请输入可访问的商品链接或图片链接',
      imageUrl: null,
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      error: '商品链接只支持 http 或 https',
      imageUrl: null,
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (isPrivateHostname(parsed.hostname)) {
    return {
      error: '暂不支持解析本地或内网地址',
      imageUrl: null,
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (looksLikeImageUrl(parsed)) {
    return {
      error: null,
      imageUrl: parsed.toString(),
      imageCandidates: [parsed.toString()],
      sourceTitle: null,
      sourceUrl: parsed.toString()
    }
  }

  const response = await fetch(parsed.toString(), {
    headers: {
      'User-Agent': 'OOTODAY Shop Analyzer'
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    if (hasHostname(parsed.hostname, 'dewu.com')) {
      return {
        error: '得物链接当前无法稳定解析，请先贴商品图片链接',
        imageUrl: null,
        imageCandidates: [],
        sourceTitle: null,
        sourceUrl: null
      }
    }

    return {
      error: '商品链接暂时打不开，请换一个链接试试',
      imageUrl: null,
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    }
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''

  if (contentType.startsWith('image/')) {
    return {
      error: null,
      imageUrl: parsed.toString(),
      imageCandidates: [parsed.toString()],
      sourceTitle: null,
      sourceUrl: parsed.toString()
    }
  }

  const html = await response.text()
  const sourceTitle =
    readMetaContent(html, 'og:title') ??
    readPlatformTitle(parsed.hostname, html) ??
    readTitle(html)

  const platformImageSelection = await readPlatformImageUrl(
    parsed.hostname,
    html,
    parsed.toString(),
    options?.preferredImageUrl
  )
  const fallbackCandidates = [
    readMetaContent(html, 'og:image'),
    readMetaContent(html, 'twitter:image'),
    readMetaContent(html, 'twitter:image:src')
  ].filter((candidate): candidate is string => Boolean(candidate))
  const imageCandidates = Array.from(new Set([...platformImageSelection.imageCandidates, ...fallbackCandidates]))
  const rawImage = platformImageSelection.imageUrl ?? imageCandidates[0] ?? null

  if (!rawImage && hasHostname(parsed.hostname, 'taobao.com') && isTaobaoLoginWall(html)) {
    return {
      error: '淘宝链接当前会跳登录拦截，请先贴商品图片链接',
      imageUrl: null,
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    }
  }

  const imageUrl = rawImage ? normalizeAbsoluteUrl(rawImage, parsed.toString()) : null

  if (!imageUrl) {
    return {
      error: '没能从这个商品页里找到主图，请直接贴商品图片链接',
      imageUrl: null,
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (isKnownGenericShareImage(parsed.hostname, imageUrl, sourceTitle)) {
    return {
      error: '这个链接当前只能拿到站点通用分享图，请直接贴商品图片链接',
      imageUrl: null,
      imageCandidates: [],
      sourceTitle: null,
      sourceUrl: null
    }
  }

  return {
    error: null,
    imageUrl,
    imageCandidates: Array.from(new Set([imageUrl, ...imageCandidates.map((candidate) => normalizeAbsoluteUrl(candidate, parsed.toString())).filter((candidate): candidate is string => Boolean(candidate))])),
    sourceTitle,
    sourceUrl: parsed.toString()
  }
}
