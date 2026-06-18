import { useState, useEffect } from 'react'
import { api } from '../services/data'

interface Engine { name: string; icon: string; url: string; isDefault?: boolean }

export function SearchEngines() {
  const [engines, setEngines] = useState<Engine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getSearch()
      if (res?.content) setEngines(res.content)
    } catch (err: any) { setMessage(`❌ ${err.message}`) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await api.saveSearch(engines); setMessage('✅ 保存成功'); setTimeout(() => setMessage(''), 3000) }
    catch (err: any) { setMessage(`❌ ${err.message}`) }
    finally { setSaving(false) }
  }

  const update = (idx: number, field: keyof Engine, value: any) => {
    setEngines((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const setDefault = (idx: number) => {
    setEngines((prev) => prev.map((e, i) => ({ ...e, isDefault: i === idx })))
  }

  const add = () => setEngines([...engines, { name: '', url: '', icon: '', isDefault: false }])
  const remove = (idx: number) => setEngines(engines.filter((_, i) => i !== idx))

  if (loading) return <div className="admin-loading">加载中...</div>

  return (
    <div>
      <div className="admin-toolbar">
        <span>共 {engines.length} 个搜索引擎</span>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '💾 保存到 GitHub'}</button>
      </div>

      <div className="admin-engine-list">
        {engines.map((engine, idx) => (
          <div key={idx} className="admin-engine-row">
            <img src={engine.icon} alt="" width={20} height={20} className="admin-engine-icon"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <input value={engine.name} placeholder="名称" onChange={(e) => update(idx, 'name', e.target.value)} />
            <input value={engine.url} placeholder="搜索 URL (如 https://www.google.com/search?q=)" onChange={(e) => update(idx, 'url', e.target.value)} className="admin-engine-url" />
            <input value={engine.icon} placeholder="图标 URL" onChange={(e) => update(idx, 'icon', e.target.value)} />
            <button className={`admin-btn-sm ${engine.isDefault ? 'active' : ''}`} onClick={() => setDefault(idx)}>
              {engine.isDefault ? '✓ 默认' : '设为默认'}
            </button>
            <button className="admin-btn-text danger" onClick={() => remove(idx)}>删除</button>
          </div>
        ))}
      </div>
      <button className="admin-btn" onClick={add} style={{ marginTop: 12 }}>+ 添加搜索引擎</button>
    </div>
  )
}
