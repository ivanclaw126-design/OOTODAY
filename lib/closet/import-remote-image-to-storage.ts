import { lookup } from 'node:dns/promises'
import { randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import { extname } from 'node:path'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getEnv } from '@/lib/env'

const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_REDIRECTS = 5
const REMOTE_IMPORT_FOLDER = 'remote-imports'

const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif'
}

function isPrivateIpv4Address(address: string) {
  const parts = address.split('.').map(Number)

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true
  }

  const [a, b] = parts

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19))
  )
}

function isProxyRelayIpv4Address(address: string) {
  const parts = address.split('.').map(Number)

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false
  }

  const [a, b] = parts

  return a === 198 && (b === 18 || b === 19)
}

function isPrivateIpv6Address(address: string) {
  const normalized = address.toLowerCase().split('%')[0]

  if (normalized === '::1') {
    return true
  }

  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true
  }

  if (/^fe[89ab]/.test(normalized)) {
    return true
  }

  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)

  if (mappedIpv4?.[1]) {
    return isPrivateIpv4Address(mappedIpv4[1])
  }

  return false
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

  const ipVersion = isIP(normalized)

  if (ipVersion === 4) {
    return isPrivateIpv4Address(normalized)
  }

  if (ipVersion === 6) {
    return isPrivateIpv6Address(normalized)
  }

  return false
}

async function assertPublicHostname(hostname: string) {
  if (isPrivateHostname(hostname)) {
    throw new Error('暂不支持解析本地或内网地址')
  }

  let records

  try {
    records = await lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new Error('远程图片地址解析失败，请换一个链接试试')
  }

  if (records.length === 0) {
    throw new Error('远程图片地址解析失败，请换一个链接试试')
  }

  // Some hosted runtimes resolve public domains through a fixed relay range
  // (`198.18.0.0/15`). Keep blocking raw private targets, but do not treat
  // those relay addresses as proof that the original hostname is private.
  if (records.some((record) => !isProxyRelayIpv4Address(record.address) && isPrivateHostname(record.address))) {
    throw new Error('暂不支持解析本地或内网地址')
  }
}

async function assertSafeRemoteUrl(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('商品链接只支持 http 或 https')
  }

  await assertPublicHostname(url.hostname)
}

function getContentType(headers: Headers) {
  return headers.get('content-type')?.split(';')[0]?.trim()?.toLowerCase() ?? ''
}

function getRemoteImageExtension(url: URL, contentType: string) {
  const contentTypeExtension = CONTENT_TYPE_TO_EXTENSION[contentType]

  if (contentTypeExtension) {
    return contentTypeExtension
  }

  const rawExtension = extname(url.pathname).toLowerCase().replace('.', '')

  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(rawExtension)) {
    return rawExtension === 'jpeg' ? 'jpg' : rawExtension
  }

  return 'jpg'
}

async function readRemoteImageBuffer(response: Response) {
  if (!response.body) {
    throw new Error('下载远程图片失败，请换一个链接试试')
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    if (!value) {
      continue
    }

    totalBytes += value.byteLength

    if (totalBytes > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error('图片太大了，请换一张 10MB 以内的图片试试')
    }

    chunks.push(value)
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
}

async function fetchRemoteImage(sourceUrl: string) {
  let currentUrl = new URL(sourceUrl)

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertSafeRemoteUrl(currentUrl)

    const response = await fetch(currentUrl, {
      headers: {
        Accept: 'image/*',
        'User-Agent': 'OOTODAY Closet Importer'
      },
      cache: 'no-store',
      redirect: 'manual'
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')

      if (!location) {
        throw new Error('远程图片跳转地址无效，请换一个链接试试')
      }

      if (redirectCount === MAX_REDIRECTS) {
        throw new Error('远程图片跳转次数过多，请换一个链接试试')
      }

      currentUrl = new URL(location, currentUrl)
      continue
    }

    if (!response.ok) {
      throw new Error('远程图片暂时打不开，请换一个链接试试')
    }

    const contentType = getContentType(response.headers)

    if (!contentType.startsWith('image/')) {
      throw new Error('这个链接没有返回可用图片，请直接贴图片链接试试')
    }

    if (!(contentType in CONTENT_TYPE_TO_EXTENSION)) {
      throw new Error('当前只支持 JPG、PNG、WebP、GIF、AVIF 图片导入')
    }

    const contentLength = Number(response.headers.get('content-length') ?? '')

    if (Number.isFinite(contentLength) && contentLength > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error('图片太大了，请换一张 10MB 以内的图片试试')
    }

    const buffer = await readRemoteImageBuffer(response)

    if (buffer.byteLength === 0) {
      throw new Error('下载到的图片为空，请换一个链接试试')
    }

    if (buffer.byteLength > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error('图片太大了，请换一张 10MB 以内的图片试试')
    }

    return {
      buffer,
      contentType,
      finalUrl: currentUrl
    }
  }

  throw new Error('远程图片导入失败，请换一个链接试试')
}

export async function importRemoteImageToStorage({ sourceUrl, userId }: { sourceUrl: string; userId: string }) {
  const { storageBucket } = getEnv()
  const { buffer, contentType, finalUrl } = await fetchRemoteImage(sourceUrl)
  const extension = getRemoteImageExtension(finalUrl, contentType)
  const objectPath = `${userId}/${REMOTE_IMPORT_FOLDER}/${Date.now()}-${randomUUID()}.${extension}`
  const admin = createSupabaseAdminClient()
  const { error } = await admin.storage.from(storageBucket).upload(objectPath, buffer, {
    contentType,
    upsert: false
  })

  if (error) {
    throw new Error(`Failed to upload remote closet image: ${error.message}`)
  }

  const {
    data: { publicUrl }
  } = admin.storage.from(storageBucket).getPublicUrl(objectPath)

  return {
    imageUrl: publicUrl,
    objectPath,
    contentType
  }
}
