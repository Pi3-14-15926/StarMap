import { resolve } from 'path'
import { writeFileSync } from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin } from 'vite'

function handleBakeDefaults(req: IncomingMessage, res: ServerResponse) {
  let raw = ''
  req.on('data', (chunk: string) => (raw += chunk))
  req.on('end', () => {
    try {
      const settings = JSON.parse(raw)
      const code = `// 此文件由 "写入默认" 功能自动生成，请勿手动修改
import type { Settings } from '../types'

export const DEFAULT_SETTINGS: Settings = ${JSON.stringify(settings, null, 2)}
`
      const filePath = resolve(__dirname, 'src', 'defaults.ts')
      writeFileSync(filePath, code, 'utf-8')
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true }))
    } catch (e: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: e.message }))
    }
  })
  req.on('error', () => res.end())
}

export function bakeDefaultsPlugin(): Plugin {
  return {
    name: 'bake-defaults-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next()
        if (req.method === 'POST' && req.url === '/__bake-defaults') {
          handleBakeDefaults(req, res)
          return
        }
        next()
      })
    },
  }
}
