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
