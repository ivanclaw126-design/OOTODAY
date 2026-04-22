import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getEnv } from '@/lib/env'

function extractStoragePath(imageUrl: string, userId: string) {
  const { storageBucket, supabaseUrl } = getEnv()
  const uploadUrl = new URL(imageUrl)
  const storageUrl = new URL(supabaseUrl)
  const expectedPathPrefix = `/storage/v1/object/public/${storageBucket}/${userId}/`

  if (uploadUrl.origin !== storageUrl.origin) {
    return null
  }

  if (!uploadUrl.pathname.startsWith(expectedPathPrefix)) {
    return null
  }

  return decodeURIComponent(uploadUrl.pathname.slice(`/storage/v1/object/public/${storageBucket}/`.length))
}

export async function deleteClosetItem({ userId, itemId }: { userId: string; itemId: string }) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('items')
    .select('id, image_url')
    .eq('user_id', userId)
    .eq('id', itemId)
    .single()

  if (error) {
    throw error
  }

  const { error: deleteError } = await supabase.from('items').delete().eq('user_id', userId).eq('id', itemId)

  if (deleteError) {
    throw deleteError
  }

  if (!data.image_url) {
    return
  }

  const objectPath = extractStoragePath(data.image_url, userId)

  if (!objectPath) {
    return
  }

  const { storageBucket } = getEnv()
  try {
    const admin = createSupabaseAdminClient()
    const { error: storageError } = await admin.storage.from(storageBucket).remove([objectPath])

    // Storage cleanup should not roll back a successful item deletion.
    if (storageError) {
      console.warn('Failed to remove deleted closet image from storage', {
        userId,
        itemId,
        objectPath,
        message: storageError.message
      })
    }
  } catch (error) {
    console.warn('Failed to initialize storage cleanup for deleted closet item', {
      userId,
      itemId,
      objectPath,
      error
    })
  }
}
