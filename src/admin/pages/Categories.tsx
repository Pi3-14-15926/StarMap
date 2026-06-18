import { useState, useEffect } from 'react'
import { api } from '../services/github'
import type { Category } from '@ui/types'

export function Categories() {
  const [data, setData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editCat, setEditCat] = useState<any>(null)
  const [addCat, setAddCat] = useState<{ title: string; icon: string } | null>(null)
  const [addSub, setAddSub] = useState<{ catId: number; title: string } | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getDb()
      if (res?.content) setData(res.content)
    } catch (err: any) { setMessage(`❌ ${err.message}`) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await api.saveDb(data); setMessage('✅ 保存成功'); setTimeout(() => setMessage(''), 3000) }
    catch (err: any) { setMessage(`❌ ${err.message}`) }
    finally { setSaving(false) }
  }

  /* 添加一级分类 */
  const addCategory = () => {
    if (!addCat?.title) return
    const newId = Math.max(0, ...data.map((c) => c.id)) + 1
    setData([...data, { id: newId, title: addCat.title, icon: addCat.icon || '📁', children: [] }])
    setAddCat(null)
    setMessage('✅ 已添加')
  }

  /* 添加二级分类 */
  const addSubCategory = () => {
    if (!addSub?.title) return
    const newId = Date.now()
    setData((prev) => prev.map((cat) => {
      if (cat.id !== addSub.catId) return cat
      return { ...cat, children: [...cat.children, { id: newId, title: addSub.title, nav: [] }] }
    }))
    setAddSub(null)
    setMessage('✅ 已添加')
  }

  /* 删除分类 */
  const deleteCat = (catId: number) => {
    if (!confirm('确定删除此分类及其所有内容？')) return
    setData((prev) => prev.filter((c) => c.id !== catId))
    setMessage('✅ 已删除')
  }

  const deleteSub = (catId: number, subId: number) => {
    if (!confirm('确定删除此子分类？')) return
    setData((prev) => prev.map((cat) => {
      if (cat.id !== catId) return cat
      return { ...cat, children: cat.children.filter((s) => s.id !== subId) }
    }))
    setMessage('✅ 已删除')
  }

  /* 重命名 */
  const renameCat = (catId: number, newTitle: string) => {
    setData((prev) => prev.map((cat) => cat.id === catId ? { ...cat, title: newTitle } : cat))
  }

  const renameSub = (catId: number, subId: number, newTitle: string) => {
    setData((prev) => prev.map((cat) => {
      if (cat.id !== catId) return cat
      return { ...cat, children: cat.children.map((sub) => sub.id === subId ? { ...sub, title: newTitle } : sub) }
    }))
  }

  if (loading) return <div className="admin-loading">加载中...</div>

  return (
    <div>
      <div className="admin-toolbar">
        <span>共 {data.length} 个一级分类</span>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '💾 保存到 GitHub'}</button>
      </div>

      {/* 添加一级分类 */}
      <div className="admin-section">
        <button className="admin-btn" onClick={() => setAddCat({ title: '', icon: '📁' })}>+ 添加一级分类</button>
        {addCat && (
          <div className="admin-add-inline">
            <input placeholder="图标" value={addCat.icon} onChange={(e) => setAddCat({ ...addCat, icon: e.target.value })} style={{ width: 60 }} />
            <input placeholder="分类名称 *" value={addCat.title} onChange={(e) => setAddCat({ ...addCat, title: e.target.value })} />
            <button className="admin-btn-primary" onClick={addCategory}>确定</button>
            <button className="admin-btn" onClick={() => setAddCat(null)}>取消</button>
          </div>
        )}
      </div>

      {/* 分类列表 */}
      <div className="admin-cat-list">
        {data.map((cat) => (
          <div key={cat.id} className="admin-cat-item">
            <div className="admin-cat-header">
              <span className="admin-cat-icon">{cat.icon}</span>
              {editCat?.type === 'cat' && editCat.id === cat.id ? (
                <input className="admin-rename-input" value={editCat.title}
                  onChange={(e) => { setEditCat({ ...editCat, title: e.target.value }); renameCat(cat.id, e.target.value) }}
                  onBlur={() => setEditCat(null)} autoFocus />
              ) : (
                <span className="admin-cat-title" onClick={() => setEditCat({ type: 'cat', id: cat.id, title: cat.title })}>{cat.title}</span>
              )}
              <span className="admin-cat-count">{cat.children.reduce((a, s) => a + s.nav.length, 0)} 个网站</span>
              <button className="admin-btn-text danger" onClick={() => deleteCat(cat.id)}>删除</button>
            </div>

            {/* 二级分类 */}
            <div className="admin-sub-list">
              {cat.children.map((sub) => (
                <div key={sub.id} className="admin-sub-item">
                  <span className="admin-sub-bullet">├─</span>
                  <span className="admin-sub-title">{sub.title}</span>
                  <span className="admin-sub-count">{sub.nav.length}</span>
                  <button className="admin-btn-text danger" onClick={() => deleteSub(cat.id, sub.id)}>删除</button>
                </div>
              ))}
              <button className="admin-btn-sm" onClick={() => setAddSub({ catId: cat.id, title: '' })}>+ 添加子分类</button>
              {addSub?.catId === cat.id && (
                <div className="admin-add-inline">
                  <input placeholder="子分类名称" value={addSub.title} onChange={(e) => setAddSub({ ...addSub, title: e.target.value })} autoFocus />
                  <button className="admin-btn-primary" onClick={addSubCategory}>确定</button>
                  <button className="admin-btn" onClick={() => setAddSub(null)}>取消</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
