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

  if (error) {
    throw error
  }

  return data
}
