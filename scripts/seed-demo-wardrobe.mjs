#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_DEMO_EMAIL = 'test@test.com'
const STORAGE_PREFIX = 'demo-wardrobe'

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

function getArgValue(name) {
  const prefix = `${name}=`
  const inline = process.argv.find((arg) => arg.startsWith(prefix))

  if (inline) {
    return inline.slice(prefix.length)
  }

  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function slugify(value) {
  return value.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

async function findUserByEmail(admin, email) {
  const normalizedEmail = email.toLowerCase()
  let page = 1

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })

    if (error) {
      throw error
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail)

    if (user) {
      return user
    }

    if (data.users.length < 1000) {
      return null
    }

    page += 1
  }

  return null
}

async function listStoragePaths(admin, bucket, folder) {
  const paths = []

  async function walk(currentFolder) {
    const { data, error } = await admin.storage.from(bucket).list(currentFolder, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    })

    if (error) {
      throw error
    }

    for (const entry of data ?? []) {
      const entryPath = `${currentFolder}/${entry.name}`

      if (entry.id) {
        paths.push(entryPath)
      } else {
        await walk(entryPath)
      }
    }
  }

  await walk(folder)
  return paths
}

const COLOR_HEX = {
  白色: '#f8f7f2',
  米白色: '#f2eadc',
  浅灰色: '#d6d5d0',
  灰色: '#8f908d',
  深灰色: '#3f4242',
  黑色: '#111111',
  米色: '#dccdb6',
  卡其色: '#b8a06f',
  驼色: '#b88755',
  棕色: '#7a4f34',
  深棕色: '#3e291f',
  浅蓝色: '#a9cde8',
  牛仔蓝: '#496f9d',
  藏蓝色: '#172b4d',
  橄榄绿: '#5d6b3f',
  酒红色: '#7a1f2b',
  红色: '#d93232',
  金色: '#c9a24d',
  银色: '#c6c9ca'
}

function getColorHex(colorCategory) {
  return COLOR_HEX[colorCategory] ?? '#b9b0a1'
}

function getTextColor(colorCategory) {
  return ['白色', '米白色', '浅灰色', '米色', '浅蓝色', '金色', '银色'].includes(colorCategory) ? '#1f1f1f' : '#ffffff'
}

function renderGarmentShape(item, fill, stroke) {
  const category = item.category
  const subCategory = item.subCategory

  if (category === '上装') {
    if (subCategory === '背心/吊带') {
      return `<path d="M374 268 L456 268 L480 410 L544 410 L568 268 L650 268 L704 928 L320 928 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" />`
    }

    if (subCategory === '衬衫') {
      return `<path d="M356 286 L456 238 L512 326 L568 238 L668 286 L752 520 L668 562 L640 934 L384 934 L356 562 L272 520 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" /><path d="M456 238 L512 326 L568 238 M512 326 L512 934" fill="none" stroke="${stroke}" stroke-width="8" />`
    }

    return `<path d="M356 278 L456 236 L512 300 L568 236 L668 278 L760 506 L672 552 L642 932 L382 932 L352 552 L264 506 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" />`
  }

  if (category === '下装') {
    if (subCategory.includes('裙')) {
      return `<path d="M396 280 H628 L732 928 H292 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" /><path d="M396 280 H628" stroke="${stroke}" stroke-width="18" />`
    }

    return `<path d="M382 268 H642 L686 934 H548 L512 470 L476 934 H338 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" /><path d="M512 470 V920" stroke="${stroke}" stroke-width="8" />`
  }

  if (category === '连体/全身装') {
    if (subCategory.includes('裤')) {
      return `<path d="M382 250 L462 220 L512 292 L562 220 L642 250 L680 500 L608 528 L668 934 H544 L512 548 L480 934 H356 L416 528 L344 500 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" />`
    }

    return `<path d="M390 250 L462 220 L512 304 L562 220 L634 250 L704 928 H320 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" />`
  }

  if (category === '外层') {
    return `<path d="M338 246 L456 202 L512 306 L568 202 L686 246 L770 928 H596 L512 420 L428 928 H254 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" /><path d="M512 306 V928" stroke="${stroke}" stroke-width="8" />`
  }

  if (category === '鞋履') {
    return `<path d="M220 646 C330 578 430 610 492 696 C560 788 700 752 812 804 C840 818 850 862 824 886 C702 902 556 900 410 884 C310 874 230 848 178 814 C158 758 174 690 220 646 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" />`
  }

  if (category === '包袋') {
    return `<path d="M326 420 H698 L740 906 H284 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" /><path d="M408 420 C416 288 608 288 616 420" fill="none" stroke="${stroke}" stroke-width="28" stroke-linecap="round" />`
  }

  if (subCategory === '腰带') {
    return `<rect x="232" y="552" width="560" height="104" rx="22" fill="${fill}" stroke="${stroke}" stroke-width="10" /><rect x="452" y="528" width="120" height="152" rx="18" fill="none" stroke="${stroke}" stroke-width="18" />`
  }

  if (subCategory === '首饰') {
    return `<circle cx="512" cy="556" r="210" fill="none" stroke="${fill}" stroke-width="42" /><circle cx="512" cy="556" r="110" fill="none" stroke="${stroke}" stroke-width="10" opacity="0.45" />`
  }

  if (subCategory === '帽子') {
    return `<path d="M330 572 C350 392 674 392 694 572 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" /><path d="M236 610 C360 560 664 560 788 610 C730 684 294 684 236 610 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" />`
  }

  return `<path d="M300 444 C458 318 628 320 724 462 L660 858 L348 858 Z" fill="${fill}" stroke="${stroke}" stroke-width="10" />`
}

function renderSvg(item) {
  const fill = getColorHex(item.colorCategory)
  const labelColor = getTextColor(item.colorCategory)
  const stroke = labelColor === '#ffffff' ? 'rgba(255,255,255,0.72)' : 'rgba(17,17,17,0.36)'
  const shape = renderGarmentShape(item, fill, stroke)
  const escapedLabel = escapeXml(item.label)
  const escapedMeta = escapeXml(`${item.category} / ${item.subCategory} / ${item.colorCategory}`)
  const escapedTags = escapeXml(item.styleTags.slice(0, 3).join(' · '))

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1280" viewBox="0 0 1024 1280" role="img" aria-label="${escapedLabel}">
  <rect width="1024" height="1280" fill="#f7f5ef"/>
  <rect x="80" y="80" width="864" height="1120" rx="56" fill="#ffffff" stroke="#e7e0d2" stroke-width="3"/>
  <circle cx="512" cy="604" r="356" fill="#f4efe5"/>
  ${shape}
  <rect x="124" y="1030" width="776" height="112" rx="28" fill="${fill}" opacity="0.96"/>
  <text x="512" y="1076" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="${labelColor}">${escapedLabel}</text>
  <text x="512" y="1116" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="500" fill="${labelColor}" opacity="0.82">${escapedMeta}</text>
  <text x="512" y="1180" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="600" fill="#6d6559">${escapedTags}</text>
</svg>`
}

function normalizeStoragePath(userId, slug) {
  return `${userId}/${STORAGE_PREFIX}/${slugify(slug)}.svg`
}

function toInsertPayload(item, userId, imageUrl) {
  return {
    user_id: userId,
    image_url: imageUrl,
    image_flipped: false,
    image_original_url: null,
    image_rotation_quarter_turns: 0,
    image_restore_expires_at: null,
    category: item.category,
    sub_category: item.subCategory,
    color_category: item.colorCategory,
    style_tags: item.styleTags,
    algorithm_meta: item.algorithmMeta,
    season_tags: item.seasonTags,
    brand: manifest.brand,
    purchase_price: item.purchasePrice,
    purchase_year: item.purchaseYear,
    item_condition: item.itemCondition,
    last_worn_date: item.lastWornDate,
    wear_count: item.wearCount
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET
const demoEmail = getArgValue('--email') ?? process.env.DEMO_SEED_EMAIL ?? process.env.DEMO_EMAIL ?? DEFAULT_DEMO_EMAIL
const demoAudience = getArgValue('--audience') ?? process.env.DEMO_AUDIENCE ?? (demoEmail.includes('test-men') ? 'mens' : 'womens')
const manifestPath =
  getArgValue('--manifest') ??
  (demoAudience === 'mens' ? 'data/demo-wardrobe-men.json' : 'data/demo-wardrobe.json')
const manifest = JSON.parse(readFileSync(resolve(process.cwd(), manifestPath), 'utf8'))

if (!supabaseUrl || !serviceRoleKey || !storageBucket) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or NEXT_PUBLIC_STORAGE_BUCKET')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const user = await findUserByEmail(admin, demoEmail)

if (!user) {
  console.error(`Demo seed account not found: ${demoEmail}`)
  console.error('Create it first with npm run demo:magiclink, or pass --email=<demo-account-email>.')
  process.exit(1)
}

const now = new Date().toISOString()
const { error: profileError } = await admin.from('profiles').upsert({
  id: user.id,
  updated_at: now
})

if (profileError) {
  throw profileError
}

const storageFolder = `${user.id}/${STORAGE_PREFIX}`
const existingPaths = await listStoragePaths(admin, storageBucket, storageFolder).catch((error) => {
  if (String(error?.message ?? error).includes('not found')) {
    return []
  }

  throw error
})

if (existingPaths.length > 0) {
  const { error } = await admin.storage.from(storageBucket).remove(existingPaths)

  if (error) {
    throw error
  }
}

const { error: deleteError } = await admin
  .from('items')
  .delete()
  .eq('user_id', user.id)
  .eq('brand', manifest.brand)

if (deleteError) {
  throw deleteError
}

const inserts = []

for (const item of manifest.items) {
  const storagePath = normalizeStoragePath(user.id, item.slug)
  const svg = renderSvg(item)
  const { error: uploadError } = await admin.storage.from(storageBucket).upload(storagePath, Buffer.from(svg, 'utf8'), {
    contentType: 'image/svg+xml; charset=utf-8',
    upsert: true
  })

  if (uploadError) {
    throw uploadError
  }

  const { data } = admin.storage.from(storageBucket).getPublicUrl(storagePath)
  inserts.push(toInsertPayload(item, user.id, data.publicUrl))
}

const { error: insertError } = await admin.from('items').insert(inserts)

if (insertError) {
  throw insertError
}

console.log(`Seeded ${inserts.length} demo wardrobe items`)
console.log(`Demo seed email: ${demoEmail}`)
console.log(`Demo seed audience: ${demoAudience}`)
console.log(`Demo seed user id: ${user.id}`)
console.log(`Manifest: ${manifestPath}`)
console.log(`Storage prefix: ${storageFolder}`)
