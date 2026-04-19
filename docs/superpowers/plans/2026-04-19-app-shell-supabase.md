# App Shell + Supabase Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first shippable OOTODAY web foundation, a Next.js app shell with real Supabase auth, database schema, and `/today` + `/closet` pages backed by live user data.

**Architecture:** Create a small App Router codebase with server-rendered route files, presentational page components, shared UI primitives, and a thin Supabase layer for env parsing, browser/server clients, and auth session refresh. Keep page skeletons and business logic separate so the next phase, wardrobe upload, can plug into existing routes and data boundaries instead of forcing a rewrite.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Supabase SSR/Auth/Postgres, Vitest, Testing Library, jsdom

---

## File Structure

### Create

- `package.json` - app scripts and dependencies
- `tsconfig.json` - TypeScript config for Next.js + Vitest
- `next.config.ts` - Next.js config stub
- `next-env.d.ts` - Next.js type shim
- `postcss.config.mjs` - Tailwind PostCSS wiring
- `eslint.config.mjs` - lint config
- `vitest.config.ts` - unit test config
- `tests/setup.ts` - Testing Library setup
- `app/globals.css` - Tailwind import and design tokens from `DESIGN.md`
- `app/layout.tsx` - root HTML shell
- `app/page.tsx` - landing route, redirects authenticated users
- `app/today/page.tsx` - protected Today route
- `app/closet/page.tsx` - protected Closet route
- `app/auth/callback/route.ts` - Supabase auth callback handler
- `middleware.ts` - Supabase session refresh middleware
- `components/ui/button.tsx` - shared primary/secondary button
- `components/ui/card.tsx` - shared card wrapper
- `components/ui/empty-state.tsx` - empty state block
- `components/ui/status-banner.tsx` - environment / connection status message
- `components/app-shell.tsx` - authenticated page shell
- `components/bottom-nav.tsx` - Today / Closet navigation
- `components/landing/landing-page.tsx` - unauthenticated marketing entry
- `components/today/today-page.tsx` - Today presentational component
- `components/closet/closet-page.tsx` - Closet presentational component
- `lib/env.ts` - environment variable parsing
- `lib/supabase/server.ts` - server-side Supabase client
- `lib/supabase/client.ts` - browser Supabase client
- `lib/supabase/middleware.ts` - middleware helper
- `lib/auth/get-session.ts` - current session helper
- `lib/profiles/ensure-profile.ts` - lazily create profile row after login
- `lib/data/get-closet-summary.ts` - query item count for current user
- `lib/data/get-today-state.ts` - query Today state for current user
- `types/database.ts` - shared database types
- `supabase/migrations/20260419_initial_schema.sql` - tables, indexes, RLS, policies
- `.env.example` - required env template
- `tests/lib/env.test.ts` - env parser test
- `tests/components/landing-page.test.tsx` - landing route smoke test
- `tests/components/app-shell.test.tsx` - shell + nav render test
- `tests/components/today-page.test.tsx` - Today empty and partial states
- `tests/components/closet-page.test.tsx` - Closet empty and summary states

### Modify

- `CLAUDE.md` - no change expected
- `DESIGN.md` - reference only, no change expected

## Task 0: Create the implementation worktree

**Files:**
- Create: none
- Modify: none
- Test: none

- [ ] **Step 1: Create a dedicated worktree and branch**

Run:
```bash
git worktree add ../OOTODAY-app-shell -b feat/app-shell-supabase
```

Expected: output includes `Preparing worktree` and a new branch named `feat/app-shell-supabase`.

- [ ] **Step 2: Enter the worktree and verify git state**

Run:
```bash
cd ../OOTODAY-app-shell && git status --short --branch
```

Expected: `## feat/app-shell-supabase` and an empty working tree.

- [ ] **Step 3: Copy the approved spec path into your working notes**

Use this exact reference during implementation:
```text
docs/superpowers/specs/2026-04-19-app-shell-supabase-design.md
```

Expected: no code change. This is the source of truth for scope.

## Task 1: Bootstrap the project, test harness, and landing route

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`
- Create: `components/landing/landing-page.tsx`
- Test: `tests/components/landing-page.test.tsx`

- [ ] **Step 1: Write the failing landing page smoke test**

Create `tests/components/landing-page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '@/components/landing/landing-page'

describe('LandingPage', () => {
  it('renders the product promise and sign-in CTA', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { name: 'OOTODAY' })).toBeInTheDocument()
    expect(screen.getByText('最低成本导入你的真实衣橱')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '开始登录' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test -- landing-page.test.tsx
```

Expected: FAIL with `Cannot find module '@/components/landing/landing-page'` or missing Vitest config.

- [ ] **Step 3: Create the package and tooling files**

Create `package.json`:
```json
{
  "name": "ootoday",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.75.0",
    "clsx": "^2.1.1",
    "next": "16.0.0",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "@tailwindcss/postcss": "^4.1.12",
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^24.3.0",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "eslint": "^9.34.0",
    "eslint-config-next": "16.0.0",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.1.12",
    "typescript": "^5.9.2",
    "vitest": "^3.2.4"
  }
}
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "types": ["vitest/globals"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  }
})
```

Create `tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

Create `next.config.ts`:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

Create `postcss.config.mjs`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
}
```

Create `eslint.config.mjs`:
```js
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
})

export default [...compat.extends('next/core-web-vitals', 'next/typescript')]
```

Create `next-env.d.ts`:
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file is automatically generated by Next.js.
```

- [ ] **Step 4: Add the landing page implementation and root layout**

Create `components/landing/landing-page.tsx`:
```tsx
export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-neutral-light)] px-4 py-10 text-[var(--color-primary)]">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <p className="text-sm text-[var(--color-accent)]">AI 穿搭助手</p>
        <h1 className="text-4xl font-semibold">OOTODAY</h1>
        <p className="text-lg">最低成本导入你的真实衣橱</p>
        <p className="text-base text-[var(--color-neutral-dark)]">
          先搭出能跑的真实产品地基，再把上传、推荐和 OOTD 记录长上去。
        </p>
        <a
          className="inline-flex w-fit rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-white"
          href="/auth/callback"
        >
          开始登录
        </a>
      </div>
    </main>
  )
}
```

Create `app/layout.tsx`:
```tsx
import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'OOTODAY',
  description: 'AI-powered personal wardrobe assistant'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

Create `app/globals.css`:
```css
@import "tailwindcss";

:root {
  --color-primary: #1a1a1a;
  --color-secondary: #f5f5f5;
  --color-accent: #3b82f6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-neutral-light: #fafafa;
  --color-neutral-mid: #d4d4d4;
  --color-neutral-dark: #525252;
}

html {
  background: var(--color-neutral-light);
  color: var(--color-primary);
}

body {
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
}
```

Create `app/page.tsx`:
```tsx
import { LandingPage } from '@/components/landing/landing-page'

export default function HomePage() {
  return <LandingPage />
}
```

- [ ] **Step 5: Install dependencies and run the test again**

Run:
```bash
npm install && npm test -- landing-page.test.tsx
```

Expected: PASS and output includes `1 passed`.

- [ ] **Step 6: Commit the bootstrap task**

Run:
```bash
git add package.json tsconfig.json next.config.ts next-env.d.ts postcss.config.mjs eslint.config.mjs vitest.config.ts tests/setup.ts app/layout.tsx app/globals.css app/page.tsx components/landing/landing-page.tsx tests/components/landing-page.test.tsx package-lock.json && git commit -m "feat: bootstrap Next.js app shell"
```

Expected: one commit containing the base app and first passing test.

## Task 2: Add design primitives and the authenticated shell

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/empty-state.tsx`
- Create: `components/ui/status-banner.tsx`
- Create: `components/app-shell.tsx`
- Create: `components/bottom-nav.tsx`
- Test: `tests/components/app-shell.test.tsx`

- [ ] **Step 1: Write the failing shell test**

Create `tests/components/app-shell.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from '@/components/app-shell'

describe('AppShell', () => {
  it('renders the page title and both primary navigation links', () => {
    render(
      <AppShell title="Today">
        <div>page body</div>
      </AppShell>
    )

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('href', '/today')
    expect(screen.getByRole('link', { name: 'Closet' })).toHaveAttribute('href', '/closet')
  })
})
```

- [ ] **Step 2: Run the shell test and confirm it fails**

Run:
```bash
npm test -- app-shell.test.tsx
```

Expected: FAIL because `@/components/app-shell` does not exist.

- [ ] **Step 3: Implement the shared UI building blocks**

Create `components/ui/button.tsx`:
```tsx
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

const baseClassName = 'inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium'

export function PrimaryButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${baseClassName} bg-[var(--color-primary)] text-white`} {...props}>{children}</button>
}

export function SecondaryButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${baseClassName} border border-[var(--color-neutral-mid)] bg-[var(--color-secondary)] text-[var(--color-primary)]`} {...props}>{children}</button>
}

export function PrimaryLink({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={`${baseClassName} bg-[var(--color-primary)] text-white`} {...props}>{children as ReactNode}</a>
}
```

Create `components/ui/card.tsx`:
```tsx
import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-lg bg-white p-4 shadow-sm">{children}</section>
}
```

Create `components/ui/empty-state.tsx`:
```tsx
import type { ReactNode } from 'react'

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[var(--color-neutral-mid)] bg-white p-6 text-center">
      <h2 className="text-xl font-medium">{title}</h2>
      <p className="text-sm text-[var(--color-neutral-dark)]">{description}</p>
      {action}
    </div>
  )
}
```

Create `components/ui/status-banner.tsx`:
```tsx
export function StatusBanner({ message }: { message: string }) {
  return <div className="rounded-md bg-[var(--color-warning)]/15 px-4 py-3 text-sm text-[var(--color-primary)]">{message}</div>
}
```

Create `components/bottom-nav.tsx`:
```tsx
const links = [
  { href: '/today', label: 'Today' },
  { href: '/closet', label: 'Closet' }
] as const

export function BottomNav() {
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 border-t border-[var(--color-neutral-mid)] bg-white px-4 py-3">
      <ul className="mx-auto flex max-w-2xl items-center justify-around">
        {links.map((link) => (
          <li key={link.href}>
            <a className="text-sm text-[var(--color-primary)]" href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

Create `components/app-shell.tsx`:
```tsx
import type { ReactNode } from 'react'
import { BottomNav } from '@/components/bottom-nav'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-neutral-light)] pb-20">
      <header className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-6">
        <p className="text-sm text-[var(--color-neutral-dark)]">OOTODAY</p>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4">{children}</main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Run the shell test again**

Run:
```bash
npm test -- app-shell.test.tsx
```

Expected: PASS and output includes `1 passed`.

- [ ] **Step 5: Commit the shell task**

Run:
```bash
git add components/ui/button.tsx components/ui/card.tsx components/ui/empty-state.tsx components/ui/status-banner.tsx components/bottom-nav.tsx components/app-shell.tsx tests/components/app-shell.test.tsx && git commit -m "feat: add design primitives and app shell"
```

Expected: one commit with reusable UI primitives and shell navigation.

## Task 3: Add environment parsing and Supabase clients

**Files:**
- Create: `.env.example`
- Create: `lib/env.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `lib/auth/get-session.ts`
- Create: `middleware.ts`
- Create: `app/auth/callback/route.ts`
- Test: `tests/lib/env.test.ts`

- [ ] **Step 1: Write the failing environment parser test**

Create `tests/lib/env.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'

describe('getEnv', () => {
  it('returns the required Supabase variables', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')

    const { getEnv } = await import('@/lib/env')

    expect(getEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key'
    })
  })
})
```

- [ ] **Step 2: Run the env test and confirm it fails**

Run:
```bash
npm test -- env.test.ts
```

Expected: FAIL because `@/lib/env` does not exist.

- [ ] **Step 3: Implement env parsing and Supabase helpers**

Create `.env.example`:
```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Create `lib/env.ts`:
```ts
export function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return { supabaseUrl, supabaseAnonKey }
}
```

Create `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'
import { getEnv } from '@/lib/env'

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnv()

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
```

Create `lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getEnv } from '@/lib/env'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseAnonKey } = getEnv()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      }
    }
  })
}
```

Create `lib/supabase/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/env'

export function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })
  const { supabaseUrl, supabaseAnonKey } = getEnv()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      }
    }
  })

  void supabase.auth.getUser()

  return response
}
```

Create `middleware.ts`:
```ts
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/today/:path*', '/closet/:path*']
}
```

Create `lib/auth/get-session.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getSession() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getSession()
  return data.session
}
```

Create `app/auth/callback/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/today'

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
```

- [ ] **Step 4: Run the env test again**

Run:
```bash
npm test -- env.test.ts
```

Expected: PASS and output includes `1 passed`.

- [ ] **Step 5: Commit the Supabase foundation task**

Run:
```bash
git add .env.example lib/env.ts lib/supabase/server.ts lib/supabase/client.ts lib/supabase/middleware.ts lib/auth/get-session.ts middleware.ts app/auth/callback/route.ts tests/lib/env.test.ts && git commit -m "feat: add Supabase env and auth foundation"
```

Expected: one commit with env parsing, client factories, middleware, and callback route.

## Task 4: Add database schema, types, and profile bootstrap

**Files:**
- Create: `supabase/migrations/20260419_initial_schema.sql`
- Create: `types/database.ts`
- Create: `lib/profiles/ensure-profile.ts`
- Test: none

- [ ] **Step 1: Write the SQL migration**

Create `supabase/migrations/20260419_initial_schema.sql`:
```sql
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  city text,
  style_preferences text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_url text,
  category text not null,
  sub_category text,
  color_category text,
  style_tags text[] not null default '{}',
  season_tags text[] not null default '{}',
  brand text,
  last_worn_date date,
  wear_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  item_ids uuid[] not null default '{}',
  scenario text,
  created_at timestamptz not null default now()
);

create table if not exists public.ootd (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  outfit_id uuid references public.outfits (id) on delete set null,
  photo_url text,
  satisfaction_score integer check (satisfaction_score between 1 and 5),
  worn_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists items_user_id_created_at_idx on public.items (user_id, created_at desc);
create index if not exists outfits_user_id_created_at_idx on public.outfits (user_id, created_at desc);
create index if not exists ootd_user_id_worn_at_idx on public.ootd (user_id, worn_at desc);

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.outfits enable row level security;
alter table public.ootd enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "items_select_own" on public.items for select using (auth.uid() = user_id);
create policy "items_insert_own" on public.items for insert with check (auth.uid() = user_id);
create policy "items_update_own" on public.items for update using (auth.uid() = user_id);
create policy "items_delete_own" on public.items for delete using (auth.uid() = user_id);

create policy "outfits_select_own" on public.outfits for select using (auth.uid() = user_id);
create policy "outfits_insert_own" on public.outfits for insert with check (auth.uid() = user_id);
create policy "outfits_update_own" on public.outfits for update using (auth.uid() = user_id);
create policy "outfits_delete_own" on public.outfits for delete using (auth.uid() = user_id);

create policy "ootd_select_own" on public.ootd for select using (auth.uid() = user_id);
create policy "ootd_insert_own" on public.ootd for insert with check (auth.uid() = user_id);
create policy "ootd_update_own" on public.ootd for update using (auth.uid() = user_id);
create policy "ootd_delete_own" on public.ootd for delete using (auth.uid() = user_id);
```

- [ ] **Step 2: Add the shared database types**

Create `types/database.ts`:
```ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          city: string | null
          style_preferences: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          city?: string | null
          style_preferences?: string[]
        }
        Update: {
          city?: string | null
          style_preferences?: string[]
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          image_url: string | null
          category: string
          sub_category: string | null
          color_category: string | null
          style_tags: string[]
          season_tags: string[]
          brand: string | null
          last_worn_date: string | null
          wear_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          category: string
          image_url?: string | null
          sub_category?: string | null
          color_category?: string | null
          style_tags?: string[]
          season_tags?: string[]
          brand?: string | null
          last_worn_date?: string | null
          wear_count?: number
        }
        Update: Partial<Database['public']['Tables']['items']['Insert']> & {
          updated_at?: string
        }
      }
      outfits: {
        Row: {
          id: string
          user_id: string
          title: string
          item_ids: string[]
          scenario: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          title: string
          item_ids?: string[]
          scenario?: string | null
        }
        Update: {
          title?: string
          item_ids?: string[]
          scenario?: string | null
        }
      }
      ootd: {
        Row: {
          id: string
          user_id: string
          outfit_id: string | null
          photo_url: string | null
          satisfaction_score: number | null
          worn_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          worn_at: string
          outfit_id?: string | null
          photo_url?: string | null
          satisfaction_score?: number | null
          notes?: string | null
        }
        Update: {
          outfit_id?: string | null
          photo_url?: string | null
          satisfaction_score?: number | null
          worn_at?: string
          notes?: string | null
        }
      }
    }
  }
}
```

- [ ] **Step 3: Add the lazy profile bootstrap helper**

Create `lib/profiles/ensure-profile.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function ensureProfile(userId: string) {
  const supabase = await createSupabaseServerClient()

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile) {
    return
  }

  await supabase.from('profiles').insert({ id: userId })
}
```

- [ ] **Step 4: Apply the migration in Supabase and verify the schema exists**

Run:
```bash
supabase db push
```

Expected: output includes all four tables and policies applied successfully.

- [ ] **Step 5: Commit the schema task**

Run:
```bash
git add supabase/migrations/20260419_initial_schema.sql types/database.ts lib/profiles/ensure-profile.ts && git commit -m "feat: add initial wardrobe schema"
```

Expected: one commit containing tables, policies, and shared types.

## Task 5: Build Today and Closet pages with live empty-state data

**Files:**
- Create: `lib/data/get-closet-summary.ts`
- Create: `lib/data/get-today-state.ts`
- Create: `components/today/today-page.tsx`
- Create: `components/closet/closet-page.tsx`
- Modify: `app/page.tsx`
- Create: `app/today/page.tsx`
- Create: `app/closet/page.tsx`
- Test: `tests/components/today-page.test.tsx`
- Test: `tests/components/closet-page.test.tsx`

- [ ] **Step 1: Write the failing Today and Closet component tests**

Create `tests/components/today-page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TodayPage } from '@/components/today/today-page'

describe('TodayPage', () => {
  it('shows the upload prompt when the closet is empty', () => {
    render(<TodayPage itemCount={0} hasProfile={true} />)

    expect(screen.getByText('你的衣橱还是空的')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '去上传衣物' })).toHaveAttribute('href', '/closet')
  })

  it('shows recommendation placeholders when items exist', () => {
    render(<TodayPage itemCount={3} hasProfile={true} />)

    expect(screen.getByText('推荐功能即将接入')).toBeInTheDocument()
    expect(screen.getAllByText('Outfit placeholder')).toHaveLength(3)
  })
})
```

Create `tests/components/closet-page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ClosetPage } from '@/components/closet/closet-page'

describe('ClosetPage', () => {
  it('shows the empty-state CTA when no items exist', () => {
    render(<ClosetPage itemCount={0} />)

    expect(screen.getByText('先把第一件衣物放进来')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '上传入口即将接入' })).toBeInTheDocument()
  })

  it('shows the item count summary when items exist', () => {
    render(<ClosetPage itemCount={8} />)

    expect(screen.getByText('已收录 8 件单品')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run:
```bash
npm test -- today-page.test.tsx closet-page.test.tsx
```

Expected: FAIL because the page components do not exist yet.

- [ ] **Step 3: Implement data queries and page components**

Create `lib/data/get-closet-summary.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getClosetSummary(userId: string) {
  const supabase = await createSupabaseServerClient()
  const { count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return { itemCount: count ?? 0 }
}
```

Create `lib/data/get-today-state.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getTodayState(userId: string) {
  const supabase = await createSupabaseServerClient()

  const [{ data: profile }, { count, error }] = await Promise.all([
    supabase.from('profiles').select('id, city').eq('id', userId).maybeSingle(),
    supabase.from('items').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  ])

  if (error) {
    throw error
  }

  return {
    hasProfile: Boolean(profile),
    city: profile?.city ?? null,
    itemCount: count ?? 0
  }
}
```

Create `components/today/today-page.tsx`:
```tsx
import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PrimaryLink } from '@/components/ui/button'

export function TodayPage({ itemCount, hasProfile }: { itemCount: number; hasProfile: boolean }) {
  return (
    <AppShell title="Today">
      <Card>
        <p className="text-sm text-[var(--color-neutral-dark)]">今天先把基础页面和数据接通。</p>
        <p className="mt-2 text-lg font-medium">{hasProfile ? '欢迎回来' : '正在准备你的个人档案'}</p>
      </Card>

      {itemCount === 0 ? (
        <EmptyState
          title="你的衣橱还是空的"
          description="先上传几件常穿的单品，Tomorrow 才有推荐空间。"
          action={<PrimaryLink href="/closet">去上传衣物</PrimaryLink>}
        />
      ) : (
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-neutral-dark)]">推荐功能即将接入</p>
          {[1, 2, 3].map((slot) => (
            <Card key={slot}>
              <div className="aspect-[3/4] rounded-lg bg-[var(--color-secondary)]" />
              <p className="mt-3 text-sm">Outfit placeholder</p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
```

Create `components/closet/closet-page.tsx`:
```tsx
import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SecondaryButton } from '@/components/ui/button'

export function ClosetPage({ itemCount }: { itemCount: number }) {
  return (
    <AppShell title="Closet">
      <Card>
        <p className="text-sm text-[var(--color-neutral-dark)]">已收录 {itemCount} 件单品</p>
      </Card>

      {itemCount === 0 ? (
        <EmptyState
          title="先把第一件衣物放进来"
          description="下一阶段会把拍照、相册和链接导入都接在这里。"
          action={<SecondaryButton type="button">上传入口即将接入</SecondaryButton>}
        />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: Math.min(itemCount, 6) }).map((_, index) => (
            <div key={index} className="aspect-square rounded-md bg-white shadow-sm" />
          ))}
        </div>
      )}
    </AppShell>
  )
}
```

- [ ] **Step 4: Implement the route files with auth gating**

Replace `app/page.tsx` with:
```tsx
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/landing-page'
import { getSession } from '@/lib/auth/get-session'

export default async function HomePage() {
  const session = await getSession()

  if (session) {
    redirect('/today')
  }

  return <LandingPage />
}
```

Create `app/today/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { TodayPage } from '@/components/today/today-page'
import { getSession } from '@/lib/auth/get-session'
import { getTodayState } from '@/lib/data/get-today-state'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function TodayRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)
  const state = await getTodayState(session.user.id)

  return <TodayPage itemCount={state.itemCount} hasProfile={state.hasProfile} />
}
```

Create `app/closet/page.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { ClosetPage } from '@/components/closet/closet-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetSummary } from '@/lib/data/get-closet-summary'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

export default async function ClosetRoute() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  await ensureProfile(session.user.id)
  const summary = await getClosetSummary(session.user.id)

  return <ClosetPage itemCount={summary.itemCount} />
}
```

- [ ] **Step 5: Run the page component tests again**

Run:
```bash
npm test -- today-page.test.tsx closet-page.test.tsx
```

Expected: PASS and output includes `4 passed`.

- [ ] **Step 6: Run the full test suite**

Run:
```bash
npm test
```

Expected: PASS for landing, shell, env, Today, and Closet tests.

- [ ] **Step 7: Commit the route and data task**

Run:
```bash
git add lib/data/get-closet-summary.ts lib/data/get-today-state.ts components/today/today-page.tsx components/closet/closet-page.tsx app/page.tsx app/today/page.tsx app/closet/page.tsx tests/components/today-page.test.tsx tests/components/closet-page.test.tsx && git commit -m "feat: add authenticated Today and Closet shells"
```

Expected: one commit with protected routes and live empty-state data.

## Task 6: Verify the running app locally and document the setup path

**Files:**
- Modify: `.env.example`
- Modify: `package.json`
- Test: manual browser verification only

- [ ] **Step 1: Add a seed login note to `.env.example` if the team needs it**

Append only if your team shares a dev project:
```dotenv
# Optional local note:
# Create a Supabase project, enable Email auth, and copy the URL + anon key here.
```

- [ ] **Step 2: Start the local app**

Run:
```bash
npm run dev
```

Expected: `Ready in` output and a local URL, usually `http://localhost:3000`.

- [ ] **Step 3: Verify the golden path in the browser**

Check these exact behaviors:
```text
1. Logged out user sees the LandingPage at /
2. Visiting /today while logged out redirects to /
3. After Supabase login, /auth/callback lands on /today
4. /today shows the empty state when the items table is empty
5. /closet shows item count and empty-state CTA when no items exist
6. Refreshing /today keeps the session alive
```

Expected: all six checks behave exactly as listed.

- [ ] **Step 4: Run the production build once**

Run:
```bash
npm run build
```

Expected: PASS and Next.js outputs all three routes without type or build errors.

- [ ] **Step 5: Commit the final foundation verification**

Run:
```bash
git add .env.example package.json package-lock.json && git commit -m "chore: verify local foundation workflow"
```

Expected: final commit for the first development phase.

## Spec Coverage Check

- App shell: covered by Task 1 and Task 2
- Tailwind tokens from `DESIGN.md`: covered by Task 1 and Task 2
- Supabase env, browser/server clients, middleware, callback: covered by Task 3
- Core schema with RLS: covered by Task 4
- `/today` and `/closet` live empty states: covered by Task 5
- Local verification and build confidence: covered by Task 6

## Placeholder Scan

- No `TODO`, `TBD`, or "implement later" placeholders remain in tasks.
- Every code-changing step includes concrete code.
- Every verification step includes exact commands and expected outcomes.

## Type Consistency Check

- `getEnv`, `getSession`, `ensureProfile`, `getTodayState`, and `getClosetSummary` use the same names throughout the plan.
- `TodayPage` takes `{ itemCount, hasProfile }` consistently.
- `ClosetPage` takes `{ itemCount }` consistently.
- Database table names match the approved spec: `profiles`, `items`, `outfits`, `ootd`.
