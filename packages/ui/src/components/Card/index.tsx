import { type ReactNode, type MouseEvent } from 'react'

/* 小米风格：高信息密度卡片 */
interface MiCardProps {
  children: ReactNode
  onClick?: (e: MouseEvent) => void
  className?: string
  hoverable?: boolean
}

export function MiCard({ children, onClick, className = '', hoverable = true }: MiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`mi-card ${className}`}
      style={{
        background: 'var(--color-bg-container)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-secondary)',
        padding: 'var(--spacing-md)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'all var(--transition-fast)',
        ...(hoverable ? {
          ['--hover-transform' as string]: 'translateY(-2px)',
          ['--hover-shadow' as string]: 'var(--shadow-md)',
        } : {}),
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          const el = e.currentTarget
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = 'var(--shadow-md)'
          el.style.borderColor = 'var(--color-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          const el = e.currentTarget
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
          el.style.borderColor = 'var(--color-border-secondary)'
        }
      }}
    >
      {children}
    </div>
  )
}

/* Apple 风格：沉浸式详情卡片 */
interface AppleCardProps {
  children: ReactNode
  className?: string
  padding?: string
}

export function AppleCard({ children, className = '', padding = 'var(--spacing-xl)' }: AppleCardProps) {
  return (
    <div
      className={`apple-card ${className}`}
      style={{
        background: 'var(--apple-card)',
        borderRadius: 'var(--radius-xl)',
        padding,
        boxShadow: 'var(--apple-shadow)',
        transition: 'all var(--transition-normal)',
      }}
    >
      {children}
    </div>
  )
}
