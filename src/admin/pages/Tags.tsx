import { useState, useEffect } from 'react'
import { api } from '../services/data'
import { useConfirm } from '../components/ConfirmModal'
import { useToast } from '../components/Toast'
import type { TagItem } from '@ui/types'

export function Tags() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { confirm } = useConfirm()
  const toast = useToast()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getTags()
      if (res?.content) setTags(res.content)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const cleaned = tags.map((t) => {
        const item: TagItem = { ...t }
        if (item.sort === undefined || item.sort === null || (item.sort as any) === '') {
          delete item.sort
        } else {
          item.sort = Number(item.sort)
        }
        if (item.desc === undefined) item.desc = ''
        return item
      })
      await api.saveTags(cleaned)
      toast.success('保存成功')
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const updateTag = (idx: number, field: keyof TagItem, value: any) => {
    setTags((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  const addTag = () => {
    const maxId = tags.length > 0 ? Math.max(...tags.map((t) => t.id)) : 0
    setTags([...tags, {
      id: maxId + 1,
      name: '',
      color: '#4F8CFF',
      desc: '',
      noOpen: false,
      sort: tags.length + 1,
    }])
  }

  const removeTag = async (idx: number) => {
    const tag = tags[idx]
    const ok = await confirm({
      title: '删除标签',
      description: `确定删除标签「${tag.name || '未命名'}」？此操作不可恢复。`,
    })
    if (!ok) return
    setTags(tags.filter((_, i) => i !== idx))
    toast.success('已删除')
  }

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...tags]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setTags(next)
  }

  const moveDown = (idx: number) => {
    if (idx === tags.length - 1) return
    const next = [...tags]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setTags(next)
  }

  const toggleNoOpen = (idx: number) => {
    setTags((prev) => prev.map((t, i) => i === idx ? { ...t, noOpen: !t.noOpen } : t))
  }

  if (loading) return <div className="admin-loading">加载中...</div>

  return (
    <div className="dash-scroll">
      <div className="page-head">
        <div>
          <h2 className="page-title"><span className="page-title-emoji">🏷️</span>标签管理</h2>
          <p className="page-desc">管理所有标签，控制前台展示和排序</p>
        </div>
        <div className="page-head-actions">
          <button className="admin-btn" onClick={addTag}>+ 添加标签</button>
          <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '💾 保存'}
          </button>
        </div>
      </div>

      <div className="tag-table-wrapper">
        <table className="tag-table">
          <thead>
            <tr>
              <th className="tag-th-visible">公开</th>
              <th className="tag-th-name">标签名称</th>
              <th className="tag-th-color">颜色</th>
              <th className="tag-th-sort">排序</th>
              <th className="tag-th-desc">描述 / 备注</th>
              <th className="tag-th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag, idx) => (
              <tr key={tag.id} className="tag-row">
                <td className="tag-td-visible">
                  <button
                    className={`tag-toggle ${!tag.noOpen ? 'on' : ''}`}
                    onClick={() => toggleNoOpen(idx)}
                    title={tag.noOpen ? '已隐藏' : '已展示'}
                  >
                    <span className="tag-toggle-dot" />
                  </button>
                </td>
                <td className="tag-td-name">
                  <div className="tag-name-cell">
                    <span className="tag-dot" style={{ background: tag.color }} />
                    <input
                      className="tag-input"
                      value={tag.name}
                      placeholder="标签名称"
                      maxLength={10}
                      onChange={(e) => updateTag(idx, 'name', e.target.value)}
                    />
                  </div>
                </td>
                <td className="tag-td-color">
                  <div className="tag-color-cell">
                    <label className="tag-color-picker">
                      <input
                        type="color"
                        value={tag.color}
                        onChange={(e) => updateTag(idx, 'color', e.target.value)}
                      />
                      <span className="tag-color-swatch" style={{ background: tag.color }} />
                    </label>
                    <span className="tag-color-value">{tag.color}</span>
                  </div>
                </td>
                <td className="tag-td-sort">
                  <input
                    className="tag-input tag-input-sm"
                    type="number"
                    min={0}
                    value={tag.sort ?? ''}
                    placeholder="—"
                    onChange={(e) => updateTag(idx, 'sort', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </td>
                <td className="tag-td-desc">
                  <input
                    className="tag-input"
                    value={tag.desc || ''}
                    placeholder="添加描述..."
                    maxLength={30}
                    onChange={(e) => updateTag(idx, 'desc', e.target.value)}
                  />
                </td>
                <td className="tag-td-actions">
                  <div className="tag-actions">
                    <button className="tag-action-btn" onClick={() => moveUp(idx)} disabled={idx === 0} title="上移">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                    <button className="tag-action-btn" onClick={() => moveDown(idx)} disabled={idx === tags.length - 1} title="下移">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <button className="tag-action-btn danger" onClick={() => removeTag(idx)} title="删除">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tags.length === 0 && (
        <div className="tag-empty">
          <div className="tag-empty-icon">🏷️</div>
          <div>暂无标签，点击上方按钮添加</div>
        </div>
      )}
    </div>
  )
}
