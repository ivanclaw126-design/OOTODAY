#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import manifest from '../data/demo-wardrobe.json' with { type: 'json' }

const OUT_DIR = resolve(process.cwd(), 'docs/previews/demo-wardrobe-realistic-images')
const OUT_HTML = resolve(process.cwd(), 'docs/previews/demo-wardrobe-realistic-preview.html')
const IMAGE_WIDTH = 768
const IMAGE_HEIGHT = 960

loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

const IMAGE_PROVIDER = process.env.DEMO_IMAGE_PROVIDER ?? 'openai'
const CONCURRENCY = Number(process.env.DEMO_IMAGE_CONCURRENCY ?? 1)
const IMAGE_TIMEOUT_MS = Number(process.env.DEMO_IMAGE_TIMEOUT_MS ?? 600000)
const IMAGE_RETRY_LIMIT = Number(process.env.DEMO_IMAGE_RETRY_LIMIT ?? 6)
const IMAGE_RETRY_DELAY_MS = Number(process.env.DEMO_IMAGE_RETRY_DELAY_MS ?? 120000)
const IMAGE_REQUEST_DELAY_MS = Number(process.env.DEMO_IMAGE_REQUEST_DELAY_MS ?? 30000)
const OPENAI_IMAGE_BASE_URL = process.env.OPENAI_IMAGE_BASE_URL ?? 'https://api.openai.com/v1'
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1'
const OPENAI_IMAGE_SIZE = process.env.OPENAI_IMAGE_SIZE ?? '1024x1536'
const OPENAI_IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? 'medium'
const OPENAI_IMAGE_OUTPUT_FORMAT = process.env.OPENAI_IMAGE_OUTPUT_FORMAT ?? 'png'
const OPENAI_IMAGE_API_KEY =
  process.env.OPENAI_IMAGE_API_KEY ??
  (isOpenAIBaseUrl(process.env.OPENAI_BASE_URL) ? process.env.OPENAI_API_KEY : undefined)
const OUTPUT_EXTENSION = IMAGE_PROVIDER === 'openai' ? OPENAI_IMAGE_OUTPUT_FORMAT : 'jpg'

const colorMap = {
  白色: 'white',
  米白色: 'ivory off white',
  浅灰色: 'light gray',
  灰色: 'medium gray',
  深灰色: 'charcoal gray',
  黑色: 'black',
  米色: 'beige',
  卡其色: 'khaki tan',
  驼色: 'camel',
  棕色: 'brown',
  深棕色: 'dark brown',
  浅蓝色: 'light blue',
  牛仔蓝: 'denim blue',
  藏蓝色: 'navy blue',
  橄榄绿: 'olive green',
  酒红色: 'burgundy',
  红色: 'red',
  金色: 'gold',
  银色: 'silver metallic'
}

const itemMap = {
  T恤: 'women cotton crew neck t shirt',
  衬衫: 'women button up shirt',
  打底上衣: 'women fitted long sleeve base layer top',
  针织上衣: 'women fine knit top',
  毛衣: 'women wool sweater',
  卫衣: 'women sweatshirt',
  运动上衣: 'women athletic training top',
  '背心/吊带': 'women camisole tank top',
  牛仔裤: 'women straight leg jeans',
  西裤: 'women tailored trousers',
  休闲裤: 'women casual pants',
  工装裤: 'women cargo pants',
  长裙: 'women long skirt',
  短裙: 'women mini skirt',
  衬衫裙: 'women shirt dress',
  针织连衣裙: 'women knit dress',
  吊带裙: 'women slip dress',
  '连体裤/衣': 'women jumpsuit',
  西装外套: 'women blazer',
  开衫: 'women cardigan',
  牛仔外套: 'women denim jacket',
  风衣: 'women trench coat',
  夹克: 'women utility jacket',
  大衣: 'women wool coat',
  羽绒服: 'women puffer jacket',
  运动鞋: 'women sneakers',
  休闲鞋: 'women loafers',
  靴子: 'women ankle boots',
  '凉鞋/拖鞋': 'women flat sandals',
  高跟鞋: 'women high heels',
  托特包: 'women tote bag',
  斜挎包: 'women crossbody bag',
  单肩包: 'women shoulder bag',
  双肩包: 'women backpack',
  腰带: 'women leather belt',
  围巾: 'women scarf',
  帽子: 'black baseball cap',
  首饰: 'minimal jewelry set'
}

function isOpenAIBaseUrl(value) {
  return !value || value.includes('api.openai.com')
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const [key, ...valueParts] = trimmed.split('=')
    const rawValue = valueParts.join('=').trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function getItemName(item) {
  return itemMap[item.subCategory] ?? `${item.category} ${item.subCategory}`
}

function getColorName(item) {
  return colorMap[item.colorCategory] ?? item.colorCategory
}

function getPrompt(item) {
  const product = getItemName(item)
  const color = getColorName(item)
  const material = item.algorithmMeta?.material?.[0] ? `${item.algorithmMeta.material[0]} material` : ''
  const style = item.styleTags.slice(0, 2).join(', ')
  const displayMode = item.category === '鞋履' || item.category === '包袋' || item.category === '配饰'
    ? 'single product centered'
    : 'ghost mannequin product display, front view'

  return [
    'Create one consistent ecommerce catalog product image for the OOTODAY demo wardrobe',
    'Use the same visual system as every other item in this batch: premium Chinese fashion ecommerce product photo, white seamless studio background, soft natural shadow, centered product, front view, clean catalog crop, neutral lighting, realistic textile texture',
    `Product: ${color} ${product}`,
    displayMode,
    material,
    `Style notes: women fashion item, ${style}`,
    'The product must match the named category and color exactly',
    'No person, no face, no hands, no visible human body, no mannequin head, no hanger, no text, no logo, no watermark, no extra products, no busy background'
  ].filter(Boolean).join('. ')
}

function imageUrlFor(item, index) {
  const prompt = encodeURIComponent(getPrompt(item))
  const seed = 42000 + index * 97
  return `https://image.pollinations.ai/prompt/${prompt}?width=${IMAGE_WIDTH}&height=${IMAGE_HEIGHT}&seed=${seed}&nologo=true&enhance=true&model=flux`
}

async function downloadImage(item, index) {
  const outputPath = join(OUT_DIR, `${String(index + 1).padStart(2, '0')}-${item.slug}.${OUTPUT_EXTENSION}`)

  if (existsSync(outputPath) && !process.argv.includes('--force')) {
    return outputPath
  }

  if (IMAGE_REQUEST_DELAY_MS > 0) {
    await sleep(IMAGE_REQUEST_DELAY_MS)
  }

  const url = imageUrlFor(item, index)
  let lastError = null

  for (let attempt = 1; attempt <= IMAGE_RETRY_LIMIT; attempt += 1) {
    try {
      if (IMAGE_PROVIDER === 'openai') {
        await generateOpenAIImage(item, outputPath)
      } else {
        await fetchPollinationsImage(url, outputPath, item)
      }
      return outputPath
    } catch (error) {
      lastError = error

      if (!isRateLimitError(error) || attempt === IMAGE_RETRY_LIMIT) {
        break
      }

      process.stdout.write(`rate limited, retrying in ${Math.round(IMAGE_RETRY_DELAY_MS / 1000)}s ... `)
      await sleep(IMAGE_RETRY_DELAY_MS)
    }
  }

  throw lastError ?? new Error(`Image generation failed for ${item.slug}`)
}

async function fetchPollinationsImage(url, outputPath, item) {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), IMAGE_TIMEOUT_MS)
  const response = await fetch(url, {
    signal: abortController.signal,
    headers: {
      accept: 'image/jpeg,image/png,image/*'
    }
  }).finally(() => clearTimeout(timeout))

  if (!response.ok) {
    const error = new Error(`Image generation failed for ${item.slug}: ${response.status}`)
    error.status = response.status
    throw error
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.startsWith('image/')) {
    throw new Error(`Image generation returned ${contentType || 'unknown content type'} for ${item.slug}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(outputPath, buffer)
}

async function generateOpenAIImage(item, outputPath) {
  if (!OPENAI_IMAGE_API_KEY) {
    throw new Error('Missing OPENAI_IMAGE_API_KEY. The current OPENAI_API_KEY is not used because OPENAI_BASE_URL is not api.openai.com.')
  }

  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), IMAGE_TIMEOUT_MS)
  const response = await fetch(`${OPENAI_IMAGE_BASE_URL.replace(/\/$/u, '')}/images/generations`, {
    method: 'POST',
    signal: abortController.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_IMAGE_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: getPrompt(item),
      n: 1,
      size: OPENAI_IMAGE_SIZE,
      quality: OPENAI_IMAGE_QUALITY,
      output_format: OPENAI_IMAGE_OUTPUT_FORMAT
    })
  }).finally(() => clearTimeout(timeout))

  const result = await response.json()

  if (!response.ok) {
    const error = new Error(result.error?.message ?? `OpenAI image generation failed for ${item.slug}: ${response.status}`)
    error.status = response.status
    throw error
  }

  const base64 = result.data?.[0]?.b64_json

  if (!base64) {
    throw new Error(`OpenAI image generation returned no b64_json for ${item.slug}`)
  }

  await writeFile(outputPath, Buffer.from(base64, 'base64'))
}

function isRateLimitError(error) {
  return error && typeof error === 'object' && 'status' in error && error.status === 429
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function renderHtml() {
  const generatedAt = new Date().toISOString()
  const cards = manifest.items.map((item, index) => {
    const imageName = `${String(index + 1).padStart(2, '0')}-${item.slug}.${OUTPUT_EXTENSION}`
    const meta = [item.category, item.subCategory, item.colorCategory].join(' / ')
    const tags = item.styleTags.join(' · ')
    const prompt = getPrompt(item)

    return `
      <article class="card" data-category="${escapeHtml(item.category)}">
        <div class="image-wrap">
          <img src="./demo-wardrobe-realistic-images/${escapeHtml(imageName)}" alt="${escapeHtml(item.label)}" loading="lazy">
        </div>
        <div class="body">
          <div class="index">#${String(index + 1).padStart(2, '0')}</div>
          <h2>${escapeHtml(item.label)}</h2>
          <p class="meta">${escapeHtml(meta)}</p>
          <p class="tags">${escapeHtml(tags)}</p>
          <details>
            <summary>Prompt</summary>
            <p>${escapeHtml(prompt)}</p>
          </details>
        </div>
      </article>`
  }).join('\n')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OOTODAY Demo 衣橱真实感图片校对</title>
  <style>
    :root { color-scheme: light; font-family: Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; background: #f5f1e8; color: #17130d; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; }
    header { max-width: 1180px; margin: 0 auto 24px; display: flex; justify-content: space-between; gap: 20px; align-items: flex-end; }
    h1 { margin: 0; font-size: clamp(28px, 4vw, 48px); letter-spacing: 0; }
    .sub { margin: 10px 0 0; color: #6d6559; line-height: 1.7; }
    .stamp { color: #6d6559; font-size: 13px; text-align: right; }
    .grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
    .card { background: rgba(255,255,255,0.92); border: 1px solid #e4dccf; border-radius: 8px; overflow: hidden; box-shadow: 0 12px 28px rgba(23,19,13,0.08); }
    .image-wrap { aspect-ratio: 4 / 5; background: #fff; border-bottom: 1px solid #eee5d8; display: grid; place-items: center; overflow: hidden; }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .body { padding: 14px; }
    .index { font-size: 12px; font-weight: 700; color: #8d846f; margin-bottom: 6px; }
    h2 { margin: 0; font-size: 18px; line-height: 1.35; letter-spacing: 0; }
    .meta { margin: 8px 0 0; color: #4d463b; font-size: 14px; line-height: 1.45; }
    .tags { min-height: 44px; margin: 8px 0 0; color: #7a725f; font-size: 13px; line-height: 1.55; }
    details { margin-top: 10px; color: #6d6559; font-size: 12px; line-height: 1.5; }
    summary { cursor: pointer; font-weight: 700; }
    @media (max-width: 720px) { body { padding: 18px; } header { display: block; } .stamp { text-align: left; margin-top: 12px; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>OOTODAY Demo 衣橱图片校对</h1>
      <p class="sub">共 ${manifest.items.length} 件。先检查图片是否像对应衣物、颜色是否大体正确、品类是否跑偏。确认后再覆盖 demo 账号 Storage 和数据库 image_url。</p>
    </div>
    <div class="stamp">Generated at<br>${escapeHtml(generatedAt)}</div>
  </header>
  <main class="grid">
    ${cards}
  </main>
</body>
</html>`
}

await mkdir(OUT_DIR, { recursive: true })

let nextIndex = 0
const failures = []

console.log(`Image provider: ${IMAGE_PROVIDER}, concurrency: ${CONCURRENCY}`)

if (IMAGE_PROVIDER === 'openai' && !OPENAI_IMAGE_API_KEY) {
  throw new Error('Missing OPENAI_IMAGE_API_KEY. Add a real OpenAI API key for gpt-image-1 generation; the current OPENAI_API_KEY is ignored because OPENAI_BASE_URL is not api.openai.com.')
}

async function runWorker() {
  while (nextIndex < manifest.items.length) {
    const index = nextIndex
    nextIndex += 1
    const item = manifest.items[index]

    process.stdout.write(`[${index + 1}/${manifest.items.length}] ${item.label} ... `)

    try {
      await downloadImage(item, index)
      process.stdout.write('ok\n')
    } catch (error) {
      process.stdout.write('failed\n')
      failures.push({ item, error })
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => runWorker()))

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`${failure.item.slug}: ${failure.error instanceof Error ? failure.error.message : String(failure.error)}`)
  }

  process.exit(1)
}

await writeFile(OUT_HTML, renderHtml(), 'utf8')
console.log(`Preview written: ${OUT_HTML}`)
