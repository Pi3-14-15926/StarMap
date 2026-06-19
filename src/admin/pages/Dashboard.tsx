import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/auth'

type AdminTab = 'dashboard' | 'websites' | 'categories' | 'tags' | 'settings'

const menuItems: { key: AdminTab; icon: string; label: string; path: string }[] = [
  { key: 'dashboard', icon: '📊', label: '统计概览', path: '/admin/dashboard' },
  { key: 'websites', icon: '🌐', label: '网站管理', path: '/admin/websites' },
  { key: 'categories', icon: '📁', label: '分类管理', path: '/admin/categories' },
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
      </aside>

      {/* 主内容 */}
      <div className="admin-inner">
        <header className="admin-header">
          <div className="header-left">
            <h1 className="header-title">{currentItem?.label}</h1>
          </div>
          <div className="header-right">
            <button className="btn-ghost" onClick={() => navigate('/')}>
              <span>🏠</span> 返回首页
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
              <span>🚪</span> 登出
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