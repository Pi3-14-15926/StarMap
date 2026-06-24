/* StarMap 全局状态管理 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { NavData, Settings, SearchEngine, AppModule, TagItem } from '@ui/types'
import { isAuthenticated, getCurrentUser, type GitHubUser } from './admin/services/auth'
import { initData, onUpdate, startPolling, getData } from './dataService'

/* 从 localStorage 读取 */
function loadLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw != null && raw !== '') {
      const parsed = JSON.parse(raw)
      if (parsed != null) {
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T
        if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) return parsed as T
      }
    }
  } catch { /* 忽略 */ }
  return null
}

interface StoreState {
  navData: NavData
  settings: Settings
  searchEngines: SearchEngine[]
  tags: TagItem[]
  hiddenTagNames: Set<string>
  currentModule: AppModule
  setCurrentModule: (m: AppModule) => void
  selectedCategoryId: number | null
  setSelectedCategoryId: (id: number | null) => void
  selectedSubCategory: string | null
  setSelectedSubCategory: (title: string | null) => void
  viewMode: 'grid' | 'list' | 'compact'
  setViewMode: (mode: 'grid' | 'list' | 'compact') => void
  sortBy: string
  setSortBy: (sort: string) => void
  /* 前台编辑 */
  isLoggedIn: boolean
  currentUser: GitHubUser | null
  refreshLoginState: () => void
  updateNavData: (data: NavData) => void
  updateSettings: (data: Settings) => void
}

const StoreContext = createContext<StoreState | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  /* 先从 localStorage 加载（快速显示），再从服务器拉取最新数据 */
  const [navData, setNavData] = useState<NavData>(() => loadLocal<NavData>('starmap_local_db') || [])
  const [settings, setSettings] = useState<Settings>(() => loadLocal<Settings>('starmap_local_settings') || ({} as Settings))
  const [searchEngines, setSearchEngines] = useState<SearchEngine[]>(() => loadLocal<SearchEngine[]>('starmap_local_search') || [])
  const [hiddenTagNames, setHiddenTagNames] = useState<Set<string>>(() => {
    const tags = loadLocal<TagItem[]>('starmap_local_tags')
    return tags ? new Set(tags.filter(t => t.noOpen).map(t => t.name)) : new Set()
  })
  const [tags, setTags] = useState<TagItem[]>(() => loadLocal<TagItem[]>('starmap_local_tags') || [])
  const [currentModule, setCurrentModule] = useState<AppModule>('nav')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(1)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')
  const [sortBy, setSortBy] = useState<string>('默认排序')
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated())
  const [currentUser, setCurrentUser] = useState<GitHubUser | null>(() => getCurrentUser())

  const refreshLoginState = useCallback(() => {
    const logged = isAuthenticated()
    setIsLoggedIn(logged)
    setCurrentUser(logged ? getCurrentUser() : null)
  }, [])

  /* 监听 localStorage 变化（跨标签页同步登录状态） */
  useEffect(() => {
    const handler = () => refreshLoginState()
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [refreshLoginState])

  /* 首次加载：从服务器拉取最新数据 */
  useEffect(() => {
    initData().then(data => {
      if (!data) return
      setNavData(data.db)
      setSettings(data.settings)
      setSearchEngines(data.search)
      setTags(data.tags)
      setHiddenTagNames(new Set(data.tags.filter(t => t.noOpen).map(t => t.name)))
      /* 设置默认选中第一个子分类 */
      if (!selectedSubCategory && data.db.length > 0) {
        setSelectedSubCategory(data.db[0]?.children?.[0]?.title || null)
      }
    })
    /* 启动轮询检测更新 */
    startPolling()
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

  /* 监听数据更新（轮询检测到变化时） */
  useEffect(() => {
    return onUpdate(() => {
      const data = getData()
      if (!data) return
      setNavData(data.db)
      setSettings(data.settings)
      setSearchEngines(data.search)
      setTags(data.tags)
      setHiddenTagNames(new Set(data.tags.filter(t => t.noOpen).map(t => t.name)))
    })
  }, [])

  const updateNavData = useCallback((data: NavData) => {
    setNavData(data)
    localStorage.setItem('starmap_local_db', JSON.stringify(data))
  }, [])

  const updateSettings = useCallback((data: Settings) => {
    setSettings(data)
    localStorage.setItem('starmap_local_settings', JSON.stringify(data))
  }, [])

  return (
    <StoreContext.Provider
      value={{
        navData,
        settings,
        searchEngines,
        tags,
        hiddenTagNames,
        currentModule,
        setCurrentModule,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedSubCategory,
        setSelectedSubCategory,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        isLoggedIn,
        currentUser,
        refreshLoginState,
        updateNavData,
        updateSettings,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
