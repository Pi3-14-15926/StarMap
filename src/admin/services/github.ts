/* GitHub API 服务 - 使用 Token 读写仓库文件 */
import { getToken, getRepoInfo } from './auth'
import { localApi } from './local'

const GITHUB_API = 'https://api.github.com'

/* GitHub API 请求头 */
function headers(): Record<string, string> {
  const token = getToken()
  const h: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

/* 获取文件内容和 SHA */
export async function getFile(path: string): Promise<{ content: any; sha: string } | null> {
  const repo = getRepoInfo()
  if (!repo) throw new Error('未登录')
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${repo.owner}/${repo.repo}/contents/${path}?ref=${repo.branch}`,
      { headers: headers() }
    )
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`获取文件失败 (HTTP ${res.status})`)
    }
    const data = await res.json()
    const text = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))
    return { content: JSON.parse(text), sha: data.sha }
  } catch (err: any) {
    if (err.message?.includes('404')) return null
    throw err
  }
}

/* 更新文件（Git 提交） */
export async function updateFile(path: string, data: any, message: string): Promise<void> {
  const repo = getRepoInfo()
  if (!repo) throw new Error('未登录')
  const existing = await getFile(path)
  const body: any = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
    branch: repo.branch,
  }
  if (existing?.sha) body.sha = existing.sha
  const res = await fetch(
    `${GITHUB_API}/repos/${repo.owner}/${repo.repo}/contents/${path}`,
    { method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new Error(err.message || '更新文件失败')
  }
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
  saveSettings: (data: any) => updateFile(DATA_PATHS.settings, data, 'update(settings): 更新网站设置'),
  getSearch: () => getFile(DATA_PATHS.search),
  saveSearch: (data: any) => updateFile(DATA_PATHS.search, data, 'update(search): 更新搜索引擎'),
  getTags: () => getFile(DATA_PATHS.tag),
  saveTags: (data: any) => updateFile(DATA_PATHS.tag, data, 'update(tag): 更新标签'),
}

/* ===== 批量提交（用于发布到 GitHub） ===== */

/** 通过 Git Trees API 批量提交所有文件（单次 commit） */
async function commitFilesBatch(files: { path: string; content: string }[], message: string): Promise<void> {
  const repo = getRepoInfo()
  if (!repo) throw new Error('未登录')
  const h = headers()

  // 1. 获取当前 main 分支的 commit SHA 和 tree SHA
  const refRes = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.repo}/git/refs/heads/${repo.branch}`, { headers: h })
  if (!refRes.ok) throw new Error('获取分支引用失败')
  const refData = await refRes.json()
  const currentCommitSha = refData.object.sha

  const commitRes = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.repo}/git/commits/${currentCommitSha}`, { headers: h })
  if (!commitRes.ok) throw new Error('获取 commit 失败')
  const commitData = await commitRes.json()
  const baseTreeSha = commitData.tree.sha

  // 2. 创建新 tree（批量添加/更新文件）
  const treeItems = files.map(f => ({
    path: f.path,
    mode: '100644',
    type: 'blob' as const,
    content: f.content,
  }))

  const treeRes = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.repo}/git/trees`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
  })
  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({ message: `HTTP ${treeRes.status}` }))
    throw new Error(err.message || '创建 tree 失败')
  }
  const newTreeSha = (await treeRes.json()).sha

  // 3. 创建 commit（指向新 tree）
  const newCommitRes = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.repo}/git/commits`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      message,
      tree: newTreeSha,
      parents: [currentCommitSha],
    }),
  })
  if (!newCommitRes.ok) {
    const err = await newCommitRes.json().catch(() => ({ message: `HTTP ${newCommitRes.status}` }))
    throw new Error(err.message || '创建 commit 失败')
  }
  const newCommitSha = (await newCommitRes.json()).sha

  // 4. 更新分支引用
  const updateRes = await fetch(`${GITHUB_API}/repos/${repo.owner}/${repo.repo}/git/refs/heads/${repo.branch}`, {
    method: 'PATCH',
    headers: h,
    body: JSON.stringify({ sha: newCommitSha, force: false }),
  })
  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({ message: `HTTP ${updateRes.status}` }))
    throw new Error(err.message || '更新分支失败')
  }
}

/** 将 localStorage 中的所有数据提交到仓库，触发 GitHub Pages 重新构建 */
export async function commitAllData(): Promise<{ files: number; repo: string }> {
  const token = getToken()
  if (!token) throw new Error('未登录，请先登录')
  const repo = getRepoInfo()
  if (!repo) throw new Error('未配置仓库')

  const enc = (obj: any) => JSON.stringify(obj, null, 2)

  // 从 localStorage 读取所有数据（而非 GitHub）
  const local = localApi.exportAll()
  const db = local.db
  const settings = local.settings
  const search = local.search
  const tags = local.tags

  if (!db.length) throw new Error('没有数据可提交')

  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const message = `chore(data): 发布数据更新 ${timestamp}`

  // 构建文件列表
  const files: { path: string; content: string }[] = [
    { path: 'data/nav/db.json', content: enc(db) },
    { path: 'data/nav/settings.json', content: enc(settings) },
    { path: 'data/nav/search.json', content: enc(search) },
    { path: 'data/nav/tag.json', content: enc(tags) },
  ]

  await commitFilesBatch(files, message)

  return { files: files.length, repo: `${repo.owner}/${repo.repo}` }
}
