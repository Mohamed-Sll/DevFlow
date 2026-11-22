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
      <div className="overflow-x-auto border-b border-[var(--border-subtle)]">
        <div className="flex flex-nowrap gap-5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                [
                  'shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition duration-200',
                  isActive
                    ? 'border-[var(--brand)] text-[var(--text-primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
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
