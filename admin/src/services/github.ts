/* GitHub API 服务 - 使用 Token 读写 data/ 目录下的 JSON 文件 */
import axios from 'axios'
import { Base64 } from 'js-base64'

const GITHUB_API = 'https://api.github.com'

interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

/* 从 localStorage 获取 Token */
function getConfig(): GitHubConfig | null {
  const token = localStorage.getItem('starmap_github_token')
  const repoUrl = localStorage.getItem('starmap_repo_url') || 'https://github.com/your-username/StarMap'
  if (!token) return null

  /* 解析 owner/repo */
  const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
  if (!match) return null

  return {
    token,
    owner: match[1],
    repo: match[2],
    branch: localStorage.getItem('starmap_branch') || 'main',
  }
}

/* 验证 Token 是否有效 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await axios.get(`${GITHUB_API}/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.status === 200
  } catch {
    return false
  }
}

/* 获取文件内容 */
export async function getFileContent(path: string): Promise<any> {
  const config = getConfig()
  if (!config) throw new Error('未配置 GitHub Token')

  try {
    const res = await axios.get(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        headers: { Authorization: `Bearer ${config.token}` },
        params: { ref: config.branch },
      }
    )
    const content = Base64.decode(res.data.content)
    return { data: JSON.parse(content), sha: res.data.sha }
  } catch (err: any) {
    if (err.response?.status === 404) {
      return { data: null, sha: null }
    }
    throw err
  }
}

/* 更新文件内容（Git 提交） */
export async function updateFileContent(
  path: string,
  content: string,
  message: string,
  sha?: string | null
): Promise<void> {
  const config = getConfig()
  if (!config) throw new Error('未配置 GitHub Token')

  await axios.put(
    `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${path}`,
    {
      message,
      content: Base64.encode(content),
      sha: sha || undefined,
      branch: config.branch,
    },
    { headers: { Authorization: `Bearer ${config.token}` } }
  )
}

/* 获取所有可用的数据文件路径 */
export const DATA_FILES = {
  nav: {
    db: 'data/nav/db.json',
    settings: 'data/nav/settings.json',
    search: 'data/nav/search.json',
    tag: 'data/nav/tag.json',
    component: 'data/nav/component.json',
    internal: 'data/nav/internal.json',
  },
} as const

/* 保存导航数据到 GitHub */
export async function saveNavData(data: any): Promise<void> {
  const path = DATA_FILES.nav.db
  const existing = await getFileContent(path)
  await updateFileContent(
    path,
    JSON.stringify(data, null, 2),
    'update(data): 更新导航数据',
    existing.sha
  )
}

/* 保存设置 */
export async function saveSettings(settings: any): Promise<void> {
  const path = DATA_FILES.nav.settings
  const existing = await getFileContent(path)
  await updateFileContent(
    path,
    JSON.stringify(settings, null, 2),
    'update(settings): 更新系统设置',
    existing.sha
  )
}

/* 保存搜索引擎配置 */
export async function saveSearchEngines(engines: any[]): Promise<void> {
  const path = DATA_FILES.nav.search
  const existing = await getFileContent(path)
  await updateFileContent(
    path,
    JSON.stringify(engines, null, 2),
    'update(search): 更新搜索引擎',
    existing.sha
  )
}

/* 保存标签 */
export async function saveTags(tags: any[]): Promise<void> {
  const path = DATA_FILES.nav.tag
  const existing = await getFileContent(path)
  await updateFileContent(
    path,
    JSON.stringify(tags, null, 2),
    'update(tag): 更新标签',
    existing.sha
  )
}

/* 保存组件配置 */
export async function saveComponents(component: any): Promise<void> {
  const path = DATA_FILES.nav.component
  const existing = await getFileContent(path)
  await updateFileContent(
    path,
    JSON.stringify(component, null, 2),
    'update(component): 更新组件配置',
    existing.sha
  )
}

export { getConfig }
