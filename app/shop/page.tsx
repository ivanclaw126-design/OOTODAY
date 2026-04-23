import { redirect } from 'next/navigation'
import { analyzeShopCandidateAction } from '@/app/shop/actions'
import { ShopPage } from '@/components/shop/shop-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getEnv } from '@/lib/env'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function ShopRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  const closet = await getClosetView(session.user.id)
  const { storageBucket } = getEnv()

  async function analyzeCandidate(input: { sourceUrl: string; preferredImageUrl?: string }) {
    'use server'

    return analyzeShopCandidateAction(input)
  }

  return (
    <ShopPage
      itemCount={closet.itemCount}
      userId={session.user.id}
      storageBucket={storageBucket}
      analyzeCandidate={analyzeCandidate}
    />
  )
}
