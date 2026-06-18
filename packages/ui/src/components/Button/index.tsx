import type { ReactNode, MouseEvent } from 'react'

type ButtonType = 'primary' | 'default' | 'text' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  onClick?: (e: MouseEvent) => void
  type?: ButtonType
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  block?: boolean
  className?: string
}

const typeStyles: Record<ButtonType, React.CSSProperties> = {
  primary: {
    background: 'var(--color-primary)',
    color: '#fff',
    border: '1px solid var(--color-primary)',
  },
  default: {
    background: 'var(--color-bg-container)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  text: {
    background: 'transparent',
    color: 'var(--color-text)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--color-error)',
    color: '#fff',
    border: '1px solid var(--color-error)',
  },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: 'var(--font-size-xs)', borderRadius: 'var(--radius-sm)' },
  md: { padding: '7px 20px', fontSize: 'var(--font-size-base)', borderRadius: 'var(--radius-md)' },
  lg: { padding: '10px 28px', fontSize: 'var(--font-size-lg)', borderRadius: 'var(--radius-md)' },
}

export function Button({ children, onClick, type = 'default', size = 'md', disabled, loading, block }: ButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all var(--transition-fast)',
        width: block ? '100%' : undefined,
        ...typeStyles[type],
        ...sizeStyles[size],
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (type === 'primary') e.currentTarget.style.background = 'var(--color-primary-hover)'
        else if (type === 'default') e.currentTarget.style.borderColor = 'var(--color-primary)'
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        if (type === 'primary') e.currentTarget.style.background = 'var(--color-primary)'
        else if (type === 'default') e.currentTarget.style.borderColor = 'var(--color-border)'
      }}
    >
      {loading && (
        <span style={{
          width: 14, height: 14,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
          display: 'inline-block',
        }} />
      )}
      {children}
    </button>
  )
}
