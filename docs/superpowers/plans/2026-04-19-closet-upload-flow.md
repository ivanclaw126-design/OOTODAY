# Closet Upload Flow Implementation Plan

## Follow-on Execution Status

- [x] Base single-image upload flow shipped
- [x] Closet organizing insights shipped on top of the saved-item view
- [x] Album batch import shipped
- [x] Remote link import shipped
- [x] Remote link import now rehosts images into Supabase Storage before save
- [x] First collage-splitting import shipped with manual 2-4 crop boxes
- [ ] Real browser QA for the latest batch-import, remote-link-import, and collage-splitting flows still needs one clean manual pass

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable `/closet` upload flow so a signed-in user can select one clothing image, upload it to Supabase Storage, get AI-generated metadata suggestions, confirm edits, save a real `items` row, and immediately see the new card in Closet.

**Architecture:** Keep the feature split into five focused units: shared closet types and env parsing, a server-side closet view query, client-side upload UI, a server-side image analysis action, and a server-side save action. The browser uploads directly to a public Storage bucket, then calls server actions for AI analysis and database writes so the user gets a fast flow without mixing unstable AI logic into the final save step.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR/Auth/Storage, Vitest, Testing Library, OpenAI Chat Completions API

---

## File Structure

### Create

- `lib/closet/types.ts` - shared closet item card, AI analysis, and save input types
- `lib/closet/get-closet-view.ts` - server query for count + recent items
- `lib/closet/build-upload-path.ts` - deterministic storage path helper for one uploaded image
- `lib/closet/analyze-item-image.ts` - server helper that calls OpenAI with a public image URL
- `lib/closet/save-closet-item.ts` - server helper that inserts the confirmed item row
- `components/closet/closet-item-card.tsx` - renders one saved item card
- `components/closet/closet-item-grid.tsx` - renders the recent item grid
- `components/closet/closet-upload-form.tsx` - editable confirm-before-save form
- `components/closet/closet-upload-card.tsx` - client upload state machine and browser upload logic
- `app/closet/actions.ts` - server actions for image analysis and item save
- `tests/lib/closet/build-upload-path.test.ts` - path helper unit test
- `tests/lib/closet/analyze-item-image.test.ts` - OpenAI response parsing unit test
- `tests/lib/closet/save-closet-item.test.ts` - item save unit test
- `tests/components/closet-upload-form.test.tsx` - confirm form render + submit test
- `tests/components/closet-upload-card.test.tsx` - upload card analyze flow test

### Modify

- `lib/env.ts` - include the public storage bucket in required env parsing
- `.env.example` - document the new public bucket and OpenAI key requirements
- `app/closet/page.tsx` - fetch closet view and pass server actions + user ID into the page
- `components/closet/closet-page.tsx` - replace placeholder UI with upload card + recent item grid
- `tests/lib/env.test.ts` - assert the public bucket is required
- `tests/components/closet-page.test.tsx` - assert the new Closet page renders upload UI and recent items
- `PROGRESS.md` - mark the upload flow complete after verification

---

## Task 0: Create the implementation worktree

**Files:**
- Create: none
- Modify: none
- Test: none

- [ ] **Step 1: Create a dedicated worktree and feature branch**

Run:
```bash
git worktree add ../OOTODAY-closet-upload -b feat/closet-upload-flow
```

Expected: output includes `Preparing worktree` and creates branch `feat/closet-upload-flow`.

- [ ] **Step 2: Enter the worktree and verify git state**

Run:
```bash
cd ../OOTODAY-closet-upload && git status --short --branch
```

Expected: `## feat/closet-upload-flow` and an empty working tree.

- [ ] **Step 3: Keep the approved spec path in view while implementing**

Use this exact source of truth during execution:
```text
docs/superpowers/specs/2026-04-19-closet-upload-flow-design.md
```

- [ ] **Step 4: Create the first checkpoint commit after the branch is ready**

Run:
```bash
git commit --allow-empty -m "chore: start closet upload flow"
```

Expected: one empty setup commit on `feat/closet-upload-flow`.

## Task 1: Extend env parsing and add shared closet types

**Files:**
- Create: `lib/closet/types.ts`
- Modify: `lib/env.ts`
- Modify: `.env.example`
- Modify: `tests/lib/env.test.ts`
- Test: `tests/lib/env.test.ts`

- [ ] **Step 1: Write the failing env test for the storage bucket**

Replace `tests/lib/env.test.ts` with:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('getEnv', () => {
  it('returns the required public Supabase variables', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    vi.stubEnv('NEXT_PUBLIC_STORAGE_BUCKET', 'ootd-images')

    const { getEnv } = await import('@/lib/env')

    expect(getEnv()).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon-key',
      storageBucket: 'ootd-images'
    })
  })
})
```

- [ ] **Step 2: Run the env test to verify it fails**

Run:
```bash
npm test -- tests/lib/env.test.ts
```

Expected: FAIL because `storageBucket` is missing from `getEnv()`.

- [ ] **Step 3: Implement the public env update and shared closet types**

Replace `lib/env.ts` with:
```ts
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
```

Create `lib/closet/types.ts`:
```ts
export type ClosetItemCardData = {
  id: string
  imageUrl: string | null
  category: string
  subCategory: string | null
  colorCategory: string | null
  styleTags: string[]
  createdAt: string
}

export type ClosetAnalysisResult = {
  category: string
  subCategory: string
  colorCategory: string
  styleTags: string[]
}

export type ClosetAnalysisDraft = ClosetAnalysisResult & {
  imageUrl: string
}
```

Replace `.env.example` with:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STORAGE_BUCKET=
OPENAI_API_KEY=
```

- [ ] **Step 4: Run the env test to verify it passes**

Run:
```bash
npm test -- tests/lib/env.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the env and shared type changes**

Run:
```bash
git add lib/env.ts lib/closet/types.ts .env.example tests/lib/env.test.ts && git commit -m "feat: add closet upload env requirements"
```

Expected: a commit containing the new bucket requirement and closet types.

## Task 2: Query recent closet items and render them on the page

**Files:**
- Create: `lib/closet/get-closet-view.ts`
- Create: `components/closet/closet-item-card.tsx`
- Create: `components/closet/closet-item-grid.tsx`
- Modify: `app/closet/page.tsx`
- Modify: `components/closet/closet-page.tsx`
- Modify: `tests/components/closet-page.test.tsx`
- Test: `tests/components/closet-page.test.tsx`

- [ ] **Step 1: Write the failing Closet page tests for upload entry and recent items**

Replace `tests/components/closet-page.test.tsx` with:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClosetPage } from '@/components/closet/closet-page'

const analyzeUpload = vi.fn()
const saveItem = vi.fn()

describe('ClosetPage', () => {
  it('shows the upload entry when no items exist', () => {
    render(
      <ClosetPage
        userId="user-1"
        itemCount={0}
        items={[]}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        saveItem={saveItem}
      />
    )

    expect(screen.getByText('先把第一件衣物放进来')).toBeInTheDocument()
    expect(screen.getByLabelText('选择衣物图片')).toBeInTheDocument()
  })

  it('shows recent saved items when items exist', () => {
    render(
      <ClosetPage
        userId="user-1"
        itemCount={2}
        items={[
          {
            id: 'item-1',
            imageUrl: 'https://example.com/top.jpg',
            category: '上衣',
            subCategory: '衬衫',
            colorCategory: '蓝色',
            styleTags: ['通勤'],
            createdAt: '2026-04-19T12:00:00Z'
          },
          {
            id: 'item-2',
            imageUrl: null,
            category: '裤装',
            subCategory: '西裤',
            colorCategory: '黑色',
            styleTags: ['极简'],
            createdAt: '2026-04-19T12:05:00Z'
          }
        ]}
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        saveItem={saveItem}
      />
    )

    expect(screen.getByText('已收录 2 件单品')).toBeInTheDocument()
    expect(screen.getByText('上衣')).toBeInTheDocument()
    expect(screen.getByText('裤装')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the Closet page test to verify it fails**

Run:
```bash
npm test -- tests/components/closet-page.test.tsx
```

Expected: FAIL because `ClosetPage` does not accept the new props yet.

- [ ] **Step 3: Implement the closet query, item grid, and page wiring**

Create `lib/closet/get-closet-view.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetItemCardData } from '@/lib/closet/types'

export async function getClosetView(userId: string) {
  const supabase = await createSupabaseServerClient()

  const { count, error: countError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    throw countError
  }

  const { data, error } = await supabase
    .from('items')
    .select('id, image_url, category, sub_category, color_category, style_tags, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  const items: ClosetItemCardData[] = (data ?? []).map((item) => ({
    id: item.id,
    imageUrl: item.image_url,
    category: item.category,
    subCategory: item.sub_category,
    colorCategory: item.color_category,
    styleTags: item.style_tags,
    createdAt: item.created_at
  }))

  return {
    itemCount: count ?? 0,
    items
  }
}
```

Create `components/closet/closet-item-card.tsx`:
```tsx
import type { ClosetItemCardData } from '@/lib/closet/types'

export function ClosetItemCard({ item }: { item: ClosetItemCardData }) {
  const imageAlt = [item.category, item.colorCategory].filter(Boolean).join(' ')

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="aspect-square bg-[var(--color-secondary)]">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-neutral-dark)]">
            暂无图片
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="text-sm font-medium">{item.category}</p>
        {item.subCategory ? <p className="text-xs text-[var(--color-neutral-dark)]">{item.subCategory}</p> : null}
        {item.colorCategory ? <p className="text-xs text-[var(--color-neutral-dark)]">{item.colorCategory}</p> : null}
      </div>
    </article>
  )
}
```

Create `components/closet/closet-item-grid.tsx`:
```tsx
import type { ClosetItemCardData } from '@/lib/closet/types'
import { ClosetItemCard } from '@/components/closet/closet-item-card'

export function ClosetItemGrid({ items }: { items: ClosetItemCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <ClosetItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
```

Replace `app/closet/page.tsx` with:
```tsx
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
```

Replace `components/closet/closet-page.tsx` with:
```tsx
import { AppShell } from '@/components/app-shell'
import { ClosetItemGrid } from '@/components/closet/closet-item-grid'
import { ClosetUploadCard } from '@/components/closet/closet-upload-card'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import type { ClosetAnalysisDraft, ClosetAnalysisResult, ClosetItemCardData } from '@/lib/closet/types'

type ClosetPageProps = {
  userId: string
  itemCount: number
  items: ClosetItemCardData[]
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
}

export function ClosetPage({ userId, itemCount, items, storageBucket, analyzeUpload, saveItem }: ClosetPageProps) {
  return (
    <AppShell title="Closet">
      <ClosetUploadCard
        userId={userId}
        storageBucket={storageBucket}
        analyzeUpload={analyzeUpload}
        saveItem={saveItem}
      />

      <Card>
        <p className="text-sm text-[var(--color-neutral-dark)]">已收录 {itemCount} 件单品</p>
      </Card>

      {itemCount === 0 ? (
        <EmptyState
          title="先把第一件衣物放进来"
          description="上传一张单件衣物图片，AI 会先给你分类建议，再保存进衣橱。"
        />
      ) : (
        <ClosetItemGrid items={items} />
      )}
    </AppShell>
  )
}
```

- [ ] **Step 4: Add a temporary upload card stub so the page compiles**

Create `components/closet/closet-upload-card.tsx` with this temporary implementation:
```tsx
'use client'

import { Card } from '@/components/ui/card'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

type ClosetUploadCardProps = {
  userId: string
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
}

export function ClosetUploadCard({ userId, storageBucket }: ClosetUploadCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">添加衣物</p>
        <p className="text-sm text-[var(--color-neutral-dark)]">上传一张单件衣物图片，AI 会帮你生成分类建议。</p>
        <label className="inline-flex w-fit cursor-pointer rounded-md border border-[var(--color-neutral-mid)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary)]">
          添加衣物
          <input aria-label="选择衣物图片" type="file" accept="image/*" capture="environment" className="sr-only" />
        </label>
        <p className="text-xs text-[var(--color-neutral-dark)]">当前用户：{userId}，bucket：{storageBucket}</p>
      </div>
    </Card>
  )
}
```

- [ ] **Step 5: Run the Closet page test to verify it passes**

Run:
```bash
npm test -- tests/components/closet-page.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the recent item query and page rendering**

Run:
```bash
git add app/closet/page.tsx components/closet/closet-page.tsx components/closet/closet-item-card.tsx components/closet/closet-item-grid.tsx components/closet/closet-upload-card.tsx lib/closet/get-closet-view.ts tests/components/closet-page.test.tsx && git commit -m "feat: render recent closet items"
```

Expected: a commit with the new closet query and item grid.

## Task 3: Build the confirmation form for AI suggestions

**Files:**
- Create: `components/closet/closet-upload-form.tsx`
- Create: `tests/components/closet-upload-form.test.tsx`
- Test: `tests/components/closet-upload-form.test.tsx`

- [ ] **Step 1: Write the failing confirmation form test**

Create `tests/components/closet-upload-form.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'

describe('ClosetUploadForm', () => {
  it('renders AI suggestions and submits edited values', () => {
    const onSubmit = vi.fn()

    render(
      <ClosetUploadForm
        initialDraft={{
          imageUrl: 'https://example.com/shirt.jpg',
          category: '上衣',
          subCategory: '衬衫',
          colorCategory: '蓝色',
          styleTags: ['通勤', '简约']
        }}
        onSubmit={onSubmit}
      />
    )

    fireEvent.change(screen.getByLabelText('分类'), { target: { value: '外套' } })
    fireEvent.change(screen.getByLabelText('风格标签'), { target: { value: '通勤, 极简' } })
    fireEvent.submit(screen.getByRole('button', { name: '保存到衣橱' }).closest('form')!)

    expect(onSubmit).toHaveBeenCalledWith({
      imageUrl: 'https://example.com/shirt.jpg',
      category: '外套',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤', '极简']
    })
  })
})
```

- [ ] **Step 2: Run the confirmation form test to verify it fails**

Run:
```bash
npm test -- tests/components/closet-upload-form.test.tsx
```

Expected: FAIL because `ClosetUploadForm` does not exist yet.

- [ ] **Step 3: Implement the confirmation form**

Create `components/closet/closet-upload-form.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { PrimaryButton } from '@/components/ui/button'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'

type ClosetUploadFormProps = {
  initialDraft: ClosetAnalysisDraft
  disabled?: boolean
  onSubmit: (draft: ClosetAnalysisDraft) => void | Promise<void>
}

export function ClosetUploadForm({ initialDraft, disabled = false, onSubmit }: ClosetUploadFormProps) {
  const [draft, setDraft] = useState(initialDraft)
  const [styleTagsText, setStyleTagsText] = useState(initialDraft.styleTags.join(', '))

  useEffect(() => {
    setDraft(initialDraft)
    setStyleTagsText(initialDraft.styleTags.join(', '))
  }, [initialDraft])

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit({
          ...draft,
          styleTags: styleTagsText
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        })
      }}
    >
      <img src={draft.imageUrl} alt="衣物预览" className="aspect-square w-full rounded-lg object-cover" />

      <label className="flex flex-col gap-1 text-sm">
        <span>分类</span>
        <input
          aria-label="分类"
          value={draft.category}
          onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>子分类</span>
        <input
          aria-label="子分类"
          value={draft.subCategory}
          onChange={(event) => setDraft((current) => ({ ...current, subCategory: event.target.value }))}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>颜色</span>
        <input
          aria-label="颜色"
          value={draft.colorCategory}
          onChange={(event) => setDraft((current) => ({ ...current, colorCategory: event.target.value }))}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>风格标签</span>
        <input
          aria-label="风格标签"
          value={styleTagsText}
          onChange={(event) => setStyleTagsText(event.target.value)}
          className="rounded-md border border-[var(--color-neutral-mid)] px-3 py-2"
        />
      </label>

      <PrimaryButton type="submit" disabled={disabled}>
        保存到衣橱
      </PrimaryButton>
    </form>
  )
}
```

- [ ] **Step 4: Run the confirmation form test to verify it passes**

Run:
```bash
npm test -- tests/components/closet-upload-form.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the confirmation form**

Run:
```bash
git add components/closet/closet-upload-form.tsx tests/components/closet-upload-form.test.tsx && git commit -m "feat: add closet upload confirmation form"
```

Expected: a commit with the confirmation form UI.

## Task 4: Add the upload path helper and the client upload state machine

**Files:**
- Create: `lib/closet/build-upload-path.ts`
- Create: `tests/lib/closet/build-upload-path.test.ts`
- Create: `tests/components/closet-upload-card.test.tsx`
- Modify: `components/closet/closet-upload-card.tsx`
- Test: `tests/lib/closet/build-upload-path.test.ts`
- Test: `tests/components/closet-upload-card.test.tsx`

- [ ] **Step 1: Write the failing helper and upload card tests**

Create `tests/lib/closet/build-upload-path.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'

describe('buildClosetUploadPath', () => {
  it('keeps the file extension and nests under the user id', () => {
    expect(buildClosetUploadPath('user-1', 'shirt.PNG', 'fixed-id')).toBe('user-1/fixed-id.png')
  })
})
```

Create `tests/components/closet-upload-card.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ClosetUploadCard } from '@/components/closet/closet-upload-card'

const upload = vi.fn().mockResolvedValue({ error: null })
const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://example.com/user-1/shirt.jpg' } }))
const refresh = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => ({
    storage: {
      from: () => ({
        upload,
        getPublicUrl
      })
    }
  })
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh })
}))

describe('ClosetUploadCard', () => {
  it('uploads one file and shows the AI confirmation form', async () => {
    const analyzeUpload = vi.fn().mockResolvedValue({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤']
    })

    render(
      <ClosetUploadCard
        userId="user-1"
        storageBucket="ootd-images"
        analyzeUpload={analyzeUpload}
        saveItem={vi.fn()}
      />
    )

    const file = new File(['fake-image'], 'shirt.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('选择衣物图片'), { target: { files: [file] } })

    expect(await screen.findByText('AI 正在分析图片')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('上衣')).toBeInTheDocument()
    expect(analyzeUpload).toHaveBeenCalledWith({ imageUrl: 'https://example.com/user-1/shirt.jpg' })
  })
})
```

- [ ] **Step 2: Run the helper and upload card tests to verify they fail**

Run:
```bash
npm test -- tests/lib/closet/build-upload-path.test.ts tests/components/closet-upload-card.test.tsx
```

Expected: FAIL because the helper and full upload card logic are not implemented yet.

- [ ] **Step 3: Implement the upload path helper**

Create `lib/closet/build-upload-path.ts`:
```ts
export function buildClosetUploadPath(userId: string, fileName: string, randomId = crypto.randomUUID()) {
  const extension = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : 'jpg'
  return `${userId}/${randomId}.${extension}`
}
```

- [ ] **Step 4: Replace the upload card stub with the full client state machine**

Replace `components/closet/closet-upload-card.tsx` with:
```tsx
'use client'

import { ChangeEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClosetUploadForm } from '@/components/closet/closet-upload-form'
import { Card } from '@/components/ui/card'
import { SecondaryButton } from '@/components/ui/button'
import { buildClosetUploadPath } from '@/lib/closet/build-upload-path'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

type Phase = 'idle' | 'preview' | 'analyzing' | 'confirming'

type ClosetUploadCardProps = {
  userId: string
  storageBucket: string
  analyzeUpload: (input: { imageUrl: string }) => Promise<ClosetAnalysisResult>
  saveItem: (draft: ClosetAnalysisDraft) => Promise<void>
}

export function ClosetUploadCard({ userId, storageBucket, analyzeUpload, saveItem }: ClosetUploadCardProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [draft, setDraft] = useState<ClosetAnalysisDraft | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const startUploadAndAnalyze = async (file: File, nextPreviewUrl: string) => {
    setPhase('analyzing')
    setErrorMessage(null)

    const path = buildClosetUploadPath(userId, file.name)
    const { error } = await supabase.storage.from(storageBucket).upload(path, file)

    if (error) {
      setPhase('preview')
      setErrorMessage('图片上传失败，请重试')
      return
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(path)

    try {
      const analysis = await analyzeUpload({ imageUrl: data.publicUrl })
      setDraft({ imageUrl: data.publicUrl, ...analysis })
      setPhase('confirming')
    } catch {
      setPhase('preview')
      setErrorMessage('AI 分析失败，请重试')
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(nextPreviewUrl)
    setDraft(null)
    setErrorMessage(null)
    setPhase('preview')
    void startUploadAndAnalyze(file, nextPreviewUrl)
  }

  const handleRetry = () => {
    if (!selectedFile || !previewUrl) {
      return
    }

    void startUploadAndAnalyze(selectedFile, previewUrl)
  }

  const handleSave = async (nextDraft: ClosetAnalysisDraft) => {
    setIsSaving(true)
    setErrorMessage(null)

    try {
      await saveItem(nextDraft)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setSelectedFile(null)
      setPreviewUrl(null)
      setDraft(null)
      setPhase('idle')
      router.refresh()
    } catch {
      setErrorMessage('保存失败，请稍后再试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">添加衣物</p>
            <p className="text-sm text-[var(--color-neutral-dark)]">上传一张单件衣物图片，AI 会先给你分类建议。</p>
          </div>
          <label className="inline-flex cursor-pointer rounded-md border border-[var(--color-neutral-mid)] px-4 py-2.5 text-sm font-medium text-[var(--color-primary)]">
            选择图片
            <input
              aria-label="选择衣物图片"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {previewUrl ? <img src={previewUrl} alt="本地预览" className="aspect-square w-full rounded-lg object-cover" /> : null}

        {phase === 'analyzing' ? <p className="text-sm">AI 正在分析图片</p> : null}

        {phase === 'confirming' && draft ? (
          <ClosetUploadForm initialDraft={draft} disabled={isSaving} onSubmit={handleSave} />
        ) : null}

        {phase === 'preview' && errorMessage ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-600">{errorMessage}</p>
            <SecondaryButton type="button" onClick={handleRetry}>
              重试分析
            </SecondaryButton>
          </div>
        ) : null}

        {phase !== 'preview' && errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>
    </Card>
  )
}
```

- [ ] **Step 5: Run the helper and upload card tests to verify they pass**

Run:
```bash
npm test -- tests/lib/closet/build-upload-path.test.ts tests/components/closet-upload-card.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the upload state machine**

Run:
```bash
git add lib/closet/build-upload-path.ts tests/lib/closet/build-upload-path.test.ts components/closet/closet-upload-card.tsx tests/components/closet-upload-card.test.tsx && git commit -m "feat: add closet upload client flow"
```

Expected: a commit with direct browser upload and client state handling.

## Task 5: Add the server-side image analysis action

**Files:**
- Create: `lib/closet/analyze-item-image.ts`
- Create: `tests/lib/closet/analyze-item-image.test.ts`
- Create: `app/closet/actions.ts`
- Test: `tests/lib/closet/analyze-item-image.test.ts`

- [ ] **Step 1: Write the failing image analysis helper test**

Create `tests/lib/closet/analyze-item-image.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('analyzeItemImage', () => {
  it('maps the model JSON into the closet analysis shape', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: '上衣',
                sub_category: '衬衫',
                color_category: '蓝色',
                style_tags: ['通勤', '简约']
              })
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const { analyzeItemImage } = await import('@/lib/closet/analyze-item-image')

    await expect(analyzeItemImage('https://example.com/shirt.jpg')).resolves.toEqual({
      category: '上衣',
      subCategory: '衬衫',
      colorCategory: '蓝色',
      styleTags: ['通勤', '简约']
    })
  })
})
```

- [ ] **Step 2: Run the image analysis test to verify it fails**

Run:
```bash
npm test -- tests/lib/closet/analyze-item-image.test.ts
```

Expected: FAIL because `analyze-item-image.ts` does not exist yet.

- [ ] **Step 3: Implement the image analysis helper and analysis action**

Create `lib/closet/analyze-item-image.ts`:
```ts
import type { ClosetAnalysisResult } from '@/lib/closet/types'

function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  return apiKey
}

export async function analyzeItemImage(imageUrl: string): Promise<ClosetAnalysisResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getOpenAiApiKey()}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是衣橱助手。用户上传的是单件衣物图片。只返回 JSON，字段必须是 category、sub_category、color_category、style_tags。style_tags 必须是字符串数组。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请识别这张单件衣物图片，给出最自然的分类、子分类、主颜色和最多 5 个风格标签。'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error('OpenAI request failed')
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null
      }
    }>
  }

  const content = payload.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('OpenAI returned empty content')
  }

  const parsed = JSON.parse(content) as {
    category: string
    sub_category: string
    color_category: string
    style_tags: string[]
  }

  return {
    category: parsed.category.trim(),
    subCategory: parsed.sub_category.trim(),
    colorCategory: parsed.color_category.trim(),
    styleTags: parsed.style_tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 5)
  }
}
```

Create `app/closet/actions.ts`:
```ts
'use server'

import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import type { ClosetAnalysisResult } from '@/lib/closet/types'

export async function analyzeClosetUploadAction({ imageUrl }: { imageUrl: string }): Promise<ClosetAnalysisResult> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  return analyzeItemImage(imageUrl)
}
```

- [ ] **Step 4: Run the image analysis test to verify it passes**

Run:
```bash
npm test -- tests/lib/closet/analyze-item-image.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the server analysis action**

Run:
```bash
git add lib/closet/analyze-item-image.ts app/closet/actions.ts tests/lib/closet/analyze-item-image.test.ts && git commit -m "feat: analyze closet uploads with ai"
```

Expected: a commit containing the OpenAI helper and analysis action.

## Task 6: Save confirmed items and wire the real server actions into Closet

**Files:**
- Create: `lib/closet/save-closet-item.ts`
- Create: `tests/lib/closet/save-closet-item.test.ts`
- Modify: `app/closet/actions.ts`
- Modify: `app/closet/page.tsx`
- Modify: `components/closet/closet-page.tsx`
- Test: `tests/lib/closet/save-closet-item.test.ts`
- Test: `tests/components/closet-page.test.tsx`
- Test: `tests/components/closet-upload-card.test.tsx`

- [ ] **Step 1: Write the failing item save helper test**

Create `tests/lib/closet/save-closet-item.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'

const single = vi.fn().mockResolvedValue({ data: { id: 'item-1' }, error: null })
const select = vi.fn(() => ({ single }))
const insert = vi.fn(() => ({ select }))
const from = vi.fn(() => ({ insert }))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from })
}))

describe('saveClosetItem', () => {
  it('writes the confirmed draft into items', async () => {
    const { saveClosetItem } = await import('@/lib/closet/save-closet-item')

    await expect(
      saveClosetItem({
        userId: 'user-1',
        imageUrl: 'https://example.com/shirt.jpg',
        category: '上衣',
        subCategory: '衬衫',
        colorCategory: '蓝色',
        styleTags: ['通勤']
      })
    ).resolves.toEqual({ id: 'item-1' })

    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      image_url: 'https://example.com/shirt.jpg',
      category: '上衣',
      sub_category: '衬衫',
      color_category: '蓝色',
      style_tags: ['通勤']
    })
  })
})
```

- [ ] **Step 2: Run the item save test to verify it fails**

Run:
```bash
npm test -- tests/lib/closet/save-closet-item.test.ts
```

Expected: FAIL because `save-closet-item.ts` does not exist yet.

- [ ] **Step 3: Implement the save helper and the save action**

Create `lib/closet/save-closet-item.ts`:
```ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'

type SaveClosetItemInput = ClosetAnalysisDraft & {
  userId: string
}

export async function saveClosetItem(input: SaveClosetItemInput) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('items')
    .insert({
      user_id: input.userId,
      image_url: input.imageUrl,
      category: input.category,
      sub_category: input.subCategory,
      color_category: input.colorCategory,
      style_tags: input.styleTags
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data
}
```

Replace `app/closet/actions.ts` with:
```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/get-session'
import { analyzeItemImage } from '@/lib/closet/analyze-item-image'
import { saveClosetItem } from '@/lib/closet/save-closet-item'
import type { ClosetAnalysisDraft, ClosetAnalysisResult } from '@/lib/closet/types'

export async function analyzeClosetUploadAction({ imageUrl }: { imageUrl: string }): Promise<ClosetAnalysisResult> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  return analyzeItemImage(imageUrl)
}

export async function saveClosetItemAction(draft: ClosetAnalysisDraft) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  await saveClosetItem({
    userId: session.user.id,
    imageUrl: draft.imageUrl,
    category: draft.category,
    subCategory: draft.subCategory,
    colorCategory: draft.colorCategory,
    styleTags: draft.styleTags
  })

  revalidatePath('/closet')
}
```

- [ ] **Step 4: Wire the real server actions into the Closet route**

Replace `app/closet/page.tsx` with:
```tsx
import { redirect } from 'next/navigation'
import { analyzeClosetUploadAction, saveClosetItemAction } from '@/app/closet/actions'
import { ClosetPage } from '@/components/closet/closet-page'
import { getSession } from '@/lib/auth/get-session'
import { getClosetView } from '@/lib/closet/get-closet-view'
import { getEnv } from '@/lib/env'
import { ensureProfile } from '@/lib/profiles/ensure-profile'

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
      analyzeUpload={analyzeClosetUploadAction}
      saveItem={saveClosetItemAction}
    />
  )
}
```

- [ ] **Step 5: Run the save and page tests to verify they pass**

Run:
```bash
npm test -- tests/lib/closet/save-closet-item.test.ts tests/components/closet-page.test.tsx tests/components/closet-upload-card.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the save action wiring**

Run:
```bash
git add lib/closet/save-closet-item.ts app/closet/actions.ts app/closet/page.tsx tests/lib/closet/save-closet-item.test.ts && git commit -m "feat: save confirmed closet items"
```

Expected: a commit with the final server-side persistence path.

## Task 7: Run full verification, QA the UI, and update progress

**Files:**
- Modify: `PROGRESS.md`
- Test: `tests/lib/env.test.ts`
- Test: `tests/components/closet-page.test.tsx`
- Test: `tests/components/closet-upload-form.test.tsx`
- Test: `tests/components/closet-upload-card.test.tsx`
- Test: `tests/lib/closet/build-upload-path.test.ts`
- Test: `tests/lib/closet/analyze-item-image.test.ts`
- Test: `tests/lib/closet/save-closet-item.test.ts`

- [ ] **Step 1: Run the focused automated test suite**

Run:
```bash
npm test -- tests/lib/env.test.ts tests/components/closet-page.test.tsx tests/components/closet-upload-form.test.tsx tests/components/closet-upload-card.test.tsx tests/lib/closet/build-upload-path.test.ts tests/lib/closet/analyze-item-image.test.ts tests/lib/closet/save-closet-item.test.ts
```

Expected: PASS for all listed tests.

- [ ] **Step 2: Run a production build**

Run:
```bash
npm run build
```

Expected: PASS with the `/closet` route included in the build output.

- [ ] **Step 3: Start the app and QA the real browser flow**

Run:
```bash
npm run dev
```

Expected: local dev server starts on `http://localhost:3000`.

Then verify the golden path in a browser:
1. Log in.
2. Open `http://localhost:3000/closet`.
3. Choose one clothing image.
4. Confirm the local preview appears.
5. Confirm the page shows `AI 正在分析图片`.
6. Confirm the AI form appears with editable values.
7. Change at least one field.
8. Save the item.
9. Confirm the new card appears in the recent grid after refresh.

Also verify one failure path by temporarily forcing `analyzeClosetUploadAction` to throw and confirming the UI shows `AI 分析失败，请重试`.

- [ ] **Step 4: Update `PROGRESS.md` after the feature is verified**

Apply these edits to `PROGRESS.md`:

1. Update the `最后更新` time.
2. Under `下一步计划`, rewrite `选项 A：衣橱上传流（推荐）` so it becomes a completed summary instead of future tense.
3. Add one bullet under that section with the exact shipped scope:
```md
- 已完成：单件衣物图片上传、Storage 直传、AI 分类建议、用户确认后写入 `items`、Closet 最近衣物展示
```
4. Add one bullet for the deferred work:
```md
- 后续迭代：图片压缩、上传进度与失败重试、多图上传
```

- [ ] **Step 5: Commit the verified feature and progress update**

Run:
```bash
git add PROGRESS.md && git commit -m "docs: update progress for closet upload flow"
```

Expected: the final commit on the branch records the verified feature state.

- [ ] **Step 6: Request review before landing**

Use `superpowers:requesting-code-review` or your preferred review workflow before any merge or ship step.

---

## Self-Review Notes

- **Spec coverage:** The plan covers all MVP requirements from the spec: upload entry, local preview, direct Storage upload, server-side AI analysis, editable confirm form, item save, recent item grid, three failure messages, tests, and manual UI verification.
- **Placeholder scan:** No `TODO`, `TBD`, or “write tests later” placeholders remain. Every task includes exact file paths, commands, and code.
- **Type consistency:** The same `ClosetAnalysisResult`, `ClosetAnalysisDraft`, and `ClosetItemCardData` shapes are used throughout the plan. `subCategory` and `colorCategory` stay camelCase in UI code and are mapped to snake_case only at the database edge.
