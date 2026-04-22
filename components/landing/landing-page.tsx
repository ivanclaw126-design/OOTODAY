export function LandingPage({ magicLinkSent }: { magicLinkSent: boolean }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f4ee_0%,#fafafa_45%,#f3efe7_100%)] px-4 py-6 text-[var(--color-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between overflow-hidden rounded-[2rem] border border-black/8 bg-white/75 shadow-[0_24px_80px_rgba(26,26,26,0.08)] backdrop-blur md:min-h-[calc(100vh-4rem)]">
        <div className="grid flex-1 gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <section className="order-2 flex flex-col justify-between border-b border-black/8 p-6 sm:p-8 md:order-1 md:border-b-0 md:border-r md:p-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--color-accent)]">AI wardrobe desk</p>
                  <span className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
                    朋友内测中
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-5xl leading-none font-semibold tracking-[-0.04em] sm:text-6xl">
                    OOTODAY
                  </h1>
                  <p className="max-w-xl text-2xl leading-tight text-[var(--color-primary)] sm:text-3xl">
                    把衣橱先导进来，今天穿什么才会开始变简单。
                  </p>
                </div>
                <p className="max-w-2xl text-base leading-8 text-[var(--color-neutral-dark)] sm:text-lg">
                  先导入几件你真的会穿的衣服，再把天气、场景和反馈接上去。你会很快看到 Today 推荐、旅行打包和衣橱整理建议开始变得具体。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['01', '导入 3-5 件常穿衣服'],
                  ['02', '去 Today 看当天推荐'],
                  ['03', '记一次反馈，越用越像你']
                ].map(([step, label]) => (
                  <div key={step} className="rounded-[1.5rem] border border-black/8 bg-[#fcfaf6] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <p className="text-xs font-medium tracking-[0.18em] text-[var(--color-accent)]">{step}</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-primary)]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-3 border-t border-black/8 pt-6 text-sm text-[var(--color-neutral-dark)] sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">Closet</p>
                <p className="mt-2 leading-6">本地图片、商品链接、拼图拆分都能导入。</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">Today</p>
                <p className="mt-2 leading-6">根据天气和你现有衣橱给出真实可穿的建议。</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">Travel</p>
                <p className="mt-2 leading-6">最近要出门时，直接从衣橱里整理出打包清单。</p>
              </div>
            </div>
          </section>

          <section className="order-1 relative flex items-center bg-[linear-gradient(180deg,rgba(59,130,246,0.06)_0%,rgba(255,255,255,0)_55%),linear-gradient(140deg,#fdfcf8_0%,#f4efe5_100%)] p-6 sm:p-8 md:order-2 md:p-12">
            <div className="absolute inset-x-6 top-6 h-px bg-[linear-gradient(90deg,rgba(26,26,26,0.04),rgba(26,26,26,0.16),rgba(26,26,26,0.04))] md:inset-x-12 md:top-12" />
            <div className="relative w-full rounded-[2rem] border border-black/8 bg-white p-5 shadow-[0_24px_60px_rgba(26,26,26,0.10)] sm:p-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent)]">Start here</p>
                <h2 className="text-3xl leading-tight font-semibold tracking-[-0.03em]">先拿到登录链接</h2>
                <p className="text-sm leading-7 text-[var(--color-neutral-dark)] sm:text-base">
                  现在是小范围内测。登录后先去导入衣物，导完第一批就能看到 Today 的真实推荐。
                </p>
              </div>

              <form action="/auth/login" className="mt-8 flex flex-col gap-4">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  <span>邮箱地址</span>
                  <input
                    aria-label="邮箱地址"
                    className="min-h-12 rounded-2xl border border-[var(--color-neutral-mid)] bg-[#fcfcfb] px-4 py-3 text-base outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
                    name="email"
                    placeholder="you@example.com"
                    type="email"
                    required
                  />
                </label>
                <button
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-base font-medium text-white transition hover:opacity-92"
                  type="submit"
                >
                  发送登录链接
                </button>
              </form>

              <div className="mt-6 rounded-[1.5rem] bg-[#f6f3eb] p-4 text-sm leading-6 text-[var(--color-neutral-dark)]">
                <p className="font-medium text-[var(--color-primary)]">你进来之后会先做什么</p>
                <p className="mt-2">先把几件常穿衣服导进 Closet，再去 Today 看推荐。如果最近要出门，也可以顺手试 Travel。</p>
              </div>

              {magicLinkSent ? (
                <p className="mt-4 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 px-4 py-3 text-sm text-[var(--color-accent)]">
                  登录链接已发送，请检查邮箱。
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
