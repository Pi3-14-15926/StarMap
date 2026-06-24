/* StarMap 全局状态管理 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { NavData, Settings, SearchEngine, AppModule, TagItem } from '@ui/types'
import { isAuthenticated, getCurrentUser, type GitHubUser } from './admin/services/auth'

import defaultNavData from '../data/nav/db.json'
import defaultSettings from '../data/nav/settings.json'
import defaultSearchEngines from '../data/nav/search.json'

/* 从 localStorage 读取，回退到 JSON 默认值 */
function loadNavData(): NavData {
  try {
    const raw = localStorage.getItem('starmap_local_db')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as NavData
    }
  } catch { /* 忽略 */ }
  return defaultNavData as NavData
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('starmap_local_settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return { ...defaultSettings, ...parsed } as Settings
      }
    }
  } catch { /* 忽略 */ }
  return defaultSettings as Settings
}

function loadSearchEngines(): SearchEngine[] {
  try {
    const raw = localStorage.getItem('starmap_local_search')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as SearchEngine[]
    }
  } catch { /* 忽略 */ }
  return defaultSearchEngines as SearchEngine[]
}

function loadHiddenTagNames(): Set<string> {
  try {
    const raw = localStorage.getItem('starmap_local_tags')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return new Set(
          parsed.filter((t: TagItem) => t.noOpen).map((t: TagItem) => t.name)
        )
      }
    }
  } catch { /* 忽略 */ }
  return new Set()
}

interface StoreState {
  navData: NavData
  settings: Settings
  searchEngines: SearchEngine[]
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
  const [navData, setNavData] = useState<NavData>(loadNavData)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [searchEngines] = useState<SearchEngine[]>(loadSearchEngines)
  const [hiddenTagNames] = useState<Set<string>>(loadHiddenTagNames)
  const [currentModule, setCurrentModule] = useState<AppModule>('nav')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(1)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    (defaultNavData as NavData)[0]?.children?.[0]?.title || null
  )
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
