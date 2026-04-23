import { DEFAULT_ACCOUNT_PASSWORD } from '@/lib/auth/password'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
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

export async function bootstrapPasswordLoginByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    return { passwordBootstrapped: false, error: '未提供邮箱地址' }
  }

  const admin = createSupabaseAdminClient()
  const { data, error: listUsersError } = await admin.auth.admin.listUsers()

  if (listUsersError) {
    return { passwordBootstrapped: false, error: listUsersError.message }
  }

  const matchedUser = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)

  if (!matchedUser) {
    return { passwordBootstrapped: false, error: '未找到对应账号' }
  }

  if (matchedUser.user_metadata?.password_changed_at) {
    return { passwordBootstrapped: false, skipped: 'password_changed' as const }
  }

  const { error: updateUserError } = await admin.auth.admin.updateUserById(matchedUser.id, {
    password: DEFAULT_ACCOUNT_PASSWORD,
    user_metadata: {
      ...(matchedUser.user_metadata ?? {}),
      password_bootstrapped: true,
      password_changed_at: null
    }
  })

  if (updateUserError) {
    return { passwordBootstrapped: false, error: updateUserError.message }
  }

  return { passwordBootstrapped: true }
}
