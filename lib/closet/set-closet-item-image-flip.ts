import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
import { getRestoreExpiresAt, isRestoreWindowActive, normalizeQuarterTurns, ROTATE_RIGHT_DEGREES } from '@/lib/closet/image-rotation'
import { getEnv } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function extractStorageObjectPath(imageUrl: string, bucket: string, supabaseUrl: string) {
  const parsedImageUrl = new URL(imageUrl)
  const parsedSupabaseUrl = new URL(supabaseUrl)
  const storagePathPrefix = `/storage/v1/object/public/${bucket}/`

  if (parsedImageUrl.origin !== parsedSupabaseUrl.origin || !parsedImageUrl.pathname.startsWith(storagePathPrefix)) {
    throw new Error('Invalid closet upload URL')
  }

  return decodeURIComponent(parsedImageUrl.pathname.slice(storagePathPrefix.length))
}

type RotationOperation = 'rotate-right-90' | 'restore-original'

type ClosetImageRotationRow = {
  image_url: string | null
  image_original_url?: string | null
  image_rotation_quarter_turns?: number | null
  image_restore_expires_at?: string | null
}

async function uploadRotatedImage({
  userId,
  imageUrl
}: {
  userId: string
  imageUrl: string
}) {
  const supabase = await createSupabaseServerClient()
  const { storageBucket, supabaseUrl } = getEnv()
  const sourceObjectPath = extractStorageObjectPath(imageUrl, storageBucket, supabaseUrl)
  const { data: sourceImage, error: downloadError } = await supabase.storage.from(storageBucket).download(sourceObjectPath)

  if (downloadError) {
    throw new Error(`Failed to download closet image: ${downloadError.message}`)
  }

  const { default: Jimp } = await import('jimp')
  const sourceBuffer = Buffer.from(await sourceImage.arrayBuffer())
  const image = await Jimp.read(sourceBuffer)

  image.rotate(ROTATE_RIGHT_DEGREES)

  const mimeType = sourceImage.type || Jimp.MIME_JPEG
  const rotatedBuffer = await image.getBufferAsync(mimeType)
  const rotatedObjectPath = buildClosetUploadPath(userId, sourceObjectPath.split('/').pop() ?? 'closet-item.jpg')
  const uploadContentType = sourceImage.type || 'image/jpeg'
  const { error: uploadError } = await supabase.storage.from(storageBucket).upload(rotatedObjectPath, rotatedBuffer, {
    contentType: uploadContentType,
    upsert: false
  })

  if (uploadError) {
    throw new Error(`Failed to upload rotated closet image: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage.from(storageBucket).getPublicUrl(rotatedObjectPath)

  return publicUrlData.publicUrl
}

export async function setClosetItemImageFlip({
  userId,
  itemId,
  operation
}: {
  userId: string
  itemId: string
  operation: RotationOperation
}) {
  const supabase = await createSupabaseServerClient()
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('image_url, image_original_url, image_rotation_quarter_turns, image_restore_expires_at')
    .eq('user_id', userId)
    .eq('id', itemId)
    .single()

  let currentItem = item as ClosetImageRotationRow | null
  let currentItemError = itemError

  if (currentItemError && /(image_original_url|image_rotation_quarter_turns|image_restore_expires_at)/i.test(currentItemError.message)) {
    const fallbackResult = await supabase.from('items').select('image_url').eq('user_id', userId).eq('id', itemId).single()
    currentItem = fallbackResult.data as ClosetImageRotationRow | null
    currentItemError = fallbackResult.error
  }

  if (currentItemError) {
    throw currentItemError
  }

  if (!currentItem?.image_url) {
    throw new Error(operation === 'restore-original' ? '这件衣物当前没有可恢复的原图' : '这件衣物没有可旋转的图片')
  }

  const now = new Date()
  const hadActiveRestoreWindow = isRestoreWindowActive(currentItem.image_restore_expires_at, now)
  const originalImageUrl = hadActiveRestoreWindow ? currentItem.image_original_url ?? currentItem.image_url : currentItem.image_url
  const currentQuarterTurns = hadActiveRestoreWindow ? normalizeQuarterTurns(currentItem.image_rotation_quarter_turns) : 0

  if (operation === 'restore-original') {
    if (!hadActiveRestoreWindow || !currentItem.image_original_url || currentQuarterTurns === 0) {
      throw new Error('恢复原图已失效，请继续按当前朝向使用')
    }

    const restoreUpdate = {
      image_url: currentItem.image_original_url,
      image_flipped: false,
      image_original_url: null,
      image_rotation_quarter_turns: 0,
      image_restore_expires_at: null,
      updated_at: now.toISOString()
    }

    const { data, error } = await supabase
      .from('items')
      .update(restoreUpdate)
      .eq('user_id', userId)
      .eq('id', itemId)
      .select('id, image_url, image_original_url, image_rotation_quarter_turns, image_restore_expires_at')
      .single()

    if (error && /(image_original_url|image_rotation_quarter_turns|image_restore_expires_at|image_flipped)/i.test(error.message)) {
      const fallbackResult = await supabase
        .from('items')
        .update({
          image_url: currentItem.image_original_url,
          updated_at: now.toISOString()
        })
        .eq('user_id', userId)
        .eq('id', itemId)
        .select('id, image_url')
        .single()

      if (fallbackResult.error) {
        throw fallbackResult.error
      }

      return {
        id: itemId,
        imageUrl: fallbackResult.data.image_url,
        imageFlipped: false,
        imageOriginalUrl: null,
        imageRotationQuarterTurns: 0,
        imageRestoreExpiresAt: null,
        canRestoreOriginal: false,
        persisted: true as const
      }
    }

    if (error) {
      throw error
    }

    return {
      id: data.id,
      imageUrl: data.image_url,
      imageFlipped: false,
      imageOriginalUrl: data.image_original_url ?? null,
      imageRotationQuarterTurns: normalizeQuarterTurns(data.image_rotation_quarter_turns),
      imageRestoreExpiresAt: data.image_restore_expires_at ?? null,
      canRestoreOriginal: false,
      persisted: true as const
    }
  }

  const nextImageUrl = await uploadRotatedImage({
    userId,
    imageUrl: currentItem.image_url
  })
  const nextQuarterTurns = normalizeQuarterTurns(currentQuarterTurns + 1)
  const nextRestoreExpiresAt = getRestoreExpiresAt(now)
  const rotateUpdate = {
    image_url: nextImageUrl,
    image_flipped: nextQuarterTurns > 0,
    image_original_url: originalImageUrl,
    image_rotation_quarter_turns: nextQuarterTurns,
    image_restore_expires_at: nextRestoreExpiresAt,
    updated_at: now.toISOString()
  }

  const { data, error } = await supabase
    .from('items')
    .update(rotateUpdate)
    .eq('user_id', userId)
    .eq('id', itemId)
    .select('id, image_url, image_original_url, image_rotation_quarter_turns, image_restore_expires_at')
    .single()

  if (error && /(image_original_url|image_rotation_quarter_turns|image_restore_expires_at|image_flipped)/i.test(error.message)) {
    const fallbackResult = await supabase
      .from('items')
      .update({
        image_url: nextImageUrl,
        updated_at: now.toISOString()
      })
      .eq('user_id', userId)
      .eq('id', itemId)
      .select('id, image_url')
      .single()

    if (fallbackResult.error) {
      throw fallbackResult.error
    }

    return {
      id: itemId,
      imageUrl: fallbackResult.data.image_url,
      imageFlipped: false,
      imageOriginalUrl: null,
      imageRotationQuarterTurns: 0,
      imageRestoreExpiresAt: null,
      canRestoreOriginal: false,
      persisted: true as const
    }
  }

  if (error) {
    throw error
  }

  return {
    id: data.id,
    imageUrl: data.image_url,
    imageFlipped: nextQuarterTurns > 0,
    imageOriginalUrl: data.image_original_url ?? null,
    imageRotationQuarterTurns: normalizeQuarterTurns(data.image_rotation_quarter_turns),
    imageRestoreExpiresAt: data.image_restore_expires_at ?? null,
    canRestoreOriginal: nextQuarterTurns > 0,
    persisted: true as const
  }
}
