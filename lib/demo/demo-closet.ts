import { randomUUID } from 'node:crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getEnv } from '@/lib/env'
import type { Database } from '@/types/database'

export type DemoClosetAudience = 'womens' | 'mens'

export const DEMO_SEED_EMAIL = process.env.DEMO_SEED_EMAIL ?? process.env.DEMO_EMAIL ?? 'test@test.com'
export const DEMO_MENS_SEED_EMAIL = process.env.DEMO_MENS_SEED_EMAIL ?? 'test-men@test.com'

type ClosetItemRow = Database['public']['Tables']['items']['Row']
type ClosetItemInsert = Database['public']['Tables']['items']['Insert']

const CLOSET_ITEM_SELECT = [
  'id',
  'user_id',
  'image_url',
  'image_flipped',
  'image_original_url',
  'image_rotation_quarter_turns',
  'image_restore_expires_at',
  'category',
  'sub_category',
  'color_category',
  'style_tags',
  'algorithm_meta',
  'season_tags',
  'brand',
  'purchase_price',
  'purchase_year',
  'item_condition',
  'last_worn_date',
  'wear_count',
  'created_at',
  'updated_at'
].join(', ')

function getStoragePathFromPublicUrl(imageUrl: string | null, userId: string) {
  if (!imageUrl) {
    return null
  }

  const { storageBucket, supabaseUrl } = getEnv()
  const image = new URL(imageUrl)
  const storage = new URL(supabaseUrl)
  const publicPrefix = `/storage/v1/object/public/${storageBucket}/${userId}/`

  if (image.origin !== storage.origin || !image.pathname.startsWith(publicPrefix)) {
    return null
  }

  return decodeURIComponent(image.pathname.slice(`/storage/v1/object/public/${storageBucket}/`.length))
}

function getFileNameExtension(path: string | null) {
  const fileName = path?.split('/').pop() ?? ''
  const dotIndex = fileName.lastIndexOf('.')

  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return 'jpg'
  }

  const extension = fileName.slice(dotIndex + 1).toLowerCase()

  return /^[a-z0-9]{1,10}$/.test(extension) ? extension : 'jpg'
}

async function getUserIdByEmail(email: string) {
  const admin = createSupabaseAdminClient()
  const normalizedEmail = email.trim().toLowerCase()
  let page = 1

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })

    if (error) {
      throw error
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail)

    if (user) {
      return user.id
    }

    if (data.users.length < 1000) {
      return null
    }

    page += 1
  }

  return null
}

async function copyDemoImage({
  sourceImageUrl,
  seedUserId,
  targetUserId
}: {
  sourceImageUrl: string | null
  seedUserId: string
  targetUserId: string
}) {
  const sourcePath = getStoragePathFromPublicUrl(sourceImageUrl, seedUserId)

  if (!sourcePath) {
    return sourceImageUrl
  }

  const { storageBucket } = getEnv()
  const admin = createSupabaseAdminClient()
  const targetPath = `${targetUserId}/demo-imports/${randomUUID()}.${getFileNameExtension(sourcePath)}`
  const { error } = await admin.storage.from(storageBucket).copy(sourcePath, targetPath)

  if (error) {
    throw error
  }

  const { data } = admin.storage.from(storageBucket).getPublicUrl(targetPath)

  return data.publicUrl
}

async function listUserStoragePaths(prefix: string) {
  const { storageBucket } = getEnv()
  const admin = createSupabaseAdminClient()
  const paths: string[] = []

  async function walk(folder: string) {
    const { data, error } = await admin.storage.from(storageBucket).list(folder, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    })

    if (error) {
      throw error
    }

    for (const entry of data ?? []) {
      const entryPath = `${folder}/${entry.name}`

      if (entry.id) {
        paths.push(entryPath)
      } else {
        await walk(entryPath)
      }
    }
  }

  await walk(prefix)

  return paths
}

function getDemoSeedEmail(audience: DemoClosetAudience) {
  return audience === 'mens' ? DEMO_MENS_SEED_EMAIL : DEMO_SEED_EMAIL
}

export async function copyDemoClosetToUser(userId: string, audience: DemoClosetAudience = 'womens') {
  const seedUserId = await getUserIdByEmail(getDemoSeedEmail(audience))

  if (!seedUserId) {
    return { copiedCount: 0, error: '演示账号还没有创建' }
  }

  if (seedUserId === userId) {
    return { copiedCount: 0, error: '演示账号不能复制自己的衣橱' }
  }

  const admin = createSupabaseAdminClient()
  const { data: seedItems, error: seedItemsError } = await admin
    .from('items')
    .select(CLOSET_ITEM_SELECT)
    .eq('user_id', seedUserId)
    .order('created_at', { ascending: true })
    .returns<ClosetItemRow[]>()

  if (seedItemsError) {
    throw seedItemsError
  }

  if (!seedItems || seedItems.length === 0) {
    return { copiedCount: 0, error: '演示账号衣橱还是空的' }
  }

  const copiedItems: ClosetItemInsert[] = []

  for (const item of seedItems) {
    copiedItems.push({
      user_id: userId,
      image_url: await copyDemoImage({
        sourceImageUrl: item.image_url,
        seedUserId,
        targetUserId: userId
      }),
      image_flipped: false,
      image_original_url: null,
      image_rotation_quarter_turns: 0,
      image_restore_expires_at: null,
      category: item.category,
      sub_category: item.sub_category,
      color_category: item.color_category,
      style_tags: item.style_tags,
      algorithm_meta: item.algorithm_meta,
      season_tags: item.season_tags,
      brand: item.brand,
      purchase_price: item.purchase_price,
      purchase_year: item.purchase_year,
      item_condition: item.item_condition,
      last_worn_date: null,
      wear_count: 0
    })
  }

  const { error: insertError } = await admin.from('items').insert(copiedItems)

  if (insertError) {
    throw insertError
  }

  return { copiedCount: copiedItems.length, error: null }
}

export async function clearUserCloset(userId: string) {
  const admin = createSupabaseAdminClient()

  const deleteOperations = [
    admin.from('ootd').delete().eq('user_id', userId),
    admin.from('outfits').delete().eq('user_id', userId),
    admin.from('travel_plans').delete().eq('user_id', userId),
    admin.from('items').delete().eq('user_id', userId)
  ]

  const results = await Promise.all(deleteOperations)
  const firstError = results.find((result) => result.error)?.error

  if (firstError) {
    throw firstError
  }

  const { storageBucket } = getEnv()
  const objectPaths = await listUserStoragePaths(userId)

  if (objectPaths.length > 0) {
    const { error: storageError } = await admin.storage.from(storageBucket).remove(objectPaths)

    if (storageError) {
      throw storageError
    }
  }

  return { deletedImageCount: objectPaths.length }
}
