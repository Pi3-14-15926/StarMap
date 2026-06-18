import { Fragment } from 'react'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: string
}

export function Breadcrumb({ items, separator = '/' }: BreadcrumbProps) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        padding: 'var(--spacing-sm) 0',
      }}
    >
      {items.map((item, idx) => (
        <Fragment key={idx}>
          {idx > 0 && (
            <span style={{ color: 'var(--color-text-quaternary)' }}>{separator}</span>
          )}
          <button
            onClick={item.onClick}
            style={{
              color: idx === items.length - 1 ? 'var(--color-text)' : 'var(--color-text-secondary)',
              fontWeight: idx === items.length - 1 ? 500 : 400,
              fontSize: 'var(--font-size-sm)',
              transition: 'color var(--transition-fast)',
              cursor: item.onClick ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              if (item.onClick) e.currentTarget.style.color = 'var(--color-primary)'
            }}
            onMouseLeave={(e) => {
              if (item.onClick) {
                e.currentTarget.style.color = idx === items.length - 1 ? 'var(--color-text)' : 'var(--color-text-secondary)'
              }
            }}
          >
            {item.label}
          </button>
        </Fragment>
      ))}
    </nav>
  )
}
