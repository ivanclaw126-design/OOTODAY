import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

const baseClassName = 'inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium'

export function PrimaryButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${baseClassName} bg-[var(--color-primary)] text-white ${className ?? ''}`.trim()} {...props}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${baseClassName} border border-[var(--color-neutral-mid)] bg-[var(--color-secondary)] text-[var(--color-primary)] ${className ?? ''}`.trim()} {...props}>
      {children}
    </button>
  )
}

export function PrimaryLink({ children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${baseClassName} bg-[var(--color-primary)] text-white ${className ?? ''}`.trim()} {...props}>
      {children as ReactNode}
    </a>
  )
}
