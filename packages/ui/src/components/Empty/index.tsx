interface EmptyProps {
  description?: string
}

export function Empty({ description = '暂无数据' }: EmptyProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-2xl)',
        color: 'var(--color-text-tertiary)',
      }}
    >
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M8 26h48" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="22" r="2" fill="currentColor" />
        <circle cx="22" cy="22" r="2" fill="currentColor" />
        <circle cx="28" cy="22" r="2" fill="currentColor" />
      </svg>
      <p style={{ marginTop: 12, fontSize: 'var(--font-size-sm)' }}>{description}</p>
    </div>
  )
}
