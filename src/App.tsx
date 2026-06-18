import { useState, useMemo, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
import type { WebItem, Category, SubCategory } from '@ui/types'
import AdminApp from './admin'

/* ===== 主站内容 ===== */
function NavContent() {
  const {
    navData,
    settings,
    currentModule,
    setCurrentModule,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedSubCategory,
    setSelectedSubCategory,
    viewMode,
    setViewMode,
  } = useStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortBy, setSortBy] = useState('默认排序')
  const [isDark, setIsDark] = useState(false)

  const currentCategory = useMemo(() => {
    return navData.find((c) => c.id === selectedCategoryId) || navData[0]
  }, [navData, selectedCategoryId])

  const subCategories = useMemo(() => currentCategory?.children || [], [currentCategory])

  const filteredSites = useMemo(() => {
    let sites: (WebItem & { subCategoryTitle?: string })[] = []
    if (selectedSubCategory) {
      const sub = subCategories.find((s) => s.title === selectedSubCategory)
      if (sub) sites = sub.nav.map((item) => ({ ...item, subCategoryTitle: sub.title }))
    } else {
      for (const sub of subCategories) {
        for (const item of sub.nav) sites.push({ ...item, subCategoryTitle: sub.title })
      }
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      sites = sites.filter((s) =>
        s.name.toLowerCase().includes(kw) || s.desc.toLowerCase().includes(kw) || s.url.toLowerCase().includes(kw)
      )
    }
    return sites
  }, [subCategories, selectedSubCategory, searchKeyword])

  const getCategoryCount = (cat: Category) => (cat.children || []).reduce((a, s) => a + (s.nav?.length || 0), 0)
  const getSubCategoryCount = (sub: SubCategory) => sub.nav?.length || 0

  const stats = useMemo(() => {
    let totalSites = 0
    for (const cat of navData) for (const sub of cat.children || []) totalSites += sub.nav?.length || 0
    return { totalSites, totalCategories: navData.length, lastUpdate: settings.runtimeDate || '2026-06-17' }
  }, [navData, settings])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="app-header">
        <div className="header-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="var(--primary)" />
            <path d="M14 5l3 6 6 1.5-4.5 4 1 6.5L14 19l-5.5 4 1-6.5L5 12.5l6-1.5z" fill="#fff" />
          </svg>
          <div>
            <div className="header-brand">StarMap</div>
            <div className="header-subtitle">发现最好的工具与资源</div>
          </div>
        </div>

        <div className="header-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="搜索网站、工具或资源..." className="header-search-input" />
          <span className="header-shortcut">⌘K</span>
        </div>

        <nav className="header-tabs">
          {[
            { key: 'nav', label: '导航', icon: '🧭' },
            { key: 'software', label: '软件', icon: '📦' },
            { key: 'tools', label: '工具', icon: '🛠' },
            { key: 'blog', label: '博客', icon: '📝' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setCurrentModule(tab.key as any)} className={`header-tab ${currentModule === tab.key ? 'active' : ''}`}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <a href={settings.githubUrl} target="_blank" rel="noopener noreferrer" className="header-action-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>
          <button className="header-theme-btn" onClick={() => setIsDark(!isDark)}>
            {isDark
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            }
          </button>
          <a href="admin/" className="header-admin-btn">管理</a>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            {navData.map((cat) => (
              <button key={cat.id} onClick={() => { setSelectedCategoryId(cat.id); setSelectedSubCategory(null) }}
                className={`sidebar-item ${selectedCategoryId === cat.id ? 'active' : ''}`}>
                <span className="sidebar-item-icon">{cat.icon}</span>
                <span className="sidebar-item-title">{cat.title}</span>
                <span className="sidebar-item-count">{getCategoryCount(cat)}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-stats">
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-icon">📋</span>
              <span className="sidebar-stat-label">收录网站</span>
              <span className="sidebar-stat-value">{stats.totalSites}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-icon">🏷️</span>
              <span className="sidebar-stat-label">分类数量</span>
              <span className="sidebar-stat-value">{stats.totalCategories}</span>
            </div>
            <div className="sidebar-stat-row">
              <span className="sidebar-stat-icon">🕐</span>
              <span className="sidebar-stat-label">最后更新</span>
              <span className="sidebar-stat-value">{stats.lastUpdate}</span>
            </div>
          </div>
          <div className="sidebar-footer">
            <div>© 2026 StarMap</div>
            <div>发现最好的工具与资源</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="app-main">
          <div className="main-breadcrumb">
            <span onClick={() => setSelectedCategoryId(null)} className="breadcrumb-item">全部</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item active">{currentCategory?.icon} {currentCategory?.title}</span>
          </div>

          <div className="main-banner">
            <div className="banner-content">
              <div className="banner-icon">{currentCategory?.icon}</div>
              <div>
                <h1 className="banner-title">{currentCategory?.title}</h1>
                <p className="banner-desc">精选高效实用工具，提升工作与生活效率</p>
              </div>
            </div>
            <div className="banner-decoration">
              <svg width="200" height="140" viewBox="0 0 200 140" fill="none">
                <circle cx="140" cy="40" r="30" fill="var(--primary)" opacity="0.08" />
                <circle cx="100" cy="80" r="20" fill="var(--primary)" opacity="0.12" />
                <circle cx="160" cy="90" r="15" fill="var(--primary)" opacity="0.06" />
                <rect x="80" y="30" width="40" height="40" rx="8" fill="var(--primary)" opacity="0.1" />
                <rect x="120" y="60" width="30" height="30" rx="6" fill="var(--primary)" opacity="0.08" />
              </svg>
            </div>
          </div>

          <div className="main-filters">
            <div className="filter-tags">
              <button className={`filter-tag ${!selectedSubCategory ? 'active' : ''}`} onClick={() => setSelectedSubCategory(null)}>
                全部 <span className="filter-count">{filteredSites.length}</span>
              </button>
              {subCategories.map((sub) => (
                <button key={sub.id} className={`filter-tag ${selectedSubCategory === sub.title ? 'active' : ''}`}
                  onClick={() => setSelectedSubCategory(sub.title)}>
                  {sub.title} <span className="filter-count">{getSubCategoryCount(sub)}</span>
                </button>
              ))}
            </div>
            <div className="filter-controls">
              <div className="sort-select">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option>默认排序</option><option>按名称排序</option><option>按评分排序</option>
                </select>
              </div>
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>
                </button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="3" rx="1" /><rect x="1" y="7" width="14" height="3" rx="1" /><rect x="1" y="12" width="14" height="3" rx="1" /></svg>
                </button>
              </div>
            </div>
          </div>

          <div className={`site-grid ${viewMode}`}>
            {filteredSites.map((site, idx) => (
              <a key={`${site.name}-${idx}`} href={site.url} target="_blank" rel="noopener noreferrer" className="site-card">
                <div className="site-card-icon">
                  <img src={site.icon} alt={site.name}
                    onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%231677FF" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`)}` }} />
                </div>
                <div className="site-card-info">
                  <div className="site-card-header">
                    <span className="site-card-name">{site.name}</span>
                    <span className="site-card-rating">{'★'.repeat(site.rate)}{'☆'.repeat(5 - site.rate)}</span>
                  </div>
                  <p className="site-card-desc">{site.desc}</p>
                  {site.tag && <span className="site-card-tag">{site.tag}</span>}
                </div>
                <svg className="site-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </a>
            ))}
          </div>
          <div className="main-footer">共 {filteredSites.length} 个网站</div>
        </main>
      </div>
    </div>
  )
}

/* ===== 加载动画 ===== */
function LoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-tertiary)' }}>
      加载中...
    </div>
  )
}

/* ===== 根组件 ===== */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminApp />
          </Suspense>
        } />
        <Route path="/*" element={
          <StoreProvider>
            <NavContent />
          </StoreProvider>
        } />
      </Routes>
    </BrowserRouter>
  )
}
