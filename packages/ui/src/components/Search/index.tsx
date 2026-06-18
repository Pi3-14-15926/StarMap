import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import type { SearchEngine } from '../../types'

/* 搜索组件 - 小米风高密度搜索条 */
interface SearchBarProps {
  engines: SearchEngine[]
  defaultEngine?: string
  onSearch: (keyword: string, engine: SearchEngine) => void
  placeholder?: string
}

export function SearchBar({ engines, defaultEngine, onSearch, placeholder = '搜索...' }: SearchBarProps) {
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState(0)
  const [showEngines, setShowEngines] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const currentEngine = engines[selected] || engines[0]

  useEffect(() => {
    const idx = engines.findIndex(e => e.name.toLowerCase() === defaultEngine?.toLowerCase())
    if (idx >= 0) setSelected(idx)
  }, [engines, defaultEngine])

  const handleSearch = () => {
    const trimmed = keyword.trim()
    if (!trimmed) return
    onSearch(trimmed, currentEngine)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-bg-container)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--color-border)',
        padding: '2px',
        maxWidth: 640,
        width: '100%',
        transition: 'all var(--transition-fast)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.borderColor = 'var(--color-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.borderColor = 'var(--color-border)'
      }}
    >
      {/* 搜索引擎选择器 */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowEngines(!showEngines)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {currentEngine.icon && (
            <img src={currentEngine.icon} alt="" width={16} height={16} style={{ borderRadius: 2 }} />
          )}
          <span>{currentEngine.name}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
            <path d="M5 6L0 0h10z" />
          </svg>
        </button>
        {showEngines && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-border)',
              minWidth: 160,
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            {engines.map((engine, idx) => (
              <button
                key={engine.name}
                onClick={() => { setSelected(idx); setShowEngines(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 'var(--font-size-sm)',
                  color: idx === selected ? 'var(--color-primary)' : 'var(--color-text)',
                  background: idx === selected ? 'var(--mi-orange-light)' : 'transparent',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)' }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = idx === selected ? 'var(--mi-orange-light)' : 'transparent'
                }}
              >
                {engine.icon && <img src={engine.icon} alt="" width={16} height={16} />}
                {engine.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 输入框 */}
      <input
        ref={inputRef}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          padding: '8px 12px',
          fontSize: 'var(--font-size-base)',
          background: 'transparent',
          color: 'var(--color-text)',
          minWidth: 0,
        }}
      />

      {/* 搜索按钮 */}
      <button
        onClick={handleSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-primary)',
          color: '#fff',
          margin: 2,
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-primary-hover)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--color-primary)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </button>
    </div>
  )
}
