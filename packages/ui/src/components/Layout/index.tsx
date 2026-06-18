import type { ReactNode } from 'react'

interface HeaderProps {
  children: ReactNode
  className?: string
}

export function Header({ children, className = '' }: HeaderProps) {
  return (
    <header
      className={className}
        style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--color-border-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-xl)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(255,255,255,0.85)',
      }}
    >
      {children}
    </header>
  )
}

interface SidebarProps {
  children: ReactNode
  width?: number
}

export function Sidebar({ children, width = 260 }: SidebarProps) {
  return (
    <aside
      style={{
        width,
        height: 'calc(100vh - var(--header-height))',
        position: 'sticky',
        top: 'var(--header-height)',
        overflowY: 'auto',
        borderRight: '1px solid var(--color-border-secondary)',
        background: 'var(--color-bg-container)',
        flexShrink: 0,
      }}
    >
      {children}
    </aside>
  )
}

interface ContentProps {
  children: ReactNode
  className?: string
}

export function Content({ children, className = '' }: ContentProps) {
  return (
    <main
      className={className}
      style={{
        flex: 1,
        padding: 'var(--spacing-xl)',
        maxWidth: 'var(--content-max-width)',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {children}
    </main>
  )
}
