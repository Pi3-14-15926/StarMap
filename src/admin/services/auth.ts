/** GitHub Token 认证管理 */

const TOKEN_KEY = 'starmap_token'
const USER_KEY = 'starmap_user'
const REPO_KEY = 'starmap_repo'
const BRANCH_KEY = 'starmap_branch'

const DEFAULT_REPO = 'https://github.com/Pi3-14-15926/StarMap'
const DEFAULT_BRANCH = 'main'

export interface GitHubUser {
  login: string
  id: number
  avatar_url: string
  name: string | null
}

/** 保存 Token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** 获取 Token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** 清除 Token */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/** 保存用户信息 */
function setUser(user: GitHubUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/** 获取已认证用户信息 */
export function getCurrentUser(): GitHubUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** 是否已登录 */
export function isAuthenticated(): boolean {
  return !!getToken()
}

/** 保存仓库信息 */
export function setRepoInfo(repoUrl: string = DEFAULT_REPO, branch: string = DEFAULT_BRANCH): void {
  localStorage.setItem(REPO_KEY, repoUrl)
  localStorage.setItem(BRANCH_KEY, branch)
}

/** 获取仓库信息 */
export function getRepoInfo(): { owner: string; repo: string; branch: string } {
  const repoUrl = localStorage.getItem(REPO_KEY) || DEFAULT_REPO
  const branch = localStorage.getItem(BRANCH_KEY) || DEFAULT_BRANCH
  const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
  if (!match) return { owner: 'Pi3-14-15926', repo: 'StarMap', branch }
  return { owner: match[1], repo: match[2], branch }
}

/** 获取仓库显示文本 */
export function getRepoDisplay(): string {
  const info = getRepoInfo()
  return `${info.owner}/${info.repo}`
}

/** 用 GitHub API 验证 Token */
export async function validateToken(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('Token 无效或已过期')
    if (res.status === 403) throw new Error('API 频率限制，请稍后重试')
    throw new Error(`验证失败 (HTTP ${res.status})`)
  }
  const user: GitHubUser = await res.json()
  return user
}

/** 登录成功：保存 token 和用户信息 */
export function saveLogin(token: string, user: GitHubUser): void {
  setToken(token)
  setUser(user)
  setRepoInfo()
}

/** 退出登录 */
export function logout(): void {
  clearToken()
  localStorage.removeItem(REPO_KEY)
  localStorage.removeItem(BRANCH_KEY)
}
