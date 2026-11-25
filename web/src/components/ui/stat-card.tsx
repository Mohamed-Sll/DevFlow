export function StatCard({
  accent,
  className,
  label,
  subtitle,
  value,
}: {
  accent: string
  className?: string
  label: string
  subtitle?: string
  value: string
}) {
  return (
    <article
      className={[
        'relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: accent }} />
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
        <p className="mt-3 break-words font-['Manrope',sans-serif] text-2xl font-semibold leading-tight tracking-[-0.045em] text-[var(--text-primary)] sm:text-[28px]">
          {value}
        </p>
        {subtitle ? <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
    </article>
  )
}
