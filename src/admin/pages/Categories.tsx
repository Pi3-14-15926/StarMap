import { useState, useEffect } from 'react'
import { api } from '../services/data'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import type { Category } from '@ui/types'

export function Categories() {
  const [data, setData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editModal, setEditModal] = useState<{ type: 'cat' | 'sub'; catId: number; subId?: number; title: string; icon: string } | null>(null)
  const [moveModal, setMoveModal] = useState<{ catId: number; subId: number; subTitle: string } | null>(null)
  const [addCatModal, setAddCatModal] = useState(false)
  const [addSubModal, setAddSubModal] = useState<number | null>(null)
  const { confirm } = useConfirm()
  const toast = useToast()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getDb()
      if (res?.content) setData(res.content)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await api.saveDb(data); toast.success('保存成功') }
    catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSelectAll = () => {
    const allKeys: string[] = []
    data.forEach((cat) => {
      allKeys.push(`cat-${cat.id}`)
      cat.children.forEach((sub) => allKeys.push(`sub-${cat.id}-${sub.id}`))
    })
    if (selected.size === allKeys.length) setSelected(new Set())
    else setSelected(new Set(allKeys))
  }

  /* 删除一级分类 */
  const deleteCat = async (catId: number, catTitle: string) => {
    const ok = await confirm({
      title: '删除分类',
      description: `确定删除「${catTitle}」及其所有子分类和网站？此操作不可恢复。`,
    })
    if (!ok) return
    setData((prev) => prev.filter((c) => c.id !== catId))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(`cat-${catId}`)
      return next
    })
    toast.success('已删除')
  }

  /* 删除子分类 */
  const deleteSub = async (catId: number, subId: number, subTitle: string) => {
    const ok = await confirm({
      title: '删除子分类',
      description: `确定删除「${subTitle}」及其所有网站？此操作不可恢复。`,
    })
    if (!ok) return
    setData((prev) => prev.map((cat) => {
      if (cat.id !== catId) return cat
      return { ...cat, children: cat.children.filter((s) => s.id !== subId) }
    }))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(`sub-${catId}-${subId}`)
      return next
    })
    toast.success('已删除')
  }

  /* 批量删除 */
  const batchDelete = async () => {
    const catCount = [...selected].filter((k) => k.startsWith('cat-')).length
    const subCount = [...selected].filter((k) => k.startsWith('sub-')).length
    const ok = await confirm({
      title: '批量删除',
      description: `确定删除选中的 ${catCount} 个分类和 ${subCount} 个子分类？此操作不可恢复。`,
    })
    if (!ok) return
    setData((prev) => {
      let result = [...prev]
      selected.forEach((key) => {
        if (key.startsWith('cat-')) {
          const catId = Number(key.replace('cat-', ''))
          result = result.filter((c) => c.id !== catId)
        }
      })
      selected.forEach((key) => {
        if (key.startsWith('sub-')) {
          const [, catIdStr, subIdStr] = key.split('-')
          const catId = Number(catIdStr)
          const subId = Number(subIdStr)
          result = result.map((cat) => {
            if (cat.id !== catId) return cat
            return { ...cat, children: cat.children.filter((s) => s.id !== subId) }
          })
        }
      })
      return result
    })
    setSelected(new Set())
    toast.success('批量删除成功')
  }

  /* 编辑分类 */
  const saveEdit = () => {
    if (!editModal) return
    if (!editModal.title.trim()) { toast.error('名称不能为空'); return }
    if (editModal.type === 'cat') {
      setData((prev) => prev.map((cat) =>
        cat.id === editModal.catId ? { ...cat, title: editModal.title.trim(), icon: editModal.icon.trim() || cat.icon } : cat
      ))
    } else {
      setData((prev) => prev.map((cat) => {
        if (cat.id !== editModal.catId) return cat
        return { ...cat, children: cat.children.map((sub) =>
          sub.id === editModal.subId ? { ...sub, title: editModal.title.trim() } : sub
        ) }
      }))
    }
    setEditModal(null)
    toast.success('已修改')
  }

  /* 移动子分类 */
  const saveMove = (targetCatId: number) => {
    if (!moveModal) return
    if (targetCatId === moveModal.catId) { setMoveModal(null); return }
    let movedSub: any = null
    setData((prev) => prev.map((cat) => {
      if (cat.id === moveModal.catId) {
        const sub = cat.children.find((s) => s.id === moveModal.subId)
        if (sub) movedSub = sub
        return { ...cat, children: cat.children.filter((s) => s.id !== moveModal.subId) }
      }
      return cat
    }).map((cat) => {
      if (cat.id === targetCatId && movedSub) {
        return { ...cat, children: [...cat.children, movedSub] }
      }
      return cat
    }))
    setMoveModal(null)
    toast.success('已移动')
  }

  /* 添加一级分类 */
  const [newCatTitle, setNewCatTitle] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📁')
  const saveAddCat = () => {
    if (!newCatTitle.trim()) { toast.error('名称不能为空'); return }
    const newId = Math.max(0, ...data.map((c) => c.id)) + 1
    setData([...data, { id: newId, title: newCatTitle.trim(), icon: newCatIcon || '📁', children: [] }])
    setAddCatModal(false)
    setNewCatTitle('')
    setNewCatIcon('📁')
    toast.success('已添加')
  }

  /* 添加子分类 */
  const [newSubTitle, setNewSubTitle] = useState('')
  const saveAddSub = () => {
    if (!addSubModal || !newSubTitle.trim()) { toast.error('名称不能为空'); return }
    const newId = Date.now()
    setData((prev) => prev.map((cat) => {
      if (cat.id !== addSubModal) return cat
      return { ...cat, children: [...cat.children, { id: newId, title: newSubTitle.trim(), nav: [] }] }
    }))
    setAddSubModal(null)
    setNewSubTitle('')
    toast.success('已添加')
  }

  const totalSites = data.reduce((a, cat) => a + cat.children.reduce((b, sub) => b + sub.nav.length, 0), 0)
  const totalSubs = data.reduce((a, cat) => a + cat.children.length, 0)

  if (loading) return <div className="admin-loading">加载中...</div>

  return (
    <div className="dash-scroll">
      <div className="page-head">
        <div>
          <h2 className="page-title"><span className="page-title-emoji">📁</span>分类管理</h2>
          <p className="page-desc">管理所有分类和子分类</p>
        </div>
        <div className="page-head-actions">
          <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </div>

      <div className="cat-stats">
        <div className="cat-stat-item">
          <span className="cat-stat-num">{data.length}</span>
          <span className="cat-stat-label">一级分类</span>
        </div>
        <div className="cat-stat-item">
          <span className="cat-stat-num">{totalSubs}</span>
          <span className="cat-stat-label">子分类</span>
        </div>
        <div className="cat-stat-item">
          <span className="cat-stat-num">{totalSites}</span>
          <span className="cat-stat-label">收录网站</span>
        </div>
      </div>

      <div className="cat-toolbar">
        <label className="cat-check-label">
          <input type="checkbox" checked={selected.size > 0 && [...data].every((cat) => selected.has(`cat-${cat.id}`) && cat.children.every((sub) => selected.has(`sub-${cat.id}-${sub.id}`)))} onChange={toggleSelectAll} />
          全选
        </label>
        {selected.size > 0 && (
          <button className="admin-btn-danger" onClick={batchDelete}>🗑️ 批量删除 ({selected.size})</button>
        )}
        <div style={{ flex: 1 }} />
        <button className="admin-btn" onClick={() => setAddCatModal(true)}>+ 添加一级分类</button>
      </div>

      <div className="cat-list">
        {data.map((cat) => {
          const siteCount = cat.children.reduce((a, s) => a + s.nav.length, 0)
          const catSelected = selected.has(`cat-${cat.id}`)
          return (
            <div key={cat.id} className="cat-card">
              <div className="cat-card-header">
                <div className="cat-card-left">
                  <input type="checkbox" checked={catSelected}
                    onChange={() => toggleSelect(`cat-${cat.id}`)} />
                  <span className="cat-card-icon">{cat.icon}</span>
                  <span className="cat-card-name">{cat.title}</span>
                  <span className="cat-card-badge">{cat.children.length} 子分类 · {siteCount} 网站</span>
                </div>
                <div className="cat-card-right">
                  <button className="cat-action-btn" onClick={() => setEditModal({ type: 'cat', catId: cat.id, title: cat.title, icon: cat.icon })} title="编辑">✏️</button>
                  <button className="cat-action-btn" onClick={() => setAddSubModal(cat.id)} title="添加子分类">+</button>
                  <button className="cat-action-btn danger" onClick={() => deleteCat(cat.id, cat.title)} title="删除">×</button>
                </div>
              </div>

              <div className="cat-sub-list">
                {cat.children.map((sub) => {
                  const subSelected = selected.has(`sub-${cat.id}-${sub.id}`)
                  return (
                    <div key={sub.id} className="cat-sub-item">
                      <input type="checkbox" checked={subSelected}
                        onChange={() => toggleSelect(`sub-${cat.id}-${sub.id}`)} />
                      <span className="cat-sub-dot" />
                      <span className="cat-sub-name">{sub.title}</span>
                      <span className="cat-sub-count">{sub.nav.length}</span>
                      <div className="cat-sub-actions">
                        <button className="cat-sub-btn" onClick={() => setEditModal({ type: 'sub', catId: cat.id, subId: sub.id, title: sub.title, icon: '' })} title="编辑">✏️</button>
                        <button className="cat-sub-btn" onClick={() => setMoveModal({ catId: cat.id, subId: sub.id, subTitle: sub.title })} title="移动">↗️</button>
                        <button className="cat-sub-btn danger" onClick={() => deleteSub(cat.id, sub.id, sub.title)} title="删除">×</button>
                      </div>
                    </div>
                  )
                })}
                {cat.children.length === 0 && <div className="cat-sub-empty">暂无子分类</div>}
              </div>
            </div>
          )
        })}
      </div>

      {data.length === 0 && (
        <div className="cat-empty">
          <div className="cat-empty-icon">📂</div>
          <div>暂无分类，点击上方按钮添加</div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editModal && (
        <div className="cm-overlay" onClick={() => setEditModal(null)}>
          <div className="cm-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="cm-title">{editModal.type === 'cat' ? '编辑分类' : '编辑子分类'}</h3>
            <div className="edit-modal-form">
              {editModal.type === 'cat' && (
                <>
                  <label>图标</label>
                  <input value={editModal.icon} onChange={(e) => setEditModal({ ...editModal, icon: e.target.value })} placeholder="📁" />
                </>
              )}
              <label>名称</label>
              <input value={editModal.title} onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()} autoFocus />
            </div>
            <div className="cm-actions">
              <button className="admin-btn" onClick={() => setEditModal(null)}>取消</button>
              <button className="admin-btn-primary" onClick={saveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 移动弹窗 */}
      {moveModal && (
        <div className="cm-overlay" onClick={() => setMoveModal(null)}>
          <div className="cm-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="cm-title">移动子分类</h3>
            <p className="cm-desc">将「{moveModal.subTitle}」移动到：</p>
            <div className="move-modal-list">
              {data.filter((c) => c.id !== moveModal.catId).map((cat) => (
                <div key={cat.id} className="move-modal-item" onClick={() => saveMove(cat.id)}>
                  <span className="move-modal-icon">{cat.icon}</span>
                  <span>{cat.title}</span>
                  <span className="cat-sub-count" style={{ marginLeft: 'auto' }}>{cat.children.length} 子分类</span>
                </div>
              ))}
            </div>
            <div className="cm-actions">
              <button className="admin-btn" onClick={() => setMoveModal(null)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加一级分类弹窗 */}
      {addCatModal && (
        <div className="cm-overlay" onClick={() => setAddCatModal(false)}>
          <div className="cm-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="cm-title">添加一级分类</h3>
            <div className="edit-modal-form">
              <label>图标</label>
              <input value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} placeholder="📁" />
              <label>名称</label>
              <input value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveAddCat()} autoFocus placeholder="分类名称" />
            </div>
            <div className="cm-actions">
              <button className="admin-btn" onClick={() => setAddCatModal(false)}>取消</button>
              <button className="admin-btn-primary" onClick={saveAddCat}>添加</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加子分类弹窗 */}
      {addSubModal && (
        <div className="cm-overlay" onClick={() => setAddSubModal(null)}>
          <div className="cm-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="cm-title">添加子分类</h3>
            <div className="edit-modal-form">
              <label>名称</label>
              <input value={newSubTitle} onChange={(e) => setNewSubTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveAddSub()} autoFocus placeholder="子分类名称" />
            </div>
            <div className="cm-actions">
              <button className="admin-btn" onClick={() => setAddSubModal(null)}>取消</button>
              <button className="admin-btn-primary" onClick={saveAddSub}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}