import { NavLink } from 'react-router-dom'

interface PageSectionItem {
  label: string
  to: string
}

export function PageSectionNav({
  helper,
  items,
}: {
  helper?: string
  items: PageSectionItem[]
}) {
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-max flex-nowrap gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                [
                  'shrink-0 rounded-lg px-3 py-2 text-sm font-medium sm:px-4',
                  isActive
                    ? 'bg-[var(--surface-3)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {helper ? <p className="px-1 text-xs leading-relaxed text-[var(--text-muted)]">{helper}</p> : null}
    </div>
  )
}
