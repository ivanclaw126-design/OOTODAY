export function StatusBanner({ message }: { message: string }) {
  return <div className="rounded-md bg-[var(--color-warning)]/15 px-4 py-3 text-sm text-[var(--color-primary)]">{message}</div>
}
