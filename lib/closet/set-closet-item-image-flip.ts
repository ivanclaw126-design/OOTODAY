import { createSupabaseServerClient } from '@/lib/supabase/server'

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
  const { data, error } = await supabase
    .from('items')
    .update({
      image_flipped: imageFlipped
    })
    .eq('user_id', userId)
    .eq('id', itemId)
    .select('id')
    .single()

  // Older deployed databases may not have the image_flipped column yet.
  // Read-paths already degrade gracefully, so keep the action from crashing too.
  if (error && /image_flipped/i.test(error.message)) {
    return {
      id: itemId,
      persisted: false as const
    }
  }

  if (error) {
    throw error
  }

  return {
    ...data,
    persisted: true as const
  }
}
