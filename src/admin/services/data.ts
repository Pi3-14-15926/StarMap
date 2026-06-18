/* 统一数据服务 - 自动切换本地模式和 GitHub 模式 */
import { api as githubApi, isLoggedIn } from './github'
import { localApi } from './local'

function isLocal(): boolean {
  return localStorage.getItem('starmap_local_mode') === 'true'
}

/* 统一 API：自动根据模式选择数据源 */
export const api = {
  getDb: () => isLocal() ? localApi.getDb() : githubApi.getDb(),
  saveDb: (data: any) => isLocal() ? localApi.saveDb(data) : githubApi.saveDb(data),
  getSettings: () => isLocal() ? localApi.getSettings() : githubApi.getSettings(),
  saveSettings: (data: any) => isLocal() ? localApi.saveSettings(data) : githubApi.saveSettings(data),
  getSearch: () => isLocal() ? localApi.getSearch() : githubApi.getSearch(),
  saveSearch: (data: any) => isLocal() ? localApi.saveSearch(data) : githubApi.saveSearch(data),
  getTags: () => isLocal() ? localApi.getTags() : githubApi.getTags(),
  saveTags: (data: any) => isLocal() ? localApi.saveTags(data) : githubApi.saveTags(data),
}

/* 检查当前模式 */
export function getMode(): 'local' | 'github' {
  return isLocal() ? 'local' : 'github'
}
