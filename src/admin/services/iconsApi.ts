/** GitHub 图标管理 API
 *  上传/列表/删除图标到 GitHub 仓库的 image 分支
 */
import { getToken, getRepoInfo } from './auth'

const API_BASE = 'https://api.github.com'
const RAW_BASE = 'https://raw.githubusercontent.com'
export const ICON_BRANCH = 'image'
export const ICON_PATH = 'public/icons'

function authHeaders(): Record<string, string> {
  const token = getToken()
  const h: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

async function gh<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string> || {}) },
  })
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data as T
}

export interface IconListItem {
  name: string
  path: string
  sha: string
  size: number
  rawUrl: string
  htmlUrl: string
  uploadedAt?: string
}

export interface UploadResult {
  name: string
  path: string
  sha: string
  size: number
  rawUrl: string
  commitUrl: string
  overwritten: boolean
  branchCreated: boolean
}

async function branchExists(branch: string): Promise<boolean> {
  const { owner, repo } = getRepoInfo()
  try {
    await gh(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`)
    return true
  } catch { return false }
}

async function createBranch(branch: string, fromBranch: string): Promise<void> {
  const { owner, repo } = getRepoInfo()
  const refData = await gh<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(fromBranch)}`)
  await gh(`/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: refData.object.sha }),
  })
}

export async function listIcons(): Promise<{ items: IconListItem[]; error?: string }> {
  const { owner, repo } = getRepoInfo()
  try {
    if (!(await branchExists(ICON_BRANCH))) return { items: [] }
    const data = await gh<any[]>(`/repos/${owner}/${repo}/contents/${encodeURIComponent(ICON_PATH)}?ref=${encodeURIComponent(ICON_BRANCH)}`)
    if (!Array.isArray(data)) return { items: [] }
    const items: IconListItem[] = data
      .filter((i) => i.type === 'file' && /\.(png|jpe?g|webp|gif|svg)$/i.test(i.name))
      .map((i) => ({
        name: i.name,
        path: i.path,
        sha: i.sha,
        size: i.size,
        rawUrl: `${RAW_BASE}/${owner}/${repo}/${ICON_BRANCH}/${i.path}`,
        htmlUrl: i.html_url,
      }))
    return { items }
  } catch (e: any) {
    return { items: [], error: e.message }
  }
}

export async function uploadIcon(filename: string, contentBase64: string): Promise<UploadResult> {
  const { owner, repo } = getRepoInfo()
  const token = getToken()
  if (!token) throw new Error('请先登录后台（需要 GitHub Token）')

  let branchCreated = false
  if (!(await branchExists(ICON_BRANCH))) {
    const repoData = await gh<{ default_branch: string }>(`/repos/${owner}/${repo}`)
    await createBranch(ICON_BRANCH, repoData.default_branch)
    branchCreated = true
  }

  const safeName = filename.replace(/[\/\\\x00-\x1f]/g, '_').replace(/^[.\s]+|[.\s]+$/g, '').slice(0, 80) || 'icon'
  const fullPath = `${ICON_PATH}/${safeName}`

  let existingSha: string | undefined
  try {
    const exist = await gh<{ sha: string }>(`/repos/${owner}/${repo}/contents/${encodeURIComponent(fullPath)}?ref=${encodeURIComponent(ICON_BRANCH)}`)
    existingSha = exist.sha
  } catch { /* 404 = new file */ }

  const putRes = await gh<{ content: { name: string; path: string; sha: string; size: number }; commit: { html_url: string } }>(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(fullPath)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: existingSha ? `chore(icons): update ${safeName}` : `chore(icons): add ${safeName}`,
        content: contentBase64,
        branch: ICON_BRANCH,
        sha: existingSha,
      }),
    },
  )

  const rawUrl = `${RAW_BASE}/${owner}/${repo}/${ICON_BRANCH}/${putRes.content.path}`
  return {
    name: putRes.content.name,
    path: putRes.content.path,
    sha: putRes.content.sha,
    size: putRes.content.size,
    rawUrl,
    commitUrl: putRes.commit.html_url,
    overwritten: !!existingSha,
    branchCreated,
  }
}

export async function deleteIcon(path: string, sha: string): Promise<{ success: boolean }> {
  const { owner, repo } = getRepoInfo()
  const token = getToken()
  if (!token) throw new Error('请先登录后台（需要 GitHub Token）')

  try {
    await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `chore(icons): remove ${path.split('/').pop()}`,
        sha,
        branch: ICON_BRANCH,
      }),
    })
    return { success: true }
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (/404|not found/i.test(msg)) return { success: true }
    throw e
  }
}
