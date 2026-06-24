import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
import { resolveIconUrl } from './admin/services/iconUrl'
import { commitAllData } from './admin/services/github'

import { EditWebModal, EditCategoryModal, ConfirmModal, MoveModal } from './components/EditModal'
import type { WebItem, Category, SubCategory, TagItem } from '@ui/types'
import AdminApp from './admin'

import defaultTags from '../data/nav/tag.json'

/* ===== 主站内容 ===== */
function NavContent() {
  const {
    navData,
    settings,
    hiddenTagNames,
    currentModule,
    setCurrentModule,
    selectedCategoryId,
    setSelectedCategoryId,
    viewMode,
    setViewMode,
    isLoggedIn,
    updateNavData,
  } = useStore()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortBy, setSortBy] = useState('默认排序')
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('starmap_theme')
    return saved === 'dark'
  })
  const [mobileSiderOpen, setMobileSiderOpen] = useState(false)

  // 应用主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('starmap_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  /* 加载标签数据 */
  const [tags] = useState<TagItem[]>(() => {
    try {
      const raw = localStorage.getItem('starmap_local_tags')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as TagItem[]
      }
    } catch { /* 忽略 */ }
    return defaultTags as TagItem[]
  })

  /* 发布 */
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState('')

  /* 编辑弹窗状态 */
  const [webModal, setWebModal] = useState<{ visible: boolean; data?: WebItem; subId?: number; editIdx?: number }>({ visible: false })
  const [catModal, setCatModal] = useState<{ visible: boolean; data?: SubCategory; editIdx?: number }>({ visible: false })
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; title: string; message: string; onConfirm: () => void }>({ visible: false, title: '', message: '', onConfirm: () => {} })
  const [moveModal, setMoveModal] = useState<{ visible: boolean; catId?: number; subId?: number; idx?: number; name?: string }>({ visible: false })

  const currentCategory = useMemo(() => {
    return navData.find((c) => c.id === selectedCategoryId) || navData[0]
  }, [navData, selectedCategoryId])

  const subCategories = useMemo(() => currentCategory?.children || [], [currentCategory])

  const filteredSites = useMemo(() => {
    let sites: (WebItem & { subCategoryTitle?: string })[] = []
    for (const sub of subCategories) {
      for (const item of sub.nav) sites.push({ ...item, subCategoryTitle: sub.title })
    }
    if (hiddenTagNames.size > 0) {
      sites = sites.filter((s) => !s.tag || !hiddenTagNames.has(s.tag))
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      sites = sites.filter((s) =>
        s.name.toLowerCase().includes(kw) || s.desc.toLowerCase().includes(kw) || s.url.toLowerCase().includes(kw)
      )
    }
    return sites
  }, [subCategories, searchKeyword, hiddenTagNames])

  const getCategoryCount = (cat: Category) => (cat.children || []).reduce((a, s) => a + (s.nav?.length || 0), 0)

  const stats = useMemo(() => {
    let totalSites = 0
    for (const cat of navData) for (const sub of cat.children || []) totalSites += sub.nav?.length || 0
    return { totalSites, totalCategories: navData.length, lastUpdate: settings.runtimeDate || '2026-06-17' }
  }, [navData, settings])

  /* ===== 发布 ===== */
  const handlePublish = useCallback(async () => {
    setPublishing(true)
    setPublishMsg('')
    try {
      const result = await commitAllData()
      setPublishMsg(`已提交 ${result.files} 个文件到 ${result.repo}`)
      setTimeout(() => setPublishMsg(''), 4000)
    } catch (e: any) {
      setPublishMsg(`发布失败: ${e.message}`)
      setTimeout(() => setPublishMsg(''), 6000)
    } finally {
      setPublishing(false)
    }
  }, [])

  /* ===== 网站编辑 ===== */
  const openAddWeb = useCallback((subId: number) => {
    setWebModal({ visible: true, subId })
  }, [])

  const openEditWeb = useCallback((subId: number, idx: number, data: WebItem) => {
    setWebModal({ visible: true, data, subId, editIdx: idx })
  }, [])

  const handleSaveWeb = useCallback((item: WebItem, targetSubId?: number) => {
    const { subId, editIdx } = webModal
    const saveSubId = targetSubId || subId
    if (saveSubId == null) return
    const newData = navData.map((cat) => ({
      ...cat,
      children: cat.children.map((sub) => {
        if (sub.id !== saveSubId) return sub
        const newNav = [...sub.nav]
        if (editIdx != null && editIdx >= 0) {
          newNav[editIdx] = item
        } else {
          newNav.push(item)
        }
        return { ...sub, nav: newNav }
      }),
    }))
    updateNavData(newData)
    setWebModal({ visible: false })
  }, [webModal, navData, updateNavData])

  const handleDeleteWeb = useCallback(() => {
    const { subId, editIdx } = webModal
    if (subId == null || editIdx == null) return
    const newData = navData.map((cat) => ({
      ...cat,
      children: cat.children.map((sub) => {
        if (sub.id !== subId) return sub
        return { ...sub, nav: sub.nav.filter((_, i) => i !== editIdx) }
      }),
    }))
    updateNavData(newData)
    setWebModal({ visible: false })
    setConfirmModal({ ...confirmModal, visible: false })
  }, [webModal, navData, updateNavData, confirmModal])

  /* ===== 子分类编辑 ===== */
  const openAddCat = useCallback(() => {
    setCatModal({ visible: true })
  }, [])

  const openEditCat = useCallback((idx: number, data: SubCategory) => {
    setCatModal({ visible: true, data, editIdx: idx })
  }, [])

  const handleSaveCat = useCallback((title: string, hidden?: boolean) => {
    const { data, editIdx } = catModal
    if (!currentCategory) return
    const catIdx = navData.findIndex((c) => c.id === currentCategory.id)
    if (catIdx < 0) return
    const newData = [...navData]
    const newChildren = [...newData[catIdx].children]
    if (data && editIdx != null) {
      newChildren[editIdx] = { ...newChildren[editIdx], title, hidden: hidden || undefined }
    } else {
      const maxId = navData.reduce((m, c) => Math.max(m, ...c.children.map((s) => s.id)), 0)
      newChildren.push({ id: maxId + 1, title, nav: [], hidden: hidden || undefined })
    }
    newData[catIdx] = { ...newData[catIdx], children: newChildren }
    updateNavData(newData)
    setCatModal({ visible: false })
  }, [catModal, currentCategory, navData, updateNavData])

  const handleDeleteCat = useCallback(() => {
    const { data } = catModal
    if (!data || !currentCategory) return
    const catIdx = navData.findIndex((c) => c.id === currentCategory.id)
    if (catIdx < 0) return
    const newData = [...navData]
    newData[catIdx] = {
      ...newData[catIdx],
      children: newData[catIdx].children.filter((s) => s.id !== data.id),
    }
    updateNavData(newData)
    setCatModal({ visible: false })
    setConfirmModal({ ...confirmModal, visible: false })
  }, [catModal, currentCategory, navData, updateNavData, confirmModal])

  /* ===== 确认删除 ===== */
  const askDeleteWeb = useCallback((subId: number, idx: number, name: string) => {
    setConfirmModal({
      visible: true,
      title: '删除网站',
      message: `确定要删除「${name}」吗？此操作不可撤销。`,
      onConfirm: handleDeleteWeb,
    })
    setWebModal({ visible: false, subId, editIdx: idx })
  }, [handleDeleteWeb])

  const askDeleteCat = useCallback((data: SubCategory) => {
    setConfirmModal({
      visible: true,
      title: '删除子分类',
      message: `确定要删除「${data.title}」及其下所有网站吗？此操作不可撤销。`,
      onConfirm: handleDeleteCat,
    })
  }, [handleDeleteCat])

  /* 移动网站 */
  const openMoveWeb = useCallback((catId: number, subId: number, idx: number, name: string) => {
    setMoveModal({ visible: true, catId, subId, idx, name })
  }, [])

  const handleMoveWeb = useCallback((targetCatId: number, targetSubId: number, copy: boolean) => {
    const { catId, subId, idx } = moveModal
    if (catId == null || subId == null || idx == null) return
    const site = navData.find(c => c.id === catId)?.children.find(s => s.id === subId)?.nav[idx]
    if (!site) return
    let newData = [...navData]
    if (!copy) {
      /* 移动：从原位置删除 */
      newData = newData.map(cat => ({
        ...cat,
        children: cat.children.map(sub => {
          if (sub.id !== subId) return sub
          return { ...sub, nav: sub.nav.filter((_, i) => i !== idx) }
        }),
      }))
    }
    /* 添加到目标位置 */
    newData = newData.map(cat => {
      if (cat.id !== targetCatId) return cat
      return {
        ...cat,
        children: cat.children.map(sub => {
          if (sub.id !== targetSubId) return sub
          return { ...sub, nav: [...sub.nav, site] }
        }),
      }
    })
    updateNavData(newData)
    setMoveModal({ visible: false })
  }, [moveModal, navData, updateNavData])

  /* 分享网站 */
  const handleShare = useCallback((url: string, name: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setPublishMsg(`已复制「${name}」的链接`)
      setTimeout(() => setPublishMsg(''), 3000)
    }).catch(() => {
      setPublishMsg('复制失败')
      setTimeout(() => setPublishMsg(''), 3000)
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="app-header">
        <button className="mobile-menu-btn" onClick={() => setMobileSiderOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div className="header-logo">
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="StarMap" width="32" height="32" />
          <div>
            <div className="header-brand">{settings.title || 'StarMap'}</div>
            <div className="header-subtitle">{settings.subtitle || '发现最好的工具与资源'}</div>
          </div>
        </div>

        <div className="header-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="搜索..." className="header-search-input" />
        </div>

        <nav className="header-tabs">
          {(settings.navCards || []).filter(c => c.title && c.url).map((card, i) => (
            <a key={i} href={card.url} target="_blank" rel="noopener noreferrer" className="header-tab">
              <span>{card.icon}</span><span>{card.title}</span>
            </a>
          ))}
        </nav>

        <div className="header-actions">
          {settings.showGithub !== false && (
            <a href={settings.githubUrl} target="_blank" rel="noopener noreferrer" className="header-action-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          )}
          <button className="header-theme-btn" onClick={() => setIsDark(!isDark)}>
            {isDark
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            }
          </button>

          {settings.showLogin !== false && (
            <a href="#/admin/dashboard" className="header-admin-btn">管理</a>
          )}

          {isLoggedIn && (
            <button className="header-publish-btn" disabled={publishing} onClick={handlePublish}>
              {publishing ? '发布中...' : '发布'}
            </button>
          )}
        </div>
      </header>

      {/* 发布提示 */}
      {publishMsg && (
        <div className={`publish-toast ${publishMsg.includes('失败') ? 'error' : 'success'}`}>
          {publishMsg}
        </div>
      )}

      {/* 移动端分类侧边栏 */}
      <div className={`mobile-sider-mask ${mobileSiderOpen ? 'open' : ''}`} onClick={() => setMobileSiderOpen(false)} />
      <div className={`mobile-sider-drawer ${mobileSiderOpen ? 'open' : ''}`}>
        <div className="mobile-sider-header">
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="StarMap" width="28" height="28" />
          <span className="mobile-sider-title">{settings.title || 'StarMap'}</span>
          <button className="mobile-sider-close" onClick={() => setMobileSiderOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mobile-sider-nav">
          {navData.filter(cat => isLoggedIn || !cat.hidden).map((cat) => (
            <button key={cat.id} onClick={() => { setSelectedCategoryId(cat.id); setMobileSiderOpen(false) }}
              className={`mobile-sider-item ${selectedCategoryId === cat.id ? 'active' : ''} ${cat.hidden ? 'sidebar-item-hidden' : ''}`}>
              <span className="mobile-sider-icon">{cat.icon}</span>
              <span className="mobile-sider-label">
                <span className="mobile-sider-name">{cat.title}</span>
                <span className="mobile-sider-count">{getCategoryCount(cat)}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="app-body">
        {/* Sidebar */}
        <aside className="app-sidebar">
          <nav className="sidebar-nav">
            {navData.filter(cat => isLoggedIn || !cat.hidden).map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)}
                className={`sidebar-item ${selectedCategoryId === cat.id ? 'active' : ''} ${cat.hidden ? 'sidebar-item-hidden' : ''}`}>
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
            {settings.showRuntime !== false && (
              <div className="sidebar-stat-row">
                <span className="sidebar-stat-icon">🕐</span>
                <span className="sidebar-stat-label">最后更新</span>
                <span className="sidebar-stat-value">{stats.lastUpdate}</span>
              </div>
            )}
          </div>
          <div className="sidebar-footer">
            <div>© 2026 StarMap</div>
            <div>发现最好的工具与资源</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="app-main">

          <div className="main-toolbar">
            <div className="filter-controls">
              <div className="sort-select">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option>默认排序</option><option>按名称排序</option><option>按评分排序</option>
                </select>
              </div>
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="标准卡片">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>
                </button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="列表视图">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="3" rx="1" /><rect x="1" y="7" width="14" height="3" rx="1" /><rect x="1" y="12" width="14" height="3" rx="1" /></svg>
                </button>
                <button className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`} onClick={() => setViewMode('compact')} title="紧凑视图">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="4" height="4" rx="1" /><rect x="6" y="1" width="4" height="4" rx="1" /><rect x="11" y="1" width="4" height="4" rx="1" /><rect x="1" y="6" width="4" height="4" rx="1" /><rect x="6" y="6" width="4" height="4" rx="1" /><rect x="11" y="6" width="4" height="4" rx="1" /><rect x="1" y="11" width="4" height="4" rx="1" /><rect x="6" y="11" width="4" height="4" rx="1" /><rect x="11" y="11" width="4" height="4" rx="1" /></svg>
                </button>
              </div>
            </div>
            {isLoggedIn && (
              <button className="add-cat-btn" onClick={openAddCat}>+ 添加子分类</button>
            )}
          </div>

          {subCategories.filter(sub => isLoggedIn || !sub.hidden).map((sub, subIdx) => {
            let sites = sub.nav || []
            if (!isLoggedIn) {
              sites = sites.filter(s => !s.hidden)
            }
            if (hiddenTagNames.size > 0) {
              sites = sites.filter((s) => !s.tag || !hiddenTagNames.has(s.tag))
            }
            if (searchKeyword) {
              const kw = searchKeyword.toLowerCase()
              sites = sites.filter((s) =>
                s.name.toLowerCase().includes(kw) || s.desc.toLowerCase().includes(kw) || s.url.toLowerCase().includes(kw)
              )
            }
            if (sites.length === 0 && !isLoggedIn) return null
            return (
              <div key={sub.id} className={`sub-section ${sub.hidden ? 'sub-section-hidden' : ''}`}>
                <div className="sub-section-header">
                  <h2 className="sub-section-title">{sub.title}</h2>
                  <span className="sub-section-count">{sites.length}</span>
                  {isLoggedIn && (
                    <div className="sub-section-actions">
                      <button className="edit-icon-btn" title="编辑子分类"
                        onClick={() => openEditCat(subIdx, sub)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="edit-icon-btn" title="添加网站"
                        onClick={() => openAddWeb(sub.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <button className="edit-icon-btn edit-icon-danger" title="删除子分类"
                        onClick={() => askDeleteCat(sub)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className={`site-grid ${viewMode}`}>
                  {sites.map((site, idx) => {
                    const origIdx = sub.nav.indexOf(site)
                    const isCompact = viewMode === 'compact'
                    return (
                      <div key={`${site.name}-${idx}`} className={`site-card-wrap ${site.hidden ? 'site-card-hidden' : ''} ${isCompact ? 'site-card-compact-wrap' : ''}`}>
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className={`site-card ${isCompact ? 'site-card-compact' : ''}`}>
                          <div className="site-card-top">
                            <div className="site-card-icon">
                              <img src={resolveIconUrl(site.icon, settings.iconCdnMode, settings.iconCdnCustomBase)} alt={site.name}
                                onError={(e) => { (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%234F8CFF" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`)}` }} />
                            </div>
                            <div className="site-card-info">
                              <div className="site-card-header">
                                <span className="site-card-name">{site.name}</span>
                                {!isCompact && settings.showRating !== false && (
                                  <span className="site-card-rating">{'★'.repeat(site.rate)}{'☆'.repeat(5 - site.rate)}</span>
                                )}
                              </div>
                              {!isCompact && <p className="site-card-desc">{site.desc}</p>}
                              {!isCompact && site.tag && <span className="site-card-tag">{site.tag}</span>}
                            </div>
                          </div>
                        </a>
                        {!isCompact && site.relatedArticles && site.relatedArticles.length > 0 && (
                          <div className="site-card-articles">
                            <span className="site-card-articles-label">📄 关联文章 {site.relatedArticles.length} 篇</span>
                            <div className="site-card-articles-list">
                              {site.relatedArticles.map((a, i) => (
                                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="site-card-article-item" onClick={e => e.stopPropagation()}>
                                  <span className="site-card-article-dot" />
                                  <span className="site-card-article-title">{a.title}</span>
                                  <svg className="site-card-article-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {!isCompact && isLoggedIn && (
                          <div className="site-card-bar">
                            <button className="site-bar-btn" title="编辑"
                              onClick={() => openEditWeb(sub.id, origIdx, site)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button className="site-bar-btn" title="分享"
                              onClick={() => handleShare(site.url, site.name)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                              </svg>
                            </button>
                            <button className="site-bar-btn" title="移动"
                              onClick={() => openMoveWeb(currentCategory!.id, sub.id, origIdx, site.name)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
                                <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                              </svg>
                            </button>
                            <button className="site-bar-btn site-bar-danger" title="删除"
                              onClick={() => askDeleteWeb(sub.id, origIdx, site.name)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div className="main-footer">共 {filteredSites.length} 个网站</div>
        </main>
      </div>

      {/* 弹窗 */}
      <EditWebModal
        visible={webModal.visible}
        title={webModal.editIdx != null ? '编辑网站' : '添加网站'}
        data={webModal.data}
        subId={webModal.subId}
        allCategories={navData}
        allTags={tags}
        onSave={handleSaveWeb}
        onDelete={webModal.editIdx != null ? () => {
          if (webModal.data) {
            askDeleteWeb(webModal.subId!, webModal.editIdx!, webModal.data.name)
            setWebModal({ ...webModal, visible: false })
          }
        } : undefined}
        onClose={() => setWebModal({ visible: false })}
      />
      <EditCategoryModal
        visible={catModal.visible}
        title={catModal.editIdx != null ? '编辑子分类' : '添加子分类'}
        data={catModal.data}
        onSave={handleSaveCat}
        onDelete={catModal.data ? () => askDeleteCat(catModal.data!) : undefined}
        onClose={() => setCatModal({ visible: false })}
      />
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, visible: false })}
      />
      <MoveModal
        visible={moveModal.visible}
        allCategories={navData}
        currentCatId={moveModal.catId || 0}
        currentSubId={moveModal.subId || 0}
        websiteName={moveModal.name || ''}
        onMove={handleMoveWeb}
        onClose={() => setMoveModal({ visible: false })}
      />
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
    <HashRouter>
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
    </HashRouter>
  )
}
