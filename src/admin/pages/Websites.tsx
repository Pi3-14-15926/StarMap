import { useState, useEffect, useMemo } from 'react'
import { api } from '../services/data'
import { useConfirm } from '../components/ConfirmModal'
import type { Category, WebItem } from '@ui/types'

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

export function Websites() {
  const [data, setData] = useState<Category[]>([])
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
  const { confirm } = useConfirm()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getDb()
      if (res?.content) {
        setData(res.content)
        if (res.content.length > 0 && res.content[0].children.length > 0) {
          setNewWeb(prev => ({
            ...prev,
            catId: res.content[0].id,
            subId: res.content[0].children[0].id,
          }))
        }
      }
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
    if (filterCat) result = result.filter(w => w.catId === filterCat)
    if (filterSub) result = result.filter(w => w.subId === filterSub)
    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    else if (sortBy === 'rating') result = [...result].sort((a, b) => b.rate - a.rate)
    return result
  }, [allWebs, search, filterCat, filterSub, sortBy])

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
            </div>
            <div className="web-card-desc">{web.desc}</div>
            <div className="web-card-tags">
              <span className="web-tag web-tag-cat">{web.catIcon} {web.subTitle}</span>
              {web.tag && <span className="web-tag web-tag-custom">{web.tag}</span>}
            </div>
            <div className="web-card-rating">{'★'.repeat(web.rate)}{'☆'.repeat(5 - web.rate)}</div>
            <div className="web-card-actions">
              <button className="web-action-btn" onClick={() => setEditItem({ ...web, _oldName: web.name })}>
                <span>✏️</span> 编辑
              </button>
              <button className="web-action-btn danger" onClick={() => deleteWeb(web.catId, web.subId, web.name)}>
                <span>🗑️</span> 删除
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
              <input value={newWeb.url} onChange={e => setNewWeb({ ...newWeb, url: e.target.value })} />
              <label>图标 URL</label>
              <input value={newWeb.icon} onChange={e => setNewWeb({ ...newWeb, icon: e.target.value })} />
              <label>评分 (1-5)</label>
              <input type="number" min={1} max={5} value={newWeb.rate} onChange={e => setNewWeb({ ...newWeb, rate: Number(e.target.value) })} />
              <label>标签</label>
              <input value={newWeb.tag} onChange={e => setNewWeb({ ...newWeb, tag: e.target.value })} />
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
              <input value={editItem.url} onChange={e => setEditItem({ ...editItem, url: e.target.value })} />
              <label>图标 URL</label>
              <input value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} />
              <label>评分 (1-5)</label>
              <input type="number" min={1} max={5} value={editItem.rate} onChange={e => setEditItem({ ...editItem, rate: Number(e.target.value) })} />
              <label>标签</label>
              <input value={editItem.tag || ''} onChange={e => setEditItem({ ...editItem, tag: e.target.value })} />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-primary" onClick={saveEdit}>保存</button>
              <button className="admin-btn" onClick={() => setEditItem(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}