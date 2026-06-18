/* GitHub API 服务 - 使用 Token 读写仓库文件 */
import axios from 'axios'
import { Base64 } from 'js-base64'

const GITHUB_API = 'https://api.github.com'

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

/* 从 localStorage 读取配置 */
export function getConfig(): GitHubConfig | null {
  const token = localStorage.getItem('starmap_token')
  const repoUrl = localStorage.getItem('starmap_repo') || ''
  const branch = localStorage.getItem('starmap_branch') || 'main'
  if (!token || !repoUrl) return null
  const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
  if (!match) return null
  return { token, owner: match[1], repo: match[2], branch }
}

/* 保存配置到 localStorage */
export function setConfig(token: string, repoUrl: string, branch: string) {
  localStorage.setItem('starmap_token', token)
  localStorage.setItem('starmap_repo', repoUrl)
  localStorage.setItem('starmap_branch', branch)
}

/* 清除配置 */
export function clearConfig() {
  localStorage.removeItem('starmap_token')
  localStorage.removeItem('starmap_repo')
  localStorage.removeItem('starmap_branch')
}

/* 是否已登录 */
export function isLoggedIn(): boolean {
  return !!getConfig()
}

/* 验证 Token */
export async function verifyToken(token: string): Promise<{ valid: boolean; user?: string; error?: string }> {
  try {
    const res = await axios.get(`${GITHUB_API}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { valid: true, user: res.data.login }
  } catch (err: any) {
    return { valid: false, error: err.response?.data?.message || '验证失败' }
  }
}

/* 获取文件内容和 SHA */
export async function getFile(path: string): Promise<{ content: any; sha: string } | null> {
  const config = getConfig()
  if (!config) throw new Error('未登录')
  try {
    const res = await axios.get(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}`,
      { headers: { Authorization: `Bearer ${config.token}` }, params: { ref: config.branch } }
    )
    return { content: JSON.parse(Base64.decode(res.data.content)), sha: res.data.sha }
  } catch (err: any) {
    if (err.response?.status === 404) return null
    throw err
  }
}

/* 更新文件（Git 提交） */
export async function updateFile(path: string, data: any, message: string): Promise<void> {
  const config = getConfig()
  if (!config) throw new Error('未登录')
  const existing = await getFile(path)
  await axios.put(
    `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}`,
    {
      message,
      content: Base64.encode(JSON.stringify(data, null, 2)),
      sha: existing?.sha || undefined,
      branch: config.branch,
    },
    { headers: { Authorization: `Bearer ${config.token}` } }
  )
}

/* 数据文件路径常量 */
export const DATA_PATHS = {
  db: 'data/nav/db.json',
  settings: 'data/nav/settings.json',
  search: 'data/nav/search.json',
  tag: 'data/nav/tag.json',
} as const

/* 便捷方法：读取各类数据 */
export const api = {
  getDb: () => getFile(DATA_PATHS.db),
  saveDb: (data: any) => updateFile(DATA_PATHS.db, data, 'update(data): 更新导航数据'),
  getSettings: () => getFile(DATA_PATHS.settings),
  saveSettings: (data: any) => updateFile(DATA_PATHS.settings, data, 'update(settings): 更新系统设置'),
  getSearch: () => getFile(DATA_PATHS.search),
  saveSearch: (data: any) => updateFile(DATA_PATHS.search, data, 'update(search): 更新搜索引擎'),
  getTags: () => getFile(DATA_PATHS.tag),
  saveTags: (data: any) => updateFile(DATA_PATHS.tag, data, 'update(tag): 更新标签'),
}
