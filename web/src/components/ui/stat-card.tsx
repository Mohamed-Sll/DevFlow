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
        'group relative min-w-0 overflow-hidden rounded-[18px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 shadow-none transition duration-200 hover:border-[var(--border-strong)] sm:p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:text-[11px]">{label}</p>
      </div>
      <div className="mt-3">
        <p className="whitespace-nowrap font-mono text-[clamp(1.05rem,1.55vw,1.45rem)] font-semibold leading-none tracking-tight text-[var(--text-primary)]">
          {value}
        </p>
        {subtitle ? <p className="mt-2 min-h-8 text-xs leading-relaxed text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
    </article>
  )
}
