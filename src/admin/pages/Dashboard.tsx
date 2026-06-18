import { useState } from 'react'
import { Websites } from './Websites'
import { Categories } from './Categories'
import { Tags } from './Tags'
import { SearchEngines } from './SearchEngines'
import { Settings } from './Settings'
import { BookmarkImport } from './BookmarkImport'
import { Info } from './Info'
import { getMode } from '../services/data'

type AdminTab = 'websites' | 'categories' | 'tags' | 'search' | 'settings' | 'bookmark' | 'info'

const menuItems: { key: AdminTab; icon: string; label: string }[] = [
  { key: 'websites', icon: '🌐', label: '网站管理' },
  { key: 'categories', icon: '📁', label: '分类管理' },
  { key: 'tags', icon: '🏷️', label: '标签管理' },
  { key: 'search', icon: '🔍', label: '搜索引擎' },
  { key: 'bookmark', icon: '📑', label: '书签导入/导出' },
  { key: 'settings', icon: '⚙️', label: '系统设置' },
  { key: 'info', icon: '📊', label: '系统信息' },
]

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [tab, setTab] = useState<AdminTab>('websites')
  const mode = getMode()

  const handleLogout = () => {
    onLogout()
  }

  const renderContent = () => {
    switch (tab) {
      case 'websites': return <Websites />
      case 'categories': return <Categories />
      case 'tags': return <Tags />
      case 'search': return <SearchEngines />
      case 'settings': return <Settings />
      case 'bookmark': return <BookmarkImport />
      case 'info': return <Info />
      default: return <Websites />
    }
  }

  return (
    <div className="admin-layout">
      {/* 侧边栏 */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
            <defs>
              <linearGradient id="sidebar-logo-grad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4F8CFF" />
                <stop offset="100%" stopColor="#8C6CFF" />
              </linearGradient>
            </defs>
            <rect width="56" height="56" rx="16" fill="url(#sidebar-logo-grad)" />
            <path d="M28 14l4.5 9 9 2.25-6.75 6.75 1.5 9.75L28 35l-8.25 6 1.5-9.75L14.5 25.25l9-2.25z" fill="#fff" />
          </svg>
          <span>管理后台</span>
        </div>

        {/* 模式标签 */}
        <div className="admin-mode-badge" style={{
          background: mode === 'local'
            ? 'linear-gradient(135deg, rgba(249, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(79, 140, 255, 0.12) 0%, rgba(140, 108, 255, 0.12) 100%)',
          color: mode === 'local' ? '#D97706' : '#4F8CFF',
          border: `1px solid ${mode === 'local' ? 'rgba(249, 158, 11, 0.2)' : 'rgba(79, 140, 255, 0.2)'}`,
        }}>
          {mode === 'local' ? '⚡ 本地模式' : '🔗 GitHub 模式'}
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`admin-sidebar-item ${tab === item.key ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <a href="../" className="admin-sidebar-back">↩ 返回前台</a>
          <button onClick={handleLogout} className="admin-sidebar-logout">← 退出管理</button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="admin-main">
        <div className="admin-main-header">
          <h2>{menuItems.find((m) => m.key === tab)?.label}</h2>
        </div>
        <div className="admin-main-content">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
