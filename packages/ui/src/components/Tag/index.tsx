interface TagProps {
  children: string
  color?: string
  closable?: boolean
  onClose?: () => void
}

export function Tag({ children, color, closable, onClose }: TagProps) {
  const tagColor = color || 'var(--color-primary)'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        borderRadius: 'var(--radius-sm)',
        background: `${tagColor}18`,
        color: tagColor,
        border: `1px solid ${tagColor}30`,
        transition: 'all var(--transition-fast)',
      }}
    >
      {children}
      {closable && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose?.() }}
          style={{
            marginLeft: 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: 'inherit',
            opacity: 0.6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = `${tagColor}20` }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent' }}
        >
          ✕
        </button>
      )}
    </span>
  )
}
