import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getMode } from '../services/data'

type AdminTab = 'dashboard' | 'websites' | 'categories' | 'tags' | 'search' | 'settings' | 'bookmark'

const menuItems: { key: AdminTab; icon: string; label: string; path: string }[] = [
  { key: 'dashboard', icon: '📊', label: '统计概览', path: '/admin/dashboard' },
  { key: 'websites', icon: '🌐', label: '网站管理', path: '/admin/websites' },
  { key: 'categories', icon: '📁', label: '分类管理', path: '/admin/categories' },
  { key: 'tags', icon: '🏷️', label: '标签管理', path: '/admin/tags' },
  { key: 'search', icon: '🔍', label: '搜索引擎', path: '/admin/search' },
  { key: 'bookmark', icon: '📑', label: '书签导入/导出', path: '/admin/bookmark' },
  { key: 'settings', icon: '⚙️', label: '网站设置', path: '/admin/settings' },
]

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const mode = getMode()

  const currentTab = menuItems.find(m => location.pathname.startsWith(m.path))?.key || 'dashboard'
  const currentItem = menuItems.find(m => m.key === currentTab)

  return (
    <div className="admin-layout">
      {/* 侧边栏 */}
      <aside className="admin-sidebar">
        <div className="admin-sider-brand" onClick={() => navigate('/admin/dashboard')}>
          <img className="brand-mark" src="/favicon.png" alt="StarMap" width="40" height="40" />
          <div className="brand-text">
            <div className="brand-name">StarMap</div>
            <div className="brand-sub">Admin Console</div>
          </div>
        </div>

        <nav className="admin-sider-nav">
          {menuItems.map((item) => (
            <a
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`nav-item ${currentTab === item.key ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="admin-sider-footer">
          <button onClick={() => navigate('/')} className="btn-secondary">↩ 返回前台</button>
          <button onClick={onLogout} className="btn-logout">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            退出管理
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <div className="admin-inner">
        <header className="admin-header">
          <div className="header-left">
            <h1 className="header-title">{currentItem?.icon} {currentItem?.label}</h1>
          </div>
          <div className="header-right">
            <button className="btn-ghost" onClick={() => navigate('/')}>
              <span>🏠</span> 返回首页
            </button>
            <div className="admin-mode-tag" style={{
              background: mode === 'local'
                ? 'linear-gradient(135deg, rgba(249, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(79, 140, 255, 0.12) 0%, rgba(140, 108, 255, 0.12) 100%)',
              color: mode === 'local' ? '#D97706' : '#4F8CFF',
              border: `1px solid ${mode === 'local' ? 'rgba(249, 158, 11, 0.2)' : 'rgba(79, 140, 255, 0.2)'}`,
            }}>
              {mode === 'local' ? '⚡ 本地模式' : '🔗 GitHub 模式'}
            </div>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
