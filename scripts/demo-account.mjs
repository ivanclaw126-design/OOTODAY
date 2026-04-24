#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'test@test.com'
const DEMO_AUDIENCE = process.env.DEMO_AUDIENCE || 'womens'

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const [key, ...valueParts] = trimmed.split('=')
    const rawValue = valueParts.join('=').trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

async function findUserByEmail(admin, email) {
  const normalizedEmail = email.toLowerCase()
  let page = 1

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })

    if (error) {
      throw error
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail)

    if (user) {
      return user
    }

    if (data.users.length < 1000) {
      return null
    }

    page += 1
  }

  return null
}

loadEnvFile(resolve(process.cwd(), '.env.local'))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'http://localhost:3000'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

let user = await findUserByEmail(admin, DEMO_EMAIL)
const demoMetadata = {
  is_demo_seed: true,
  demo_audience: DEMO_AUDIENCE
}

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    email_confirm: true,
    user_metadata: demoMetadata
  })

  if (error) {
    throw error
  }

  user = data.user
} else if (!user.user_metadata?.is_demo_seed || user.user_metadata?.demo_audience !== DEMO_AUDIENCE) {
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      ...demoMetadata
    }
  })

  if (error) {
    throw error
  }

  user = data.user
}

const { error: profileError } = await admin.from('profiles').upsert({
  id: user.id,
  updated_at: new Date().toISOString()
})

if (profileError) {
  throw profileError
}

const redirectTo = new URL('/auth/callback', appUrl.startsWith('http') ? appUrl : `https://${appUrl}`).toString()
const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: DEMO_EMAIL,
  options: {
    redirectTo
  }
})

if (linkError) {
  throw linkError
}

console.log(`Demo seed email: ${DEMO_EMAIL}`)
console.log(`Demo seed audience: ${DEMO_AUDIENCE}`)
console.log(`Demo seed user id: ${user.id}`)
console.log(`Redirect to: ${redirectTo}`)
console.log(`Magic link: ${linkData.properties.action_link}`)
