import { useState, useEffect, useRef, useMemo } from 'react'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { getToken } from '../services/auth'
import { listIcons, uploadIcon, deleteIcon, type IconListItem } from '../services/iconsApi'
import { compressImage, blobToBase64, fmtSize } from '../services/imageCompressor'
import { resolveIconUrl } from '../services/iconUrl'

export function Icons() {
  const [icons, setIcons] = useState<IconListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { confirm } = useConfirm()
  const toast = useToast()
  const pageSize = 30

  const loggedIn = !!getToken()

  useEffect(() => { if (loggedIn) loadIcons() }, [loggedIn])

  const loadIcons = async () => {
    setLoading(true)
    try {
      const r = await listIcons()
      if (r.error) { toast.error(r.error); setIcons([]) }
      else setIcons(r.items)
    } catch (e: any) { toast.error(e.message); setIcons([]) }
    finally { setLoading(false) }
  }

  const filteredIcons = useMemo(() => {
    if (!keyword.trim()) return icons
    const kw = keyword.toLowerCase()
    return icons.filter((i) => i.name.toLowerCase().includes(kw))
  }, [icons, keyword])

  const sortedIcons = useMemo(() => {
    const list = [...filteredIcons]
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'date') {
        cmp = (a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0) - (b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0)
      } else {
        cmp = a.name.localeCompare(b.name, 'zh-Hans-CN')
      }
      return sortOrder === 'desc' ? -cmp : cmp
    })
    return list
  }, [filteredIcons, sortBy, sortOrder])

  const totalPages = Math.max(1, Math.ceil(sortedIcons.length / pageSize))
  const pagedIcons = sortedIcons.slice((page - 1) * pageSize, page * pageSize)

  const setSort = (by: 'date' | 'name') => {
    if (sortBy === by) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    else { setSortBy(by); setSortOrder('desc') }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) { toast.error('未选择图片文件'); return }

    setUploading(true)
    setUploadProgress({ done: 0, total: list.length })
    let okCount = 0

    for (const file of list) {
      try {
        const compressed = await compressImage(file, { maxSize: 256, quality: 0.85 })
        const base64 = await blobToBase64(compressed.blob)
        const result = await uploadIcon(compressed.filename, base64)
        okCount++
        const newItem: IconListItem = {
          name: result.name, path: result.path, sha: result.sha,
          size: result.size, rawUrl: result.rawUrl, htmlUrl: result.commitUrl,
          uploadedAt: new Date().toISOString(),
        }
        if (result.overwritten) {
          setIcons((prev) => prev.map((i) => i.name === result.name ? newItem : i))
        } else {
          setIcons((prev) => [...prev, newItem])
        }
      } catch (e: any) {
        toast.error(`${file.name} 上传失败: ${e.message}`)
      }
      setUploadProgress((p) => ({ ...p, done: p.done + 1 }))
    }
    setUploading(false)
    if (okCount > 0) toast.success(`已上传 ${okCount} 个图标`)
  }

  const handleDelete = async (item: IconListItem) => {
    const ok = await confirm({ title: '删除图标', description: `确定要删除图标「${item.name}」吗？` })
    if (!ok) return
    const snapshot = [...icons]
    setIcons((prev) => prev.filter((i) => i.name !== item.name))
    setSelected((prev) => { const n = new Set(prev); n.delete(item.name); return n })
    try {
      await deleteIcon(item.path, item.sha)
      toast.success(`已删除: ${item.name}`)
    } catch (e: any) {
      setIcons(snapshot)
      toast.error(e.message)
    }
  }

  const handleBatchDelete = async () => {
    const ok = await confirm({ title: '批量删除图标', description: `确定要删除选中的 ${selected.size} 个图标吗？此操作不可恢复。` })
    if (!ok) return
    const items = icons.filter((i) => selected.has(i.name))
    for (const item of items) {
      try { await deleteIcon(item.path, item.sha) } catch { /* 忽略 */ }
    }
    setIcons((prev) => prev.filter((i) => !selected.has(i.name)))
    setSelected(new Set())
    toast.success('批量删除成功')
  }

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filteredIcons.length) setSelected(new Set())
    else setSelected(new Set(filteredIcons.map((i) => i.name)))
  }

  const copyUrl = async (url: string) => {
    try { await navigator.clipboard.writeText(url); toast.success('已复制到剪贴板') }
    catch { toast.error('复制失败') }
  }

  if (!loggedIn) return <div className="admin-loading">请先登录后台以使用图标管理</div>

  return (
    <div className="icons-scroll">
      {/* 页面头部 */}
      <div className="page-head">
        <div>
          <h2 className="page-title"><span className="page-title-emoji">🖼️</span>图标管理</h2>
          <p className="page-desc">上传、查看、管理网站图标</p>
        </div>
        <div className="head-actions">
          <button className="btn-primary" onClick={loadIcons} disabled={loading}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'spinning' : ''}>
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            刷新
          </button>
        </div>
      </div>

      {/* 上传区 */}
      <section
        className={`upload-zone ${dragOver ? 'active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files) }}
      >
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
        <div className="upload-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="upload-text">
          <div className="upload-title">
            {uploading ? `上传中 ${uploadProgress.done} / ${uploadProgress.total}` : '拖拽图片到此处，或点击选择'}
          </div>
          <div className="upload-desc">支持 PNG / JPG / SVG / GIF · 自动压缩为 256×256 WebP · 质量 0.85</div>
        </div>
      </section>

      {/* 图标库 */}
      <section className="library-card">
        <header className="library-head">
          <div>
            <h3 className="library-title">图标库</h3>
            <p className="library-sub">{icons.length} 个图标</p>
          </div>
          <div className="library-actions">
            <div className="icon-search">
              <svg className="icon-search-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input className="icon-search-input" placeholder="搜索文件名..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} />
            </div>
            <button className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`} onClick={() => setSort('date')}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              日期
              <span className="sort-arrow">{sortBy === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}</span>
            </button>
            <button className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSort('name')}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h13M3 12h9M3 18h5M17 10v10M17 10l-3 3M17 10l3 3" />
              </svg>
              名称
              <span className="sort-arrow">{sortBy === 'name' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}</span>
            </button>
            {selected.size > 0 && (
              <button className="btn-danger-soft" onClick={handleBatchDelete}>
                删除选中 ({selected.size})
              </button>
            )}
            {sortedIcons.length > 0 && (
              <button className="btn-ghost" onClick={selectAll}>
                {selected.size === sortedIcons.length ? '取消全选' : '全选'}
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>正在加载图标库...</p>
          </div>
        ) : filteredIcons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illust">
              <svg viewBox="0 0 120 120" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="20" y="20" width="80" height="80" rx="14" fill="rgba(52, 120, 246, 0.08)" />
                <circle cx="44" cy="44" r="6" fill="rgba(140, 108, 255, 0.2)" />
                <polyline points="100 100 75 75 55 95 35 75 20 90" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="empty-title">
              {keyword ? <>没有匹配 "<code>{keyword}</code>" 的图标</> : '图标库还是空的'}
            </h3>
            <p className="empty-desc">
              {keyword ? '试试调整搜索关键词' : '拖拽图片到上方上传区，或点击「上传图标」按钮'}
            </p>
          </div>
        ) : (
          <div className="icon-grid">
            {pagedIcons.map((icon) => (
              <div key={icon.name} className={`icon-tile ${selected.has(icon.name) ? 'selected' : ''}`}>
                <div className="icon-tile-check" onClick={() => toggleSelect(icon.name)}>
                  {selected.has(icon.name) && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </div>
                <div className="icon-preview">
                  <img src={resolveIconUrl(icon.rawUrl) + `?v=${Date.now()}`} alt={icon.name} loading="lazy" />
                </div>
                <div className="icon-meta">
                  <div className="icon-name" title={icon.name}>{icon.name}</div>
                  <div className="icon-info">
                    <span>{fmtSize(icon.size)}</span>
                  </div>
                  <div className="icon-actions">
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copyUrl(resolveIconUrl(icon.rawUrl)) }} title="复制 CDN URL">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      URL
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(icon)}>删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="pager">
            <button className="pager-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
            <span className="pager-info">{page} / {totalPages}</span>
            <button className="pager-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
          </div>
        )}
      </section>
    </div>
  )
}
