/* 统一数据服务 - 始终从本地读取数据，GitHub 仅用于发布 */
import { localApi } from './local'

/* 统一 API：始终使用本地数据源 */
export const api = {
  getDb: () => localApi.getDb(),
  saveDb: (data: any) => localApi.saveDb(data),
  getSettings: () => localApi.getSettings(),
  saveSettings: (data: any) => localApi.saveSettings(data),
  getSearch: () => localApi.getSearch(),
  saveSearch: (data: any) => localApi.saveSearch(data),
  getTags: () => localApi.getTags(),
  saveTags: (data: any) => localApi.saveTags(data),
}

/* 检查当前模式 */
export function getMode(): 'local' | 'github' {
  return 'local'
}
