export const DEFAULT_ACCOUNT_PASSWORD = '123456'

export function validatePassword(password: string) {
  const normalizedPassword = password.trim()

  if (!normalizedPassword) {
    return '密码不能为空'
  }

  if (normalizedPassword.length < 6) {
    return '密码至少需要 6 位'
  }

  return null
}
