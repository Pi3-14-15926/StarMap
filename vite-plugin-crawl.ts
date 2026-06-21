/** Vite 插件：本地网站信息爬取代理
 *  在 dev 模式下提供 /api/crawl 端点，服务端抓取网页并提取元数据
 */
import type { Plugin } from 'vite'

interface CrawlResult {
  url: string
  title: string
  description: string
  icon: string
}

function resolveUrl(href: string, base: string): string {
  try { return new URL(href, base).href } catch { return href }
}

function extractMeta(html: string, pageUrl: string): CrawlResult {
  const result: CrawlResult = { url: pageUrl, title: '', description: '', icon: '' }

  // 提取 <title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (titleMatch) result.title = titleMatch[1].trim()

  // 提取 og:title
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)
  if (ogTitle) result.title = ogTitle[1].trim()

  // 提取 description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
  if (descMatch) result.description = descMatch[1].trim()

  // 提取 og:description
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)
  if (ogDesc) result.description = ogDesc[1].trim()

  // 提取图标 - 按优先级
  const iconPatterns = [
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']*)["']/i,
    /<link[^>]+rel=["']apple-touch-icon-precomposed["'][^>]+href=["']([^"']*)["']/i,
    /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']*)["']/i,
    /<link[^>]+rel=["']shortcut icon["'][^>]+href=["']([^"']*)["']/i,
    /<meta[^>]+name=["']msapplication-TileImage["'][^>]+content=["']([^"']*)["']/i,
    /<meta[^>]+name=["']msapplication-TileColor["'][^>]+content=["']([^"']*)["']/i,
  ]

  for (const pattern of iconPatterns) {
    const m = html.match(pattern)
    if (m && m[1] && !m[1].includes('data:')) {
      result.icon = resolveUrl(m[1], pageUrl)
      break
    }
  }

  // 兜底：尝试 /favicon.ico
  if (!result.icon) {
    try {
      const origin = new URL(pageUrl).origin
      result.icon = `${origin}/favicon.ico`
    } catch { /* 忽略 */ }
  }

  return result
}

export function crawlPlugin(): Plugin {
  return {
    name: 'starmap-crawl',
    configureServer(server) {
      server.middlewares.use('/api/crawl', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')

        let body = ''
        for await (const chunk of req) body += chunk

        try {
          const { url } = JSON.parse(body)
          if (!url) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: '缺少 url 参数' }))
            return
          }

          // 验证 URL
          new URL(url)

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10000)

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            },
            signal: controller.signal,
            redirect: 'follow',
          })

          clearTimeout(timeout)

          const html = await response.text()
          const result = extractMeta(html, url)

          res.statusCode = 200
          res.end(JSON.stringify(result))
        } catch (err: any) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message || '爬取失败' }))
        }
      })
    },
  }
}
