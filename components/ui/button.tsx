import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

const baseClassName =
  'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold tracking-[0.02em] shadow-[0_10px_24px_rgba(0,0,0,0.06)]'

export function PrimaryButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${baseClassName} bg-[var(--color-primary)] text-white hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.12)] disabled:translate-y-0 disabled:opacity-55 ${className ?? ''}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${baseClassName} border border-[var(--color-line)] bg-[rgba(255,255,255,0.72)] text-[var(--color-primary)] hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:opacity-55 ${className ?? ''}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export function PrimaryLink({ children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`${baseClassName} bg-[var(--color-primary)] text-white hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.12)] ${className ?? ''}`.trim()}
      {...props}
    >
      {children as ReactNode}
    </a>
  )
}
