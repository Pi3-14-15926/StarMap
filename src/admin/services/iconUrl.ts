/** 图标 CDN URL 重写引擎
 *  将 raw.githubusercontent.com 链接替换为 CDN 加速链接
 */
import { getRepoInfo } from './auth'

export type IconCdnMode = 'jsdelivr' | 'statically' | 'githack' | 'custom' | 'none'

const GH_RAW = 'raw.githubusercontent.com'

export function resolveIconUrl(url: string, mode?: IconCdnMode, customBase?: string): string {
  if (!url || !mode || mode === 'none') return url

  const { owner, repo } = getRepoInfo()

  // 本仓库的图标
  if (owner && repo) {
    if (url.includes(`${GH_RAW}/${owner}/${repo}/`)) {
      return applyCdn(url, mode, customBase)
    }
    // github.com/owner/repo/blob|raw/branch/path
    const m = url.match(/https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)/i)
    if (m && m[1] === owner && m[2] === repo) {
      return applyCdn(`https://${GH_RAW}/${owner}/${repo}/${m[3]}/${m[4]}`, mode, customBase)
    }
  }

  // 任何 raw.githubusercontent.com 链接也加速
  if (url.includes(GH_RAW)) {
    return applyCdn(url, mode, customBase)
  }

  return url
}

function applyCdn(rawUrl: string, mode: IconCdnMode, customBase?: string): string {
  if (mode === 'jsdelivr') return toJsdelivr(rawUrl)
  if (mode === 'statically') return toStatically(rawUrl)
  if (mode === 'githack') return toGithack(rawUrl)
  if (mode === 'custom') {
    if (!customBase) return rawUrl
    return customBase.replace(/\/+$/, '') + '/' + rawUrl.replace(/^https?:\/\//, '')
  }
  return rawUrl
}

function toJsdelivr(rawUrl: string): string {
  const m = rawUrl.match(/https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/)
  if (!m) return rawUrl
  return `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@${m[3]}/${m[4]}`
}

function toStatically(rawUrl: string): string {
  const m = rawUrl.match(/https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/)
  if (!m) return rawUrl
  return `https://cdn.statically.io/gh/${m[1]}/${m[2]}/${m[3]}/${m[4]}`
}

function toGithack(rawUrl: string): string {
  const m = rawUrl.match(/https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/)
  if (!m) return rawUrl
  return `https://raw.githack.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`
}

export function buildIconUrls(filename: string, mode: IconCdnMode, customBase?: string) {
  const { owner, repo } = getRepoInfo()
  const rawUrl = `https://${GH_RAW}/${owner}/${repo}/image/public/icons/${filename}`
  const cdnUrl = applyCdn(rawUrl, mode, customBase)
  return { rawUrl, cdnUrl }
}

export function describeCdn(mode: IconCdnMode): string {
  switch (mode) {
    case 'jsdelivr': return 'jsDelivr — 国内可用，自动缓存，推荐'
    case 'statically': return 'Statically — 全球 CDN，稳定可靠'
    case 'githack': return 'GitHack — 开源方案，社区维护'
    case 'custom': return '自定义 — 使用你自己的 CDN 域名'
    case 'none': return '不使用加速 — 直连 GitHub'
  }
}
