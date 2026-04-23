import { DEFAULT_ACCOUNT_PASSWORD } from '@/lib/auth/password'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function bootstrapPasswordLogin(userId: string) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return { passwordBootstrapped: false, error: '未读取到当前登录用户' }
  }

  if (user.user_metadata?.password_bootstrapped) {
    return { passwordBootstrapped: true }
  }

  const { error: updateUserError } = await supabase.auth.updateUser({
    password: DEFAULT_ACCOUNT_PASSWORD,
    data: {
      ...user.user_metadata,
      password_bootstrapped: true,
      password_changed_at: null
    }
  })

  if (updateUserError) {
    return { passwordBootstrapped: false, error: updateUserError.message }
  }

  return { passwordBootstrapped: true }
}
