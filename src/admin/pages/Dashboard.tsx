import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/auth'

type AdminTab = 'dashboard' | 'websites' | 'categories' | 'icons' | 'tags' | 'settings'

const menuItems: { key: AdminTab; icon: string; label: string; path: string }[] = [
  { key: 'dashboard', icon: '📊', label: '统计概览', path: '/admin/dashboard' },
  { key: 'websites', icon: '🌐', label: '网站管理', path: '/admin/websites' },
  { key: 'categories', icon: '📁', label: '分类管理', path: '/admin/categories' },
  { key: 'icons', icon: '🖼️', label: '图标管理', path: '/admin/icons' },
  { key: 'tags', icon: '🏷️', label: '标签管理', path: '/admin/tags' },
  { key: 'settings', icon: '⚙️', label: '网站设置', path: '/admin/settings' },
]

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentTab = menuItems.find(m => location.pathname.startsWith(m.path))?.key || 'dashboard'
  const currentItem = menuItems.find(m => m.key === currentTab)

  // 路由变化时关闭移动端侧边栏
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="admin-layout">
      {/* 桌面端侧边栏 */}
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
      </aside>

      {/* 移动端侧边栏遮罩 */}
      <div className={`mobile-sider-mask ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* 移动端侧边栏抽屉 */}
      <div className={`mobile-sider-drawer ${mobileOpen ? 'open' : ''}`}>
        <button className="mobile-sider-close" onClick={() => setMobileOpen(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="admin-sider-brand" onClick={() => { navigate('/admin/dashboard'); setMobileOpen(false) }}>
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
              onClick={() => { navigate(item.path); setMobileOpen(false) }}
              className={`nav-item ${currentTab === item.key ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* 主内容 */}
      <div className="admin-inner">
        <header className="admin-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <h1 className="header-title">{currentItem?.label}</h1>
          </div>
          <div className="header-right">
            <button className="btn-ghost" onClick={() => navigate('/')}>
              <span>🏠</span> <span className="btn-text-mobile">返回首页</span>
            </button>
            {user && (
              <div className="header-user">
                <img className="header-user-avatar" src={user.avatar_url} alt="" />
                <div className="header-user-info">
                  <div className="header-user-name">{user.login}</div>
                  <div className="header-user-role">管理员</div>
                </div>
              </div>
            )}
            <button className="btn-logout" onClick={onLogout}>
              <span>🚪</span> <span className="btn-text-mobile">登出</span>
            </button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
