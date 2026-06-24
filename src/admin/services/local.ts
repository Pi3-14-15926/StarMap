/* 本地数据服务 - 从 localStorage 读取（有数据则用，没有则回退到运行时 fetch） */
import type { NavData, Settings, SearchEngine, TagItem } from '@ui/types'

const BASE = import.meta.env.BASE_URL || '/'

/* 运行时 fetch 默认值（带缓存击穿） */
async function fetchDefault<T>(file: string): Promise<T> {
  try {
    const res = await fetch(`${BASE}data/nav/${file}`, { cache: 'no-store' })
    if (!res.ok) return null as T
    return await res.json()
  } catch {
    return null as T
  }
}

/* 读取：优先 localStorage，没有或为空则用默认值 */
function loadLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw != null && raw !== '') {
      const parsed = JSON.parse(raw) as any
      if (parsed != null) {
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T
        if (typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed as T
      }
    }
  } catch { /* 忽略 */ }
  return null
}

/* 保存到 localStorage */
function saveLocal(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data))
}

/* 本地 API */
export const localApi = {
  getDb: async () => ({
    content: loadLocal<NavData>('starmap_local_db') || await fetchDefault<NavData>('db.json'),
    sha: 'local' as const,
  }),
  saveDb: async (data: any) => { saveLocal('starmap_local_db', data) },

  getSettings: async () => ({
    content: loadLocal<Settings>('starmap_local_settings') || await fetchDefault<Settings>('settings.json'),
    sha: 'local' as const,
  }),
  saveSettings: async (data: any) => { saveLocal('starmap_local_settings', data) },

  getSearch: async () => ({
    content: loadLocal<SearchEngine[]>('starmap_local_search') || await fetchDefault<SearchEngine[]>('search.json'),
    sha: 'local' as const,
  }),
  saveSearch: async (data: any) => { saveLocal('starmap_local_search', data) },

  getTags: async () => ({
    content: loadLocal<TagItem[]>('starmap_local_tags') || await fetchDefault<TagItem[]>('tag.json'),
    sha: 'local' as const,
  }),
  saveTags: async (data: any) => { saveLocal('starmap_local_tags', data) },

  exportAll: async () => ({
    db: loadLocal<NavData>('starmap_local_db') || await fetchDefault<NavData>('db.json'),
    settings: loadLocal<Settings>('starmap_local_settings') || await fetchDefault<Settings>('settings.json'),
    search: loadLocal<SearchEngine[]>('starmap_local_search') || await fetchDefault<SearchEngine[]>('search.json'),
    tags: loadLocal<TagItem[]>('starmap_local_tags') || await fetchDefault<TagItem[]>('tag.json'),
  }),

  importAll: (data: { db?: any; settings?: any; search?: any; tags?: any }) => {
    if (data.db) saveLocal('starmap_local_db', data.db)
    if (data.settings) saveLocal('starmap_local_settings', data.settings)
    if (data.search) saveLocal('starmap_local_search', data.search)
    if (data.tags) saveLocal('starmap_local_tags', data.tags)
  },

  resetAll: () => {
    localStorage.removeItem('starmap_local_db')
    localStorage.removeItem('starmap_local_settings')
    localStorage.removeItem('starmap_local_search')
    localStorage.removeItem('starmap_local_tags')
  },
}
