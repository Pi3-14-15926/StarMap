/* 本地数据服务 - 免登录模式，读写 localStorage */
import defaultDb from '../../../data/nav/db.json'
import defaultSettings from '../../../data/nav/settings.json'
import defaultSearch from '../../../data/nav/search.json'
import defaultTags from '../../../data/nav/tag.json'

const STORAGE_KEYS = {
  db: 'starmap_local_db',
  settings: 'starmap_local_settings',
  search: 'starmap_local_search',
  tags: 'starmap_local_tags',
} as const

/* 读取本地数据，没有则用默认值 */
function loadLocal<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* 解析失败用默认值 */ }
  return defaults
}

/* 保存到 localStorage */
function saveLocal(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify(data))
}

/* 本地模式 API - 与 GitHub API 接口一致 */
export const localApi = {
  getDb: async () => ({
    content: loadLocal(STORAGE_KEYS.db, defaultDb),
    sha: 'local',
  }),
  saveDb: async (data: any) => {
    saveLocal(STORAGE_KEYS.db, data)
  },

  getSettings: async () => ({
    content: loadLocal(STORAGE_KEYS.settings, defaultSettings),
    sha: 'local',
  }),
  saveSettings: async (data: any) => {
    saveLocal(STORAGE_KEYS.settings, data)
  },

  getSearch: async () => ({
    content: loadLocal(STORAGE_KEYS.search, defaultSearch),
    sha: 'local',
  }),
  saveSearch: async (data: any) => {
    saveLocal(STORAGE_KEYS.search, data)
  },

  getTags: async () => ({
    content: loadLocal(STORAGE_KEYS.tags, defaultTags),
    sha: 'local',
  }),
  saveTags: async (data: any) => {
    saveLocal(STORAGE_KEYS.tags, data)
  },

  /* 导出全部数据 */
  exportAll: () => {
    return {
      db: loadLocal(STORAGE_KEYS.db, defaultDb),
      settings: loadLocal(STORAGE_KEYS.settings, defaultSettings),
      search: loadLocal(STORAGE_KEYS.search, defaultSearch),
      tags: loadLocal(STORAGE_KEYS.tags, defaultTags),
    }
  },

  /* 导入全部数据 */
  importAll: (data: { db?: any; settings?: any; search?: any; tags?: any }) => {
    if (data.db) saveLocal(STORAGE_KEYS.db, data.db)
    if (data.settings) saveLocal(STORAGE_KEYS.settings, data.settings)
    if (data.search) saveLocal(STORAGE_KEYS.search, data.search)
    if (data.tags) saveLocal(STORAGE_KEYS.tags, data.tags)
  },

  /* 重置为默认数据 */
  resetAll: () => {
    localStorage.removeItem(STORAGE_KEYS.db)
    localStorage.removeItem(STORAGE_KEYS.settings)
    localStorage.removeItem(STORAGE_KEYS.search)
    localStorage.removeItem(STORAGE_KEYS.tags)
  },
}
