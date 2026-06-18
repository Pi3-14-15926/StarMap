import { useState, useEffect } from 'react'
import { api } from '../services/data'

export function Settings() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.getSettings()
      if (res?.content) setSettings(res.content)
    } catch (err: any) { setMessage(`❌ ${err.message}`) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try { await api.saveSettings(settings); setMessage('✅ 保存成功'); setTimeout(() => setMessage(''), 3000) }
    catch (err: any) { setMessage(`❌ ${err.message}`) }
    finally { setSaving(false) }
  }

  const update = (key: string, value: any) => setSettings((prev) => ({ ...prev, [key]: value }))

  if (loading) return <div className="admin-loading">加载中...</div>

  const fields = [
    { key: 'title', label: '站点标题', type: 'text' },
    { key: 'subtitle', label: '站点副标题', type: 'text' },
    { key: 'description', label: '站点描述', type: 'text' },
    { key: 'keywords', label: 'SEO 关键词', type: 'text' },
    { key: 'homeTitle', label: '首页标题', type: 'text' },
    { key: 'githubUrl', label: 'GitHub 地址', type: 'text' },
    { key: 'colorPrimary', label: '主题色', type: 'color' },
    { key: 'defaultSearchEngine', label: '默认搜索引擎', type: 'text' },
    { key: 'runtimeDate', label: '上线日期', type: 'date' },
    { key: 'icp', label: 'ICP 备案号', type: 'text' },
    { key: 'footerHtml', label: '页脚 HTML', type: 'textarea' },
  ]

  const favicon = settings.favicon || ''

  return (
    <div>
      <div className="admin-toolbar">
        <span>网站设置</span>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '💾 保存到 GitHub'}</button>
      </div>

      <div className="admin-settings-grid">
        {/* 网站图标 */}
        <div className="admin-settings-field" style={{ gridColumn: '1 / -1' }}>
          <label>网站图标 (Favicon)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F8FAFC',
              flexShrink: 0,
            }}>
              {favicon ? (
                <img src={favicon} alt="favicon" style={{ width: '1.5rem', height: '1.5rem', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <span style={{ fontSize: '1.25rem' }}>🌐</span>
              )}
            </div>
            <input
              type="text"
              value={favicon}
              onChange={(e) => update('favicon', e.target.value)}
              placeholder="输入图标 URL，如 https://example.com/favicon.ico"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        {fields.map((field) => (
          <div key={field.key} className="admin-settings-field">
            <label>{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea value={settings[field.key] || ''} onChange={(e) => update(field.key, e.target.value)} rows={3} />
            ) : (
              <input type={field.type} value={settings[field.key] || ''} onChange={(e) => update(field.key, e.target.value)} />
            )}
          </div>
        ))}

        {/* 布尔值开关 */}
        {['showGithub', 'showRuntime', 'showLogin', 'showSearch', 'showSideImage'].map((key) => (
          <div key={key} className="admin-settings-field">
            <label>{key}</label>
            <button
              className={`admin-toggle ${settings[key] ? 'on' : ''}`}
              onClick={() => update(key, !settings[key])}
            >
              {settings[key] ? '✅ 开启' : '❌ 关闭'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
