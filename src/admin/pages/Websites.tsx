import { useState, useEffect, useMemo, useRef } from 'react'
import { api } from '../services/data'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import { crawlWebsite, isCrawlAvailable } from '../services/crawl'
import type { Category, WebItem, TagItem } from '@ui/types'

type ViewMode = 'grid' | 'list'
type SortMode = 'default' | 'name' | 'rating'

interface FlatWeb extends WebItem {
  catId: number
  catTitle: string
  catIcon: string
  subId: number
  subTitle: string
  _oldName: string
}

/* ===== 标签多选下拉 ===== */
function TagSelect({ value, onChange, tags }: { value: string; onChange: (v: string) => void; tags: TagItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sorted = useMemo(() => [...tags].sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999)), [tags])
  const selected = useMemo(() => value ? value.split(',').map(s => s.trim()).filter(Boolean) : [], [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
              <div
                key={tag.id}
                className={`tag-select-option ${selected.includes(tag.name) ? 'selected' : ''}`}
                onClick={() => toggle(tag.name)}
              >
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

export function Websites() {
  const [data, setData] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<number>(0)
  const [filterSub, setFilterSub] = useState<number>(0)
  const [sortBy, setSortBy] = useState<SortMode>('default')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [editItem, setEditItem] = useState<FlatWeb | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWeb, setNewWeb] = useState({ name: '', desc: '', url: '', icon: '', rate: 5, tag: '', catId: 0, subId: 0 })
  const [crawling, setCrawling] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkProgress, setCheckProgress] = useState({ total: 0, done: 0, fail: 0, current: '' })
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set())
  const [moveModal, setMoveModal] = useState<{ catId: number; subId: number; webName: string } | null>(null)
  const [moveTarget, setMoveTarget] = useState({ catId: 0, subId: 0, copy: false })
  const { confirm } = useConfirm()
  const toast = useToast()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dbRes, tagRes] = await Promise.all([api.getDb(), api.getTags()])
      if (dbRes?.content) {
        setData(dbRes.content)
        if (dbRes.content.length > 0 && dbRes.content[0].children.length > 0) {
          setNewWeb(prev => ({
            ...prev,
            catId: dbRes.content[0].id,
            subId: dbRes.content[0].children[0].id,
          }))
        }
      }
      if (tagRes?.content) setTags(tagRes.content)
    } catch (err: any) {
      setMessage(`❌ 加载失败: ${err.message}`)
    } finally { setLoading(false) }
  }

  const allWebs = useMemo<FlatWeb[]>(() => {
    const result: FlatWeb[] = []
    for (const cat of data) {
      for (const sub of cat.children) {
        for (const web of sub.nav) {
          result.push({ ...web, catId: cat.id, catTitle: cat.title, catIcon: cat.icon, subId: sub.id, subTitle: sub.title, _oldName: web.name })
        }
      }
    }
    return result
  }, [data])

  const allSubs = useMemo(() => {
    if (!filterCat) return data.flatMap(c => c.children.map(s => ({ ...s, catIcon: c.icon, catId: c.id })))
    const cat = data.find(c => c.id === filterCat)
    return cat ? cat.children.map(s => ({ ...s, catIcon: cat.icon, catId: cat.id })) : []
  }, [data, filterCat])

  const filtered = useMemo(() => {
    let result = allWebs
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(w =>
        w.name.toLowerCase().includes(q) ||
        w.desc.toLowerCase().includes(q) ||
        w.url.toLowerCase().includes(q)
      )
    }
    if (filterCat === -1) {
      result = result.filter(w => failedUrls.has(w.url))
    } else if (filterCat) {
      result = result.filter(w => w.catId === filterCat)
    }
    if (filterSub) result = result.filter(w => w.subId === filterSub)
    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    else if (sortBy === 'rating') result = [...result].sort((a, b) => b.rate - a.rate)
    return result
  }, [allWebs, search, filterCat, filterSub, sortBy, failedUrls])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await api.saveDb(data)
      setMessage('✅ 保存成功')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage(`❌ 保存失败: ${err.message}`)
    } finally { setSaving(false) }
  }

  const deleteWeb = async (catId: number, subId: number, webName: string) => {
    const ok = await confirm({
      title: '删除网站',
      description: `确定删除「${webName}」？此操作不可恢复。`,
    })
    if (!ok) return
    setData(prev => prev.map(cat => {
      if (cat.id !== catId) return cat
      return {
        ...cat,
        children: cat.children.map(sub => {
          if (sub.id !== subId) return sub
          return { ...sub, nav: sub.nav.filter(w => w.name !== webName) }
        }),
      }
    }))
    setMessage('✅ 已删除（保存后生效）')
  }

  const shareWeb = (url: string, name: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`已复制「${name}」的链接`)
    }).catch(() => {
      toast.error('复制失败')
    })
  }

  const openMove = (catId: number, subId: number, webName: string) => {
    setMoveTarget({ catId, subId, copy: false })
    setMoveModal({ catId, subId, webName })
  }

  const doMove = () => {
    if (!moveModal) return
    const { catId: srcCatId, subId: srcSubId, webName } = moveModal
    const { catId: tgtCatId, subId: tgtSubId, copy } = moveTarget
    if (tgtCatId === srcCatId && tgtSubId === srcSubId) { setMoveModal(null); return }
    let movedWeb: WebItem | null = null
    setData(prev => prev.map(cat => {
      if (cat.id === srcCatId) {
        return {
          ...cat,
          children: cat.children.map(sub => {
            if (sub.id !== srcSubId) return sub
            const web = sub.nav.find(w => w.name === webName)
            if (web) movedWeb = { ...web }
            return { ...sub, nav: copy ? sub.nav : sub.nav.filter(w => w.name !== webName) }
          }),
        }
      }
      return cat
    }))
    if (movedWeb) {
      setData(prev => prev.map(cat => {
        if (cat.id !== tgtCatId) return cat
        return {
          ...cat,
          children: cat.children.map(sub => {
            if (sub.id !== tgtSubId) return sub
            return { ...sub, nav: [...sub.nav, movedWeb!] }
          }),
        }
      }))
    }
    setMoveModal(null)
    toast.success(copy ? '已复制' : '已移动')
  }

  const addWeb = () => {
    if (!newWeb.name || !newWeb.url) { setMessage('❌ 名称和链接不能为空'); return }
    setData(prev => prev.map(cat => {
      if (cat.id !== newWeb.catId) return cat
      return {
        ...cat,
        children: cat.children.map(sub => {
          if (sub.id !== newWeb.subId) return sub
          return { ...sub, nav: [...sub.nav, { name: newWeb.name, desc: newWeb.desc, url: newWeb.url, icon: newWeb.icon, rate: newWeb.rate, tag: newWeb.tag }] }
        }),
      }
    }))
    setNewWeb({ name: '', desc: '', url: '', icon: '', rate: 5, tag: '', catId: newWeb.catId, subId: newWeb.subId })
    setShowAddForm(false)
    setMessage('✅ 已添加（保存后生效）')
  }

  const crawlUrl = async (url: string, target: 'add' | 'edit') => {
    if (!url || crawling) return
    if (!isCrawlAvailable()) {
      toast.warning('自动爬取仅在本地开发环境可用，生产环境请手动填写')
      return
    }
    try { new URL(url) } catch { return }
    setCrawling(true)
    try {
      const info = await crawlWebsite(url)
      if (target === 'add') {
        setNewWeb((prev) => ({
          ...prev,
          name: prev.name || info.title || '',
          desc: prev.desc || info.description || '',
          icon: prev.icon || info.icon || '',
        }))
      } else if (target === 'edit' && editItem) {
        setEditItem({
          ...editItem,
          name: editItem.name || info.title || '',
          desc: editItem.desc || info.description || '',
          icon: editItem.icon || info.icon || '',
        })
      }
    } catch { /* 爬取失败静默处理 */ }
    finally { setCrawling(false) }
  }

  const checkAllWebsites = async () => {
    if (checking) return
    const websites = allWebs.filter(w => w.url)
    if (websites.length === 0) { toast.error('没有可检测的网站'); return }

    setChecking(true)
    setFailedUrls(new Set())
    setCheckProgress({ total: websites.length, done: 0, fail: 0, current: '' })

    const failures: { name: string; url: string; error: string }[] = []
    const BATCH = 5

    const checkUrl = async (url: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 12000)
        await fetch(url, { mode: 'no-cors', signal: ctrl.signal, cache: 'no-store' })
        clearTimeout(timer)
        return { ok: true }
      } catch (e: any) {
        if (e.name === 'AbortError') return { ok: false, error: '超时' }
        if (e.name === 'TypeError') return { ok: false, error: '网络错误' }
        return { ok: true }
      }
    }

    for (let i = 0; i < websites.length; i += BATCH) {
      const batch = websites.slice(i, i + BATCH)
      const results = await Promise.allSettled(batch.map(async (w) => {
        setCheckProgress(p => ({ ...p, current: w.name }))
        return checkUrl(w.url)
      }))

      results.forEach((r, idx) => {
        const w = batch[idx]
        const res = r.status === 'fulfilled' ? r.value : { ok: false, error: '检测异常' }
        if (!res.ok) failures.push({ name: w.name, url: w.url, error: res.error || '未知错误' })
      })

      setCheckProgress(p => ({ ...p, done: Math.min(i + BATCH, websites.length), fail: failures.length }))
    }

    const failUrlSet = new Set(failures.map(f => f.url))
    setFailedUrls(failUrlSet)
    setChecking(false)
    setCheckProgress(p => ({ ...p, current: '' }))

    if (failures.length === 0) {
      toast.success(`全部 ${websites.length} 个网站检测通过`)
    } else {
      toast.error(`检测完成：${failures.length} 个网站异常`)
      setFilterCat(-1)
    }
  }

  const saveEdit = () => {
    if (!editItem) return
    setData(prev => prev.map(cat => ({
      ...cat,
      children: cat.children.map(sub => ({
        ...sub,
        nav: sub.nav.map(w => (w.name === editItem._oldName ? { name: editItem.name, desc: editItem.desc, url: editItem.url, icon: editItem.icon, rate: editItem.rate, tag: editItem.tag } : w)),
      })),
    })))
    setEditItem(null)
    setMessage('✅ 已修改（保存后生效）')
  }

  if (loading) return <div className="admin-loading">加载中...</div>

  return (
    <div className="dash-scroll">
      <div className="page-head">
        <div>
          <h2 className="page-title"><span className="page-title-emoji">🌐</span>网站管理</h2>
          <p className="page-desc">管理所有收录的网站资源</p>
        </div>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
      </div>

      {/* 工具栏 */}
      <div className="web-toolbar">
        <div className="web-search">
          <span className="web-search-icon">🔍</span>
          <input
            className="web-search-input"
            placeholder="搜索网站名称、描述或域名..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="web-filter-select" value={filterCat} onChange={e => {
          setFilterCat(Number(e.target.value))
          setFilterSub(0)
        }}>
          <option value={0}>全部分类</option>
          {failedUrls.size > 0 && <option value={-1}>⚠️ 失效网站 ({failedUrls.size})</option>}
          {data.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
        </select>
        <select className="web-filter-select" value={filterSub} onChange={e => setFilterSub(Number(e.target.value))}>
          <option value={0}>全部子分类</option>
          {allSubs.map(s => <option key={s.id} value={s.id}>{s.catIcon} {s.title}</option>)}
        </select>
        <select className="web-filter-select" value={sortBy} onChange={e => setSortBy(e.target.value as SortMode)}>
          <option value="default">默认排序</option>
          <option value="name">名称排序</option>
          <option value="rating">评分排序</option>
        </select>
        <div className="web-view-toggle">
          <button className={`web-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="网格视图">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
          </button>
          <button className={`web-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="列表视图">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="3" rx="1"/><rect x="1" y="7" width="14" height="3" rx="1"/><rect x="1" y="12" width="14" height="3" rx="1"/></svg>
          </button>
        </div>
        <button className="web-check-btn" onClick={checkAllWebsites} disabled={checking}>
          {checking ? (
            <><span className="web-check-spinner"></span> 检测中 {checkProgress.done}/{checkProgress.total}</>
          ) : (
            <><span>🔍</span> 检索异常</>
          )}
        </button>
        <button className="web-add-btn" onClick={() => setShowAddForm(true)}>
          <span>+</span> 添加网站
        </button>
      </div>

      {/* 网站卡片 */}
      <div className={viewMode === 'grid' ? 'web-grid' : 'web-list'}>
        {filtered.map((web) => (
          <div key={`${web.subId}-${web.name}`} className={`web-card ${viewMode === 'list' ? 'web-card-list' : ''}`}>
            <div className="web-card-top">
              <img
                src={web.icon}
                alt=""
                className="web-card-icon"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <div className="web-card-info">
                <div className="web-card-name">{web.name}</div>
                <div className="web-card-url">{web.url}</div>
              </div>
              {web.url && (
                <a href={web.url} target="_blank" rel="noopener noreferrer" className="src-tag src-tag-link src-website" title="打开网站">
                  <span className="src-dot"></span>
                  网站
                  <svg className="src-ext" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              )}
            </div>
            <div className="web-card-desc">{web.desc}</div>
            <div className="web-card-tags">
              <span className="web-tag web-tag-cat">{web.catIcon} {web.subTitle}</span>
              {web.tag && web.tag.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                <span key={t} className="web-tag web-tag-custom">{t}</span>
              ))}
            </div>
            <div className="web-card-rating">{'★'.repeat(web.rate)}{'☆'.repeat(5 - web.rate)}</div>
            <div className="web-card-actions">
              <button className="web-bar-btn" title="编辑"
                onClick={() => setEditItem({ ...web, _oldName: web.name })}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button className="web-bar-btn" title="分享"
                onClick={() => shareWeb(web.url, web.name)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <button className="web-bar-btn" title="移动"
                onClick={() => openMove(web.catId, web.subId, web.name)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
                  <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                </svg>
              </button>
              <button className="web-bar-btn web-bar-danger" title="删除"
                onClick={() => deleteWeb(web.catId, web.subId, web.name)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="web-empty">
          <div className="web-empty-icon">📭</div>
          <div className="web-empty-text">没有找到匹配的网站</div>
        </div>
      )}

      {/* 添加弹窗 */}
      {showAddForm && (
        <div className="admin-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>添加网站</h3>
            <div className="admin-modal-form">
              <label>所属分类</label>
              <select value={newWeb.catId} onChange={e => {
                const catId = Number(e.target.value)
                const cat = data.find(c => c.id === catId)
                const subId = cat?.children[0]?.id || 0
                setNewWeb({ ...newWeb, catId, subId })
              }}>
                {data.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
              </select>
              <label>所属子分类</label>
              <select value={newWeb.subId} onChange={e => setNewWeb({ ...newWeb, subId: Number(e.target.value) })}>
                {allSubs.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <label>名称 *</label>
              <input value={newWeb.name} onChange={e => setNewWeb({ ...newWeb, name: e.target.value })} />
              <label>描述</label>
              <input value={newWeb.desc} onChange={e => setNewWeb({ ...newWeb, desc: e.target.value })} />
              <label>链接 *</label>
              <input value={newWeb.url} onChange={e => setNewWeb({ ...newWeb, url: e.target.value })}
                onBlur={() => crawlUrl(newWeb.url, 'add')} placeholder={crawling ? '正在爬取...' : ''} />
              <label>图标 URL {crawling && <span style={{ color: '#4F8CFF', fontWeight: 400, fontSize: 12 }}>爬取中...</span>}</label>
              <input value={newWeb.icon} onChange={e => setNewWeb({ ...newWeb, icon: e.target.value })} placeholder={crawling ? '自动获取中...' : ''} />
              <label>评分 (1-5)</label>
              <input type="number" min={1} max={5} value={newWeb.rate} onChange={e => setNewWeb({ ...newWeb, rate: Number(e.target.value) })} />
              <label>标签</label>
              <TagSelect value={newWeb.tag} onChange={v => setNewWeb({ ...newWeb, tag: v })} tags={tags} />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-primary" onClick={addWeb}>添加</button>
              <button className="admin-btn" onClick={() => setShowAddForm(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editItem && (
        <div className="admin-modal-overlay" onClick={() => setEditItem(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>编辑网站</h3>
            <div className="admin-modal-form">
              <label>名称</label>
              <input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} />
              <label>描述</label>
              <input value={editItem.desc} onChange={e => setEditItem({ ...editItem, desc: e.target.value })} />
              <label>链接</label>
              <input value={editItem.url} onChange={e => setEditItem({ ...editItem, url: e.target.value })}
                onBlur={() => crawlUrl(editItem.url, 'edit')} placeholder={crawling ? '正在爬取...' : ''} />
              <label>图标 URL {crawling && <span style={{ color: '#4F8CFF', fontWeight: 400, fontSize: 12 }}>爬取中...</span>}</label>
              <input value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} placeholder={crawling ? '自动获取中...' : ''} />
              <label>评分 (1-5)</label>
              <input type="number" min={1} max={5} value={editItem.rate} onChange={e => setEditItem({ ...editItem, rate: Number(e.target.value) })} />
              <label>标签</label>
              <TagSelect value={editItem.tag || ''} onChange={v => setEditItem({ ...editItem, tag: v })} tags={tags} />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-primary" onClick={saveEdit}>保存</button>
              <button className="admin-btn" onClick={() => setEditItem(null)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 检测进度弹窗 */}
      {checking && (
        <div className="check-progress-overlay">
          <div className="check-progress-card">
            <div className="check-progress-icon">
              <div className="check-progress-spinner"></div>
            </div>
            <h3 className="check-progress-title">正在检测网站</h3>
            <div className="check-progress-bar">
              <div className="check-progress-fill" style={{ width: `${checkProgress.total ? (checkProgress.done / checkProgress.total) * 100 : 0}%` }} />
            </div>
            <div className="check-progress-stats">
              <div className="check-stat">
                <span className="check-stat-num">{checkProgress.done}</span>
                <span className="check-stat-label">已检测</span>
              </div>
              <div className="check-stat">
                <span className="check-stat-num">{checkProgress.total - checkProgress.done}</span>
                <span className="check-stat-label">待检测</span>
              </div>
              <div className="check-stat fail">
                <span className="check-stat-num">{checkProgress.fail}</span>
                <span className="check-stat-label">异常</span>
              </div>
            </div>
            {checkProgress.current && (
              <div className="check-progress-current">正在检测：{checkProgress.current}</div>
            )}
          </div>
        </div>
      )}

      {/* 移动弹窗 */}
      {moveModal && (
        <div className="admin-modal-overlay" onClick={() => setMoveModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>移动到</h3>
            <div className="admin-modal-form">
              <label>一级分类</label>
              <select value={moveTarget.catId} onChange={e => {
                const id = Number(e.target.value)
                const cat = data.find(c => c.id === id)
                setMoveTarget({ ...moveTarget, catId: id, subId: cat?.children?.[0]?.id || 0 })
              }}>
                {data.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
              </select>
              <label>二级分类</label>
              <select value={moveTarget.subId} onChange={e => setMoveTarget({ ...moveTarget, subId: Number(e.target.value) })}>
                {(data.find(c => c.id === moveTarget.catId)?.children || []).map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={moveTarget.copy}
                  onChange={e => setMoveTarget({ ...moveTarget, copy: e.target.checked })}
                  style={{ width: 16, height: 16 }} />
                复制
              </label>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn" onClick={() => setMoveModal(null)}>取消</button>
              <button className="admin-btn-primary" onClick={doMove}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
