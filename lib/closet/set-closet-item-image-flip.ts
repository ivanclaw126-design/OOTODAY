import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
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

export async function setClosetItemImageFlip({
  userId,
  itemId,
  imageFlipped
}: {
  userId: string
  itemId: string
  imageFlipped: boolean
}) {
  const supabase = await createSupabaseServerClient()
  const { storageBucket, supabaseUrl } = getEnv()
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('image_url')
    .eq('user_id', userId)
    .eq('id', itemId)
    .single()

  if (itemError) {
    throw itemError
  }

  if (!item.image_url) {
    throw new Error('这件衣物没有可旋转的图片')
  }

  const sourceObjectPath = extractStorageObjectPath(item.image_url, storageBucket, supabaseUrl)
  const { data: sourceImage, error: downloadError } = await supabase.storage.from(storageBucket).download(sourceObjectPath)

  if (downloadError) {
    throw new Error(`Failed to download closet image: ${downloadError.message}`)
  }

  const { default: Jimp } = await import('jimp')
  const sourceBuffer = Buffer.from(await sourceImage.arrayBuffer())
  const image = await Jimp.read(sourceBuffer)

  image.rotate(imageFlipped ? 90 : -90)

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
  const nextImageUrl = publicUrlData.publicUrl
  const baseUpdate = {
    image_url: nextImageUrl,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('items')
    .update({
      ...baseUpdate,
      image_flipped: imageFlipped
    })
    .eq('user_id', userId)
    .eq('id', itemId)
    .select('id, image_url')
    .single()

  if (error && /image_flipped/i.test(error.message)) {
    const fallbackResult = await supabase
      .from('items')
      .update(baseUpdate)
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
      imageFlipped,
      persisted: true as const
    }
  }

  if (error) {
    throw error
  }

  return {
    id: data.id,
    imageUrl: data.image_url,
    imageFlipped,
    persisted: true as const
  }
}
