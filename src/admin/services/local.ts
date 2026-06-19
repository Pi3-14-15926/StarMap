/* 本地数据服务 - 从 localStorage 读取（有数据则用，没有则回退到 JSON 默认） */
import defaultDb from '../../../data/nav/db.json'
import defaultSettings from '../../../data/nav/settings.json'
import defaultSearch from '../../../data/nav/search.json'
import defaultTags from '../../../data/nav/tag.json'

/* 读取：优先 localStorage，没有或为空则用默认值 */
function loadLocal<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw != null && raw !== '') {
      const parsed = JSON.parse(raw) as any
      if (parsed != null) {
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as T
        if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) return parsed as T
      }
    }
  } catch { /* 忽略 */ }
  return defaults
}

/* 保存到 localStorage */
function saveLocal(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data))
}

/* 本地 API */
export const localApi = {
  getDb: async () => ({ content: loadLocal('starmap_local_db', defaultDb), sha: 'local' as const }),
  saveDb: async (data: any) => { saveLocal('starmap_local_db', data) },

  getSettings: async () => ({ content: loadLocal('starmap_local_settings', defaultSettings), sha: 'local' as const }),
  saveSettings: async (data: any) => { saveLocal('starmap_local_settings', data) },

  getSearch: async () => ({ content: loadLocal('starmap_local_search', defaultSearch), sha: 'local' as const }),
  saveSearch: async (data: any) => { saveLocal('starmap_local_search', data) },

  getTags: async () => ({ content: loadLocal('starmap_local_tags', defaultTags), sha: 'local' as const }),
  saveTags: async (data: any) => { saveLocal('starmap_local_tags', data) },

  exportAll: () => ({
    db: loadLocal('starmap_local_db', defaultDb),
    settings: loadLocal('starmap_local_settings', defaultSettings),
    search: loadLocal('starmap_local_search', defaultSearch),
    tags: loadLocal('starmap_local_tags', defaultTags),
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