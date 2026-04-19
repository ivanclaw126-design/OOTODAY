import { redirect } from 'next/navigation'
import { ClosetPage } from '@/components/closet/closet-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getEnv } from '@/lib/env'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

const notReady = async () => {
  throw new Error('Closet action not wired yet')
}

export default async function ClosetRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)

  const { storageBucket } = getEnv()
  const closet = await getClosetView(session.user.id)

  return (
    <ClosetPage
      userId={session.user.id}
      itemCount={closet.itemCount}
      items={closet.items}
      storageBucket={storageBucket}
      analyzeUpload={notReady}
      saveItem={notReady}
    />
  )
}
