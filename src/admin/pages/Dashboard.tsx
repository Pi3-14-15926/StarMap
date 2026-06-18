import { useState } from 'react'
import { Websites } from './Websites'
import { Categories } from './Categories'
import { Tags } from './Tags'
import { SearchEngines } from './SearchEngines'
import { Settings } from './Settings'
import { BookmarkImport } from './BookmarkImport'
import { Info } from './Info'
import { clearConfig } from '../services/github'

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

  const handleLogout = () => {
    clearConfig()
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
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#1677FF" />
            <path d="M14 5l3 6 6 1.5-4.5 4 1 6.5L14 19l-5.5 4 1-6.5L5 12.5l6-1.5z" fill="#fff" />
          </svg>
          <span>管理后台</span>
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
          <button onClick={handleLogout} className="admin-sidebar-logout">
            ← 退出登录
          </button>
          <a href="../" className="admin-sidebar-back">
            ↩ 返回前台
          </a>
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
