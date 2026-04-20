export function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (!storageBucket) {
    throw new Error('Missing NEXT_PUBLIC_STORAGE_BUCKET')
  }

  return { supabaseUrl, supabaseAnonKey, storageBucket }
}

export function getAiEnv() {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  return { apiKey, baseUrl, model }
}
