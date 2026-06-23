/* 前台编辑弹窗 - 复用后台 admin-modal 样式 + 自动爬取 + 图标上传/选择 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { crawlWebsite, isCrawlAvailable } from '../admin/services/crawl'
import { compressImage, blobToBase64 } from '../admin/services/imageCompressor'
import { uploadIcon, listIcons, type IconListItem } from '../admin/services/iconsApi'
import { resolveIconUrl } from '../admin/services/iconUrl'
import { isAuthenticated } from '../admin/services/auth'
import type { WebItem, SubCategory, Category, TagItem } from '@ui/types'

/* ===== 标签多选下拉（复用后台 TagSelect） ===== */
function TagSelect({ value, onChange, tags }: { value: string; onChange: (v: string) => void; tags: TagItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  const sorted = [...tags].sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999))

  const toggle = (name: string) => {
    const next = selected.includes(name) ? selected.filter(s => s !== name) : [...selected, name]
    onChange(next.join(','))
  }

  return (
    <div className="tag-select" ref={ref}>
      <div className="tag-select-trigger" onClick={() => setOpen(!open)}>
        {selected.length > 0 ? (
          <div className="tag-select-values">
            {selected.map(name => {
              const t = tags.find(t => t.name === name)
              return (
                <span key={name} className="tag-select-chip" style={{ background: t?.color || '#6B7280' }}>
                  {name}
                  <span className="tag-select-chip-x" onClick={(e) => { e.stopPropagation(); toggle(name) }}>×</span>
                </span>
              )
            })}
          </div>
        ) : (
          <span className="tag-select-placeholder">选择标签...</span>
        )}
        <span className={`tag-select-arrow ${open ? 'open' : ''}`}>▾</span>
      </div>
      {open && (
        <div className="tag-select-dropdown">
          {sorted.length === 0 ? (
            <div className="tag-select-empty">暂无标签</div>
          ) : (
            sorted.map(tag => (
              <div key={tag.id} className={`tag-select-option ${selected.includes(tag.name) ? 'selected' : ''}`}
                onClick={() => toggle(tag.name)}>
                <span className="tag-select-dot" style={{ background: tag.color }} />
                <span className="tag-select-name">{tag.name}</span>
                {tag.desc && <span className="tag-select-desc">{tag.desc}</span>}
                {selected.includes(tag.name) && <span className="tag-select-check">✓</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ===== 图标选择器弹窗 ===== */
function IconPicker({ visible, onSelect, onClose }: { visible: boolean; onSelect: (url: string) => void; onClose: () => void }) {
  const [icons, setIcons] = useState<IconListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible) loadIcons()
  }, [visible])

  const loadIcons = async () => {
    setLoading(true)
    try {
      const result = await listIcons()
      setIcons(result.items || [])
    } catch { /* 静默 */ }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    if (!search) return icons
    const kw = search.toLowerCase()
    return icons.filter(i => i.name.toLowerCase().includes(kw))
  }, [icons, search])

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const compressed = await compressImage(file, { maxSize: 256, quality: 0.85 })
      const base64 = await blobToBase64(compressed.blob)
      const result = await uploadIcon(compressed.filename, base64)
      /* 添加到列表头部 */
      setIcons(prev => [{
        name: result.name,
        path: result.path,
        sha: result.sha,
        size: result.size,
        rawUrl: result.rawUrl,
        htmlUrl: '',
        uploadedAt: new Date().toISOString(),
      }, ...prev])
    } catch { /* 静默 */ }
    finally { setUploading(false) }
  }

  if (!visible) return null

  return (
    <div className="admin-modal-overlay" style={{ zIndex: 1001 }} onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: '40rem' }} onClick={e => e.stopPropagation()}>
        <h3>图标库</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #E5E7EB', borderRadius: '0.75rem', fontSize: '0.875rem', background: '#F8FAFC' }}
            placeholder="搜索图标..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }} />
          <button className="admin-btn-primary" style={{ whiteSpace: 'nowrap' }}
            onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? '上传中...' : '+ 上传'}
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>加载中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
            {search ? '没有匹配的图标' : '暂无图标，请先上传'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8, maxHeight: '20rem', overflowY: 'auto' }}>
            {filtered.map(icon => (
              <div key={icon.sha}
                className="icon-picker-tile"
                onClick={() => { onSelect(icon.rawUrl); onClose() }}
                title={icon.name}>
                <img src={resolveIconUrl(icon.rawUrl)} alt={icon.name}
                  style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6 }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            ))}
          </div>
        )}
        <div className="admin-modal-actions">
          <button className="admin-btn" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}

/* ===== 网站编辑弹窗 ===== */
interface EditWebModalProps {
  visible: boolean
  title: string
  data?: WebItem
  subId?: number
  allCategories?: Category[]
  allTags?: TagItem[]
  onSave: (item: WebItem, targetSubId?: number) => void
  onDelete?: () => void
  onClose: () => void
}

export function EditWebModal({ visible, title, data, subId, allCategories, allTags, onSave, onDelete, onClose }: EditWebModalProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [icon, setIcon] = useState('')
  const [rate, setRate] = useState(5)
  const [tag, setTag] = useState('')
  const [crawling, setCrawling] = useState(false)
  const [catId, setCatId] = useState(0)
  const [targetSubId, setTargetSubId] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdd = !data
  const isLoggedIn = isAuthenticated()

  useEffect(() => {
    if (visible) {
      setName(data?.name || '')
      setUrl(data?.url || '')
      setDesc(data?.desc || '')
      setIcon(data?.icon || '')
      setRate(data?.rate ?? 5)
      setTag(data?.tag || '')
      setCrawling(false)
      setUploading(false)
      if (isAdd && allCategories?.length) {
        if (subId) {
          /* 根据 subId 找到所属分类 */
          for (const cat of allCategories) {
            if (cat.children?.some(s => s.id === subId)) {
              setCatId(cat.id)
              setTargetSubId(subId)
              break
            }
          }
        } else {
          const firstCat = allCategories[0]
          setCatId(firstCat.id)
          setTargetSubId(firstCat.children?.[0]?.id || 0)
        }
      }
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [visible, data, isAdd, allCategories])

  if (!visible) return null

  const currentCat = allCategories?.find(c => c.id === catId)
  const currentSubs = currentCat?.children || []

  const crawlUrl = async (targetUrl: string) => {
    if (!targetUrl || crawling) return
    if (!isCrawlAvailable()) return
    let fullUrl = targetUrl.trim()
    if (!fullUrl) return
    if (!/^https?:\/\//i.test(fullUrl)) fullUrl = 'https://' + fullUrl
    try { new URL(fullUrl) } catch { return }
    setCrawling(true)
    try {
      const info = await crawlWebsite(fullUrl)
      setName(prev => prev || info.title || '')
      setDesc(prev => prev || info.description || '')
      setIcon(prev => prev || info.icon || '')
    } catch { /* 爬取失败静默 */ }
    finally { setCrawling(false) }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const compressed = await compressImage(file, { maxSize: 256, quality: 0.85 })
      const base64 = await blobToBase64(compressed.blob)
      const result = await uploadIcon(compressed.filename, base64)
      setIcon(result.rawUrl)
    } catch { /* 静默 */ }
    finally { setUploading(false) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) handleFileUpload(f)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return
    onSave({
      name: name.trim(),
      url: url.trim(),
      desc: desc.trim(),
      icon: icon.trim(),
      rate,
      tag: tag.trim() || undefined,
    }, isAdd ? targetSubId : undefined)
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="admin-modal-form">
          {isAdd && allCategories && allCategories.length > 0 && (
            <>
              <label>所属分类</label>
              <select value={catId} onChange={e => {
                const id = Number(e.target.value)
                setCatId(id)
                const cat = allCategories.find(c => c.id === id)
                setTargetSubId(cat?.children?.[0]?.id || 0)
              }}>
                {allCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
              </select>
              <label>所属子分类</label>
              <select value={targetSubId} onChange={e => setTargetSubId(Number(e.target.value))}>
                {currentSubs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </>
          )}
          <label>名称 <span style={{ color: '#E53935' }}>*</span></label>
          <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder="网站名称" />
          <label>描述</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="简短描述" />
          <label>链接 <span style={{ color: '#E53935' }}>*</span></label>
          <input value={url} onChange={e => setUrl(e.target.value)}
            onBlur={() => crawlUrl(url)}
            placeholder={crawling ? '正在爬取...' : 'https://example.com'} />

          {/* 图标区域 */}
          <label>图标 {crawling && <span style={{ color: '#4F8CFF', fontWeight: 400, fontSize: 12 }}>爬取中...</span>}
            {uploading && <span style={{ color: '#4F8CFF', fontWeight: 400, fontSize: 12 }}>上传中...</span>}
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* 图标预览 */}
            {icon && (
              <div style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid #E5E7EB', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                <img src={resolveIconUrl(icon)} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
            {/* URL 输入 */}
            <input style={{ flex: 1 }} value={icon} onChange={e => setIcon(e.target.value)}
              placeholder={crawling ? '自动获取中...' : 'https://example.com/favicon.png'} />
          </div>
          {/* 上传 + 图标库按钮 */}
          {isLoggedIn && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = '' }} />
              <button type="button" className="admin-btn" style={{ height: '2rem', fontSize: '0.8125rem', padding: '0 0.75rem' }}
                onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                📁 本地上传
              </button>
              <button type="button" className="admin-btn" style={{ height: '2rem', fontSize: '0.8125rem', padding: '0 0.75rem' }}
                onClick={() => setIconPickerOpen(true)}>
                🎨 图标库
              </button>
            </div>
          )}

          <label>评分 (1-5)</label>
          <input type="number" min={1} max={5} value={rate} onChange={e => setRate(Number(e.target.value))} />
          {allTags && (
            <>
              <label>标签</label>
              <TagSelect value={tag} onChange={v => setTag(v)} tags={allTags} />
            </>
          )}
        </div>
        <div className="admin-modal-actions">
          {onDelete && (
            <button className="admin-btn admin-btn-danger" onClick={onDelete}>删除</button>
          )}
          <div style={{ flex: 1 }} />
          <button className="admin-btn" onClick={onClose}>取消</button>
          <button className="admin-btn-primary" onClick={handleSubmit}>保存</button>
        </div>
      </div>

      {/* 拖拽遮罩 */}
      {dragOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(79,140,255,0.15)', border: '3px dashed #4F8CFF', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#4F8CFF' }}>松开上传图标</span>
        </div>
      )}

      {/* 图标库弹窗 */}
      <IconPicker visible={iconPickerOpen} onSelect={setIcon} onClose={() => setIconPickerOpen(false)} />
    </div>
  )
}

/* ===== 子分类编辑弹窗 ===== */
interface EditCategoryModalProps {
  visible: boolean
  title: string
  data?: SubCategory
  onSave: (title: string) => void
  onDelete?: () => void
  onClose: () => void
}

export function EditCategoryModal({ visible, title, data, onSave, onDelete, onClose }: EditCategoryModalProps) {
  const [name, setName] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible) {
      setName(data?.title || '')
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [visible, data])

  if (!visible) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="admin-modal-form">
          <label>子分类名称 <span style={{ color: '#E53935' }}>*</span></label>
          <input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder="输入子分类名称" />
        </div>
        <div className="admin-modal-actions">
          {onDelete && (
            <button className="admin-btn admin-btn-danger" onClick={onDelete}>删除</button>
          )}
          <div style={{ flex: 1 }} />
          <button className="admin-btn" onClick={onClose}>取消</button>
          <button className="admin-btn-primary" onClick={handleSubmit}>保存</button>
        </div>
      </div>
    </div>
  )
}

/* ===== 确认删除弹窗 ===== */
interface ConfirmModalProps {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({ visible, title, message, onConfirm, onClose }: ConfirmModalProps) {
  if (!visible) return null

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: '0 0 20px' }}>{message}</p>
        <div className="admin-modal-actions">
          <div style={{ flex: 1 }} />
          <button className="admin-btn" onClick={onClose}>取消</button>
          <button className="admin-btn admin-btn-danger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  )
}

/* ===== 移动网站弹窗 ===== */
interface MoveModalProps {
  visible: boolean
  allCategories: Category[]
  currentCatId: number
  currentSubId: number
  websiteName: string
  onMove: (targetCatId: number, targetSubId: number, copy: boolean) => void
  onClose: () => void
}

export function MoveModal({ visible, allCategories, currentCatId, currentSubId, websiteName, onMove, onClose }: MoveModalProps) {
  const [targetCatId, setTargetCatId] = useState(currentCatId)
  const [targetSubId, setTargetSubId] = useState(currentSubId)
  const [copy, setCopy] = useState(false)

  useEffect(() => {
    if (visible) {
      setTargetCatId(currentCatId)
      setTargetSubId(currentSubId)
      setCopy(false)
    }
  }, [visible, currentCatId, currentSubId])

  if (!visible) return null

  const currentCat = allCategories.find(c => c.id === targetCatId)
  const currentSubs = currentCat?.children || []

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>移动到</h3>
        <div className="admin-modal-form">
          <label>请选择一级分类</label>
          <select value={targetCatId} onChange={e => {
            const id = Number(e.target.value)
            setTargetCatId(id)
            const cat = allCategories.find(c => c.id === id)
            setTargetSubId(cat?.children?.[0]?.id || 0)
          }}>
            {allCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
          </select>
          <label>请选择二级分类</label>
          <select value={targetSubId} onChange={e => setTargetSubId(Number(e.target.value))}>
            {currentSubs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={copy} onChange={e => setCopy(e.target.checked)}
              style={{ width: 16, height: 16 }} />
            复制
          </label>
        </div>
        <div className="admin-modal-actions">
          <button className="admin-btn" onClick={onClose}>取消</button>
          <button className="admin-btn-primary" onClick={() => onMove(targetCatId, targetSubId, copy)}>确定</button>
        </div>
      </div>
    </div>
  )
}
