import { useState } from 'react'
import { api } from '../services/data'

export function BookmarkImport() {
  const [importData, setImportData] = useState('')
  const [message, setMessage] = useState('')

  /* 解析浏览器导出的书签 HTML */
  const parseBookmark = (html: string) => {
    const sites: any[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const links = doc.querySelectorAll('a')
    links.forEach((a) => {
      const href = a.getAttribute('href')
      const name = a.textContent?.trim()
      if (href && name && !href.startsWith('javascript:')) {
        try {
          const hostname = new URL(href).hostname
          sites.push({
            name,
            desc: '',
            url: href,
            icon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
            rate: 4,
            tag: '书签导入',
          })
        } catch { /* 无效 URL 跳过 */ }
      }
    })
    return sites
  }

  /* 导入 */
  const handleImport = () => {
    if (!importData.trim()) { setMessage('❌ 请粘贴书签数据'); return }
    try {
      const sites = parseBookmark(importData)
      if (sites.length === 0) { setMessage('❌ 未找到有效书签'); return }
      const json = JSON.stringify(sites, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bookmarks-import.json'
      a.click()
      URL.revokeObjectURL(url)
      setMessage(`✅ 已导出 ${sites.length} 个书签到 JSON 文件`)
    } catch { setMessage('❌ 解析失败') }
  }

  /* 导出当前数据为 JSON */
  const handleExport = async () => {
    try {
      const res = await api.getDb()
      if (!res?.content) { setMessage('❌ 获取数据失败'); return }
      const json = JSON.stringify(res.content, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'starmap-export.json'
      a.click()
      URL.revokeObjectURL(url)
      setMessage('✅ 已导出全部数据')
    } catch { setMessage('❌ 导出失败') }
  }

  /* 导出为 HTML 书签格式 */
  const handleExportHtml = async () => {
    try {
      const res = await api.getDb()
      if (!res?.content) { setMessage('❌ 获取数据失败'); return }
      const data = res.content
      let html = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>StarMap Bookmarks</TITLE>\n<H1>StarMap Bookmarks</H1>\n<DL><p>\n'
      for (const cat of data) {
        html += `  <DT><H3>${cat.title}</H3>\n  <DL><p>\n`
        for (const sub of cat.children || []) {
          html += `    <DT><H3>${sub.title}</H3>\n    <DL><p>\n`
          for (const web of sub.nav || []) {
            html += `      <DT><A HREF="${web.url}">${web.name}</A>\n`
          }
          html += '    </DL><p>\n'
        }
        html += '  </DL><p>\n'
      }
      html += '</DL><p>'
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'starmap-bookmarks.html'
      a.click()
      URL.revokeObjectURL(url)
      setMessage('✅ 已导出 HTML 书签文件')
    } catch { setMessage('❌ 导出失败') }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <span>书签导入 / 导出</span>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
      </div>

      <div className="admin-section">
        <h3>导出数据</h3>
        <p className="admin-section-desc">将导航数据导出为 JSON 或 HTML 书签格式</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="admin-btn-primary" onClick={handleExport}>📦 导出 JSON</button>
          <button className="admin-btn" onClick={handleExportHtml}>📑 导出 HTML 书签</button>
        </div>
      </div>

      <div className="admin-section">
        <h3>导入书签</h3>
        <p className="admin-section-desc">粘贴浏览器导出的 HTML 书签文件内容，解析后下载为 JSON</p>
        <textarea className="admin-textarea" rows={8} value={importData} onChange={(e) => setImportData(e.target.value)}
          placeholder={'粘贴 HTML 书签内容...\n\n格式示例:\n<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<DL><p>\n  <DT><A HREF="https://example.com">Example</A>\n</DL><p>'} />
        <button className="admin-btn-primary" onClick={handleImport} style={{ marginTop: 8 }}>📥 解析并导出</button>
      </div>
    </div>
  )
}
