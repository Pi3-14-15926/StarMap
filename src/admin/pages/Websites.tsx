import { useState, useEffect } from 'react'
import { api } from '../services/data'
import type { Category } from '@ui/types'

export function Websites() {
  const [data, setData] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [expandedCats, setExpandedCats] = useState<number[]>([])
  const [editItem, setEditItem] = useState<any>(null)
  const [showAddWeb, setShowAddWeb] = useState<number | null>(null)
  const [newWeb, setNewWeb] = useState({ name: '', desc: '', url: '', icon: '', rate: 5, tag: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getDb()
      if (res?.content) setData(res.content)
    } catch (err: any) {
      setMessage(`❌ 加载失败: ${err.message}`)
    } finally { setLoading(false) }
  }

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

  const toggleCat = (id: number) => {
    setExpandedCats((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  /* 删除网站 */
  const deleteWeb = (catId: number, subId: number, webName: string) => {
    if (!confirm(`确定删除「${webName}」？`)) return
    setData((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat
        return {
          ...cat,
          children: cat.children.map((sub) => {
            if (sub.id !== subId) return sub
            return { ...sub, nav: sub.nav.filter((w) => w.name !== webName) }
          }),
        }
      })
    )
    setMessage('✅ 已删除（保存后生效）')
  }

  /* 添加网站 */
  const addWeb = (catId: number, subId: number) => {
    if (!newWeb.name || !newWeb.url) { setMessage('❌ 名称和链接不能为空'); return }
    setData((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat
        return {
          ...cat,
          children: cat.children.map((sub) => {
            if (sub.id !== subId) return sub
            return { ...sub, nav: [...sub.nav, { ...newWeb }] }
          }),
        }
      })
    )
    setNewWeb({ name: '', desc: '', url: '', icon: '', rate: 5, tag: '' })
    setShowAddWeb(null)
    setMessage('✅ 已添加（保存后生效）')
  }

  /* 编辑网站 */
  const saveEdit = () => {
    if (!editItem) return
    setData((prev) =>
      prev.map((cat) => ({
        ...cat,
        children: cat.children.map((sub) => ({
          ...sub,
          nav: sub.nav.map((w) => (w.name === editItem._oldName ? { ...editItem } : w)),
        })),
      }))
    )
    setEditItem(null)
    setMessage('✅ 已修改（保存后生效）')
  }

  if (loading) return <div className="admin-loading">加载中...</div>

  return (
    <div>
      {/* 操作栏 */}
      <div className="admin-toolbar">
        <span className="admin-toolbar-info">
          共 {data.reduce((a, c) => a + c.children.reduce((b, s) => b + s.nav.length, 0), 0)} 个网站
        </span>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '💾 保存到 GitHub'}
        </button>
      </div>

      {/* 分类树 */}
      <div className="admin-tree">
        {data.map((cat) => (
          <div key={cat.id} className="admin-tree-cat">
            <div className="admin-tree-cat-header" onClick={() => toggleCat(cat.id)}>
              <span className="admin-tree-arrow">{expandedCats.includes(cat.id) ? '▼' : '▶'}</span>
              <span className="admin-tree-icon">{cat.icon}</span>
              <span className="admin-tree-name">{cat.title}</span>
              <span className="admin-tree-count">{cat.children.reduce((a, s) => a + s.nav.length, 0)}</span>
            </div>

            {expandedCats.includes(cat.id) && (
              <div className="admin-tree-subs">
                {cat.children.map((sub) => (
                  <div key={sub.id} className="admin-tree-sub">
                    <div className="admin-tree-sub-header">
                      <span className="admin-tree-name">{sub.title}</span>
                      <span className="admin-tree-count">{sub.nav.length}</span>
                      <button className="admin-btn-sm" onClick={() => setShowAddWeb(sub.id)}>+ 添加</button>
                    </div>

                    {/* 网站列表 */}
                    <div className="admin-tree-webs">
                      {sub.nav.map((web) => (
                        <div key={web.name} className="admin-tree-web">
                          <img src={web.icon} alt="" className="admin-tree-web-icon"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <span className="admin-tree-web-name">{web.name}</span>
                          <span className="admin-tree-web-url">{web.url}</span>
                          <span className="admin-tree-web-rating">{'★'.repeat(web.rate)}</span>
                          {web.tag && <span className="admin-tree-web-tag">{web.tag}</span>}
                          <div className="admin-tree-web-actions">
                            <button className="admin-btn-text" onClick={() => setEditItem({ ...web, _oldName: web.name, _catId: cat.id, _subId: sub.id })}>编辑</button>
                            <button className="admin-btn-text danger" onClick={() => deleteWeb(cat.id, sub.id, web.name)}>删除</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 添加表单 */}
                    {showAddWeb === sub.id && (
                      <div className="admin-add-form">
                        <input placeholder="名称 *" value={newWeb.name} onChange={(e) => setNewWeb({ ...newWeb, name: e.target.value })} />
                        <input placeholder="描述" value={newWeb.desc} onChange={(e) => setNewWeb({ ...newWeb, desc: e.target.value })} />
                        <input placeholder="链接 *" value={newWeb.url} onChange={(e) => setNewWeb({ ...newWeb, url: e.target.value })} />
                        <input placeholder="图标 URL" value={newWeb.icon} onChange={(e) => setNewWeb({ ...newWeb, icon: e.target.value })} />
                        <input placeholder="标签" value={newWeb.tag} onChange={(e) => setNewWeb({ ...newWeb, tag: e.target.value })} />
                        <div className="admin-add-actions">
                          <button className="admin-btn-primary" onClick={() => addWeb(cat.id, sub.id)}>确定</button>
                          <button className="admin-btn" onClick={() => setShowAddWeb(null)}>取消</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 编辑弹窗 */}
      {editItem && (
        <div className="admin-modal-overlay" onClick={() => setEditItem(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>编辑网站</h3>
            <div className="admin-modal-form">
              <label>名称</label>
              <input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              <label>描述</label>
              <input value={editItem.desc} onChange={(e) => setEditItem({ ...editItem, desc: e.target.value })} />
              <label>链接</label>
              <input value={editItem.url} onChange={(e) => setEditItem({ ...editItem, url: e.target.value })} />
              <label>图标 URL</label>
              <input value={editItem.icon} onChange={(e) => setEditItem({ ...editItem, icon: e.target.value })} />
              <label>评分 (1-5)</label>
              <input type="number" min={1} max={5} value={editItem.rate} onChange={(e) => setEditItem({ ...editItem, rate: Number(e.target.value) })} />
              <label>标签</label>
              <input value={editItem.tag || ''} onChange={(e) => setEditItem({ ...editItem, tag: e.target.value })} />
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
