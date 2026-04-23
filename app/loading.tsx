export default function GlobalLoading() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f5ee_0%,#fafafa_38%,#f4efe6_100%)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pb-20 pt-8 sm:px-6">
        <div className="space-y-3">
          <div className="h-3 w-20 animate-pulse rounded-full bg-black/8" />
          <div className="h-10 w-40 animate-pulse rounded-2xl bg-black/10" />
        </div>
        <div className="h-36 animate-pulse rounded-[1.5rem] bg-white/75 shadow-[0_14px_34px_rgba(26,26,26,0.06)]" />
        <div className="grid gap-4">
          <div className="h-48 animate-pulse rounded-[1.5rem] bg-white/78 shadow-[0_14px_34px_rgba(26,26,26,0.06)]" />
          <div className="h-48 animate-pulse rounded-[1.5rem] bg-white/78 shadow-[0_14px_34px_rgba(26,26,26,0.06)]" />
        </div>
      </div>
    </main>
  )
}
