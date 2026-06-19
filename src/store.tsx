/* StarMap 全局状态管理 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { NavData, Settings, SearchEngine, AppModule } from '@ui/types'

import defaultNavData from '../data/nav/db.json'
import defaultSettings from '../data/nav/settings.json'
import defaultSearchEngines from '../data/nav/search.json'

interface StoreState {
  navData: NavData
  settings: Settings
  searchEngines: SearchEngine[]
  currentModule: AppModule
  setCurrentModule: (m: AppModule) => void
  selectedCategoryId: number | null
  setSelectedCategoryId: (id: number | null) => void
  selectedSubCategory: string | null
  setSelectedSubCategory: (title: string | null) => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  sortBy: string
  setSortBy: (sort: string) => void
}

const StoreContext = createContext<StoreState | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [navData] = useState<NavData>(defaultNavData as NavData)
  const [settings] = useState<Settings>(defaultSettings as Settings)
  const [searchEngines] = useState<SearchEngine[]>(defaultSearchEngines as SearchEngine[])
  const [currentModule, setCurrentModule] = useState<AppModule>('nav')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(1)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    (defaultNavData as NavData)[0]?.children?.[0]?.title || null
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<string>('默认排序')

  const updateNavData = useCallback((_data: NavData) => {
    /* 预留：用于 admin 后台更新数据 */
  }, [])

  return (
    <StoreContext.Provider
      value={{
        navData,
        settings,
        searchEngines,
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
