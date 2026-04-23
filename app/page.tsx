import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/landing-page'
import { getSession } from '@/lib/auth/get-session'

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ magic_link?: string; auth_error?: string }>
}) {
  const session = await getSession()

  if (session) {
    redirect('/today')
  }

  const params = await searchParams

  return <LandingPage magicLinkSent={params.magic_link === 'sent'} authError={params.auth_error ?? null} />
}
