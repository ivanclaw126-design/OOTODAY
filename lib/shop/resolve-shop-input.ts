type ResolvedShopInput =
  | {
      error: string
      imageUrl: null
      sourceTitle: null
      sourceUrl: null
    }
  | {
      error: null
      imageUrl: string
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

function readJdImageUrl(html: string) {
  const imageListMatch = html.match(/imageList\s*:\s*\[([^\]]+)\]/i)

  if (!imageListMatch?.[1]) {
    return null
  }

  const firstImageMatch = imageListMatch[1].match(/["']([^"']+\.(?:jpg|jpeg|png|webp|avif))["']/i)

  if (!firstImageMatch?.[1]) {
    return null
  }

  const firstImage = firstImageMatch[1].trim()

  if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
    return firstImage
  }

  if (firstImage.startsWith('//')) {
    return `https:${firstImage}`
  }

  return `https://img14.360buyimg.com/n1/${firstImage.replace(/^\/+/, '')}`
}

function isTaobaoLoginWall(html: string) {
  return html.includes('login.taobao.com/member/login.jhtml') || html.includes('login.m.taobao.com/login.htm')
}

function isKnownGenericShareImage(hostname: string, imageUrl: string, sourceTitle: string | null) {
  if (hasHostname(hostname, 'yangkeduo.com') || hasHostname(hostname, 'pinduoduo.com')) {
    return imageUrl.includes('/base/share_logo.') || sourceTitle === '拼多多商城'
  }

  return false
}

export async function resolveShopInput(inputUrl: string): Promise<ResolvedShopInput> {
  let parsed: URL

  try {
    parsed = new URL(inputUrl)
  } catch {
    return {
      error: '请输入可访问的商品链接或图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      error: '商品链接只支持 http 或 https',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (isPrivateHostname(parsed.hostname)) {
    return {
      error: '暂不支持解析本地或内网地址',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (looksLikeImageUrl(parsed)) {
    return {
      error: null,
      imageUrl: parsed.toString(),
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
        sourceTitle: null,
        sourceUrl: null
      }
    }

    return {
      error: '商品链接暂时打不开，请换一个链接试试',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    }
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''

  if (contentType.startsWith('image/')) {
    return {
      error: null,
      imageUrl: parsed.toString(),
      sourceTitle: null,
      sourceUrl: parsed.toString()
    }
  }

  const html = await response.text()
  const sourceTitle = readMetaContent(html, 'og:title') ?? readTitle(html)

  if (hasHostname(parsed.hostname, 'taobao.com') && isTaobaoLoginWall(html)) {
    return {
      error: '淘宝链接当前会跳登录拦截，请先贴商品图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    }
  }

  const rawImage =
    (hasHostname(parsed.hostname, 'jd.com') ? readJdImageUrl(html) : null) ??
    readMetaContent(html, 'og:image') ??
    readMetaContent(html, 'twitter:image') ??
    readMetaContent(html, 'twitter:image:src')

  const imageUrl = rawImage ? normalizeAbsoluteUrl(rawImage, parsed.toString()) : null

  if (!imageUrl) {
    return {
      error: '没能从这个商品页里找到主图，请直接贴商品图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (isKnownGenericShareImage(parsed.hostname, imageUrl, sourceTitle)) {
    return {
      error: '这个链接当前只能拿到站点通用分享图，请直接贴商品图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    }
  }

  return {
    error: null,
    imageUrl,
    sourceTitle,
    sourceUrl: parsed.toString()
  }
}
