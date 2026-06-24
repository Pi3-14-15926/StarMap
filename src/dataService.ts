/**
 * 运行时数据加载服务
 * - 从 public/data/nav/*.json 运行时 fetch（而非构建时 import）
 * - 使用 ?v=<updatedAt> 击穿浏览器/CDN 缓存
 * - 定期轮询 manifest.json 检测数据更新
 */
import type { NavData, Settings, SearchEngine, TagItem } from '@ui/types'

const BASE = import.meta.env.BASE_URL || '/'

/* 版本号：用于缓存击穿 */
let dataVersion = new Date().toISOString().slice(0, 10)

/* 当前数据 */
let currentData: {
  db: NavData
  settings: Settings
  search: SearchEngine[]
  tags: TagItem[]
} | null = null

/* 更新回调 */
type UpdateCallback = () => void
const listeners: Set<UpdateCallback> = new Set()

/* manifest 数据 */
interface Manifest {
  updatedAt: string
}
let lastUpdatedAt = ''

/* ===== 带缓存击穿的 fetch ===== */
async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const sep = url.includes('?') ? '&' : '?'
    const res = await fetch(`${url}${sep}v=${dataVersion}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/* ===== 加载 manifest ===== */
async function loadManifest(): Promise<string | null> {
  const manifest = await fetchJSON<Manifest>(`${BASE}data/nav/manifest.json`)
  return manifest?.updatedAt || null
}

/* ===== 加载所有数据 ===== */
export async function loadAllData(): Promise<typeof currentData> {
  const [db, settings, search, tags] = await Promise.all([
    fetchJSON<NavData>(`${BASE}data/nav/db.json`),
    fetchJSON<Settings>(`${BASE}data/nav/settings.json`),
    fetchJSON<SearchEngine[]>(`${BASE}data/nav/search.json`),
    fetchJSON<TagItem[]>(`${BASE}data/nav/tag.json`),
  ])

  currentData = {
    db: (db || []) as NavData,
    settings: (settings || {} as Settings),
    search: (search || []) as SearchEngine[],
    tags: (tags || []) as TagItem[],
  }

  return currentData
}

/* ===== 获取当前数据（同步） ===== */
export function getData() {
  return currentData
}

/* ===== 初始化：首次加载 ===== */
export async function initData(): Promise<typeof currentData> {
  /* 先尝试 manifest 获取最新版本号 */
  const remoteUpdatedAt = await loadManifest()
  if (remoteUpdatedAt) {
    dataVersion = remoteUpdatedAt
    lastUpdatedAt = remoteUpdatedAt
  }

  /* 加载所有数据 */
  return await loadAllData()
}

/* ===== 轮询检测更新 ===== */
let pollTimer: ReturnType<typeof setInterval> | null = null
const POLL_INTERVAL = 5 * 60 * 1000 /* 5 分钟 */

export function startPolling() {
  stopPolling()

  /* 定期检查 manifest */
  pollTimer = setInterval(async () => {
    if (document.hidden) return /* 标签页不可见时跳过 */
    await checkForUpdate()
  }, POLL_INTERVAL)

  /* 标签页可见性变化时检查 */
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}

async function handleVisibilityChange() {
  if (!document.hidden) {
    await checkForUpdate()
  }
}

async function checkForUpdate() {
  try {
    const remoteUpdatedAt = await loadManifest()
    if (remoteUpdatedAt && remoteUpdatedAt !== lastUpdatedAt) {
      /* 数据有更新，重新加载 */
      lastUpdatedAt = remoteUpdatedAt
      dataVersion = remoteUpdatedAt
      await loadAllData()
      /* 通知所有监听者 */
      listeners.forEach(cb => cb())
    }
  } catch { /* 忽略网络错误 */ }
}

/* ===== 注册更新监听 ===== */
export function onUpdate(cb: UpdateCallback) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}
