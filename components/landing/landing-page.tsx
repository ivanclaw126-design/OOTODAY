import { FeedbackLink } from '@/components/beta/feedback-link'
import { OnboardingChecklist } from '@/components/beta/onboarding-checklist'
import { PageViewTracker } from '@/components/beta/page-view-tracker'

function getAuthErrorMessage(authError: string | null) {
  if (!authError) {
    return null
  }

  const messages: Record<string, string> = {
    magic_link_missing_email: '请先输入邮箱地址，再发送登录链接。',
    magic_link_invalid_email: '这个邮箱格式看起来不对，请检查后再试。',
    magic_link_rate_limited: '刚刚发得有点频繁，稍等一会儿再试。',
    magic_link_email_provider_failed: '登录邮件没有成功发出去，像是邮件服务端出了问题。',
    magic_link_failed: '登录链接发送失败，请稍后再试。',
    missing_credentials: '请输入邮箱和密码后再登录。',
    invalid_credentials: '默认密码登录失败。如果你已经改过密码，请展开“使用其他密码”后再登录；如果这是第一次使用，请先用邮箱链接激活账号。',
    custom_password_required: '这个账号已经改过密码了，请展开“使用其他密码”后输入你自己的密码登录。',
    password_bootstrap_failed: '邮箱登录成功了，但默认密码初始化失败。请再用 magic link 进一次，或联系我处理。'
  }

  return messages[authError] ?? '登录失败，请稍后再试。'
}

export function LandingPage({ magicLinkSent, authError }: { magicLinkSent: boolean; authError: string | null }) {
  const authErrorMessage = getAuthErrorMessage(authError)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f0e7_0%,#f7f3eb_38%,#efe8dd_100%)] px-4 py-6 text-[var(--color-primary)] sm:px-6 sm:py-8">
      <PageViewTracker event="landing_viewed" surface="landing" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between overflow-hidden rounded-[2.4rem] border border-[var(--color-line)] bg-white/72 shadow-[var(--shadow-strong)] backdrop-blur md:min-h-[calc(100vh-4rem)]">
        <div className="grid flex-1 gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <section className="order-2 min-w-0 flex flex-col justify-between border-b border-[var(--color-line)] p-6 sm:p-8 md:order-1 md:border-b-0 md:border-r md:p-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">AI wardrobe desk</p>
                  <span className="rounded-full border border-[var(--color-line)] bg-[rgba(231,255,55,0.18)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    朋友内测中
                  </span>
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-3xl text-5xl leading-none font-semibold tracking-[-0.07em] sm:text-7xl">
                    OOTODAY
                  </h1>
                  <p className="max-w-xl text-2xl leading-tight tracking-[-0.04em] text-[var(--color-primary)] sm:text-4xl">
                    把衣橱先导进来，今天穿什么才会开始变简单。
                  </p>
                </div>
                <p className="max-w-2xl text-base leading-8 text-[var(--color-neutral-dark)] sm:text-lg">
                  先导入几件你真的会穿的衣服，再把天气、场景和反馈接上去。你会很快看到 Today 推荐、旅行打包和衣橱整理建议开始变得具体。
                </p>
              </div>

              <OnboardingChecklist />
            </div>

            <div className="mt-8 grid gap-3 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-neutral-dark)] sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-primary)]">Closet</p>
                <p className="mt-2 leading-6">本地图片、商品链接、拼图拆分都能导入。</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-primary)]">Today</p>
                <p className="mt-2 leading-6">根据天气和你现有衣橱给出真实可穿的建议。</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-primary)]">Travel</p>
                <p className="mt-2 leading-6">最近要出门时，直接从衣橱里整理出打包清单。</p>
              </div>
            </div>
          </section>

          <section className="order-1 relative min-w-0 flex items-center bg-[linear-gradient(180deg,rgba(231,255,55,0.08)_0%,rgba(255,255,255,0)_55%),linear-gradient(140deg,#fdfcf8_0%,#f4efe5_100%)] p-6 sm:p-8 md:order-2 md:p-12">
            <div className="absolute inset-x-6 top-6 h-px bg-[linear-gradient(90deg,rgba(26,26,26,0.04),rgba(26,26,26,0.16),rgba(26,26,26,0.04))] md:inset-x-12 md:top-12" />
            <div className="relative min-w-0 w-full rounded-[2rem] border border-[var(--color-line)] bg-white/94 p-5 text-[var(--color-primary)] shadow-[var(--shadow-soft)] sm:p-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-neutral-dark)]">Start here</p>
                <h2 className="text-3xl leading-tight font-semibold tracking-[-0.05em]">先拿到登录链接</h2>
                <p className="break-words text-sm leading-7 text-[var(--color-neutral-dark)] sm:text-base">
                  现在是小范围内测。第一次建议先用邮箱链接进来，系统会同时给这个账号启用默认密码 `123456`，后面你就可以直接用邮箱和密码登录，再去 Today 里改掉它。
                </p>
              </div>

              <form action="/auth/login" method="post" className="mt-8 flex min-w-0 flex-col gap-4">
                <label className="flex min-w-0 w-full flex-col gap-2 text-sm font-medium">
                  <span>邮箱地址</span>
                  <input
                    aria-label="邮箱地址"
                    className="min-h-12 w-full min-w-0 rounded-2xl border border-[var(--color-neutral-mid)] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[var(--color-neutral-dark)]/50 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
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

              <div className="mt-5 rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-secondary)]/50 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--color-primary)]">邮箱 + 密码登录</p>
                  <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">
                    第一次先用上面的 magic link 激活。激活后这里默认会直接使用 `123456` 登录，你不用再手动输入；如果后面改过密码，再展开下面自己填写。
                  </p>
                </div>

                <form action="/auth/password-login" method="post" className="mt-4 flex min-w-0 flex-col gap-3">
                  <label className="flex min-w-0 w-full flex-col gap-2 text-sm font-medium">
                    <span>邮箱地址</span>
                    <input
                      aria-label="登录邮箱地址"
                      className="min-h-12 w-full min-w-0 rounded-2xl border border-[var(--color-neutral-mid)] bg-white px-4 py-3 text-base outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
                      name="email"
                      placeholder="you@example.com"
                      type="email"
                      required
                    />
                  </label>
                  <details className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-neutral-dark)]">
                    <summary className="cursor-pointer list-none font-medium text-[var(--color-primary)]">
                      使用其他密码
                    </summary>
                    <div className="mt-3">
                      <label className="flex min-w-0 w-full flex-col gap-2 text-sm font-medium">
                        <span>密码</span>
                        <input
                          aria-label="登录密码"
                          className="min-h-12 w-full min-w-0 rounded-2xl border border-[var(--color-neutral-mid)] bg-white px-4 py-3 text-base outline-none transition placeholder:text-[var(--color-neutral-dark)]/50 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
                          name="password"
                          placeholder="如果你已经改过密码，再在这里输入"
                          type="password"
                        />
                      </label>
                    </div>
                  </details>
                  <button
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[var(--color-neutral-mid)] bg-white px-5 py-3 text-base font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-secondary)]"
                    type="submit"
                  >
                    邮箱密码登录
                  </button>
                </form>
              </div>

              <div className="mt-6 w-full min-w-0 rounded-[1.5rem] bg-[var(--color-secondary)]/50 p-4 text-sm leading-6 text-[var(--color-neutral-dark)]">
                <p className="font-medium text-[var(--color-primary)]">你进来之后会先做什么</p>
                <p className="mt-2 break-words">先把几件常穿衣服导进 Closet，再去 Today 看推荐。如果最近要出门，也可以顺手试 Travel。</p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.3rem] border border-[var(--color-line)] bg-white/75 px-4 py-3 text-sm text-[var(--color-neutral-dark)]">
                <p>内测期间任何卡点都可以直接发我，最好顺手带上当前页面和截图。</p>
                <FeedbackLink
                  surface="landing"
                  label="发送反馈"
                  className="inline-flex shrink-0 rounded-full bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
                />
              </div>

              {magicLinkSent ? (
                <p className="mt-4 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/8 px-4 py-3 text-sm text-[var(--color-accent)]">
                  登录链接已发送，请检查邮箱。第一次点进去后，系统会同时给这个账号启用默认密码 `123456`，之后这里直接点“邮箱密码登录”就行。
                </p>
              ) : null}

              {authErrorMessage ? (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {authErrorMessage}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
