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
