type ResolvedInspirationInput =
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

    if (a === 10 || a === 127 || (a === 192 && b === 168) || (a === 169 && b === 254)) {
      return true
    }

    if (a === 172 && b >= 16 && b <= 31) {
      return true
    }
  }

  return false
}

function looksLikeImageUrl(url: URL) {
  return /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url.pathname)
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

export async function resolveInspirationInput(inputUrl: string): Promise<ResolvedInspirationInput> {
  let parsed: URL

  try {
    parsed = new URL(inputUrl)
  } catch {
    return {
      error: '请输入可访问的灵感图片链接',
      imageUrl: null,
      sourceTitle: null,
      sourceUrl: null
    }
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      error: '灵感链接只支持 http 或 https',
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
      'User-Agent': 'OOTODAY Inspiration Analyzer'
    },
    cache: 'no-store'
  })

  if (!response.ok) {
    return {
      error: '灵感链接暂时打不开，请换一个图片链接试试',
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
  const rawImage =
    readMetaContent(html, 'og:image') ??
    readMetaContent(html, 'twitter:image') ??
    readMetaContent(html, 'twitter:image:src')

  const imageUrl = rawImage ? normalizeAbsoluteUrl(rawImage, parsed.toString()) : null

  if (!imageUrl) {
    return {
      error: '没能从这个页面里找到灵感图，请直接贴图片链接试试',
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
