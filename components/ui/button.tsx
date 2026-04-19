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
