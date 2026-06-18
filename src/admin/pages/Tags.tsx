import { useState, useEffect } from 'react'
import { api } from '../services/data'

interface Tag { id: number; name: string; color: string }

export function Tags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getTags()
      if (res?.content) setTags(res.content)
    } catch (err: any) { setMessage(`❌ ${err.message}`) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await api.saveTags(tags); setMessage('✅ 保存成功'); setTimeout(() => setMessage(''), 3000) }
    catch (err: any) { setMessage(`❌ ${err.message}`) }
    finally { setSaving(false) }
  }

  const updateTag = (idx: number, field: keyof Tag, value: string) => {
    setTags((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  const addTag = () => {
    setTags([...tags, { id: Date.now(), name: '', color: '#1677FF' }])
  }

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="admin-loading">加载中...</div>

  return (
    <div>
      <div className="admin-toolbar">
        <span>共 {tags.length} 个标签</span>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '💾 保存到 GitHub'}</button>
      </div>

      <div className="admin-tag-list">
        {tags.map((tag, idx) => (
          <div key={tag.id} className="admin-tag-row">
            <input className="admin-tag-color-input" type="color" value={tag.color}
              onChange={(e) => updateTag(idx, 'color', e.target.value)} />
            <span className="admin-tag-preview" style={{ background: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}>
              {tag.name || '预览'}
            </span>
            <input className="admin-tag-name-input" value={tag.name} placeholder="标签名称"
              onChange={(e) => updateTag(idx, 'name', e.target.value)} />
            <button className="admin-btn-text danger" onClick={() => removeTag(idx)}>删除</button>
          </div>
        ))}
      </div>
      <button className="admin-btn" onClick={addTag} style={{ marginTop: 12 }}>+ 添加标签</button>
    </div>
  )
}
