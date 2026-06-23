/** 本地爬取服务 - 调用 Vite 插件提供的 /api/crawl 端点 */

interface CrawlResult {
  url: string
  title: string
  description: string
  icon: string
}

export async function crawlWebsite(url: string): Promise<CrawlResult> {
  const res = await fetch('/api/crawl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '爬取失败' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

/** 判断爬取功能是否可用（仅 dev 模式下 Vite 中间件生效） */
export function isCrawlAvailable(): boolean {
  return import.meta.env.DEV
}
