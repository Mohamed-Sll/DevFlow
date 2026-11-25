import type { ReactNode } from 'react'

interface PanelProps {
  actions?: ReactNode
  children?: ReactNode
  className?: string
  description?: string
  id?: string
  icon?: string
  title?: string
}

export function Panel({ actions, children, className, description, id, icon, title }: PanelProps) {
  return (
    <section
      id={id}
      className={[
        'rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5 lg:p-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(title || description || actions) && (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {icon ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] text-sm">
                {icon}
              </span>
            ) : null}
            <div>
              {title ? (
                <h2 className="font-['Manrope',sans-serif] text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div>{children}</div>
    </section>
  )
}
