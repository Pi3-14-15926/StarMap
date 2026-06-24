import { useState, useEffect } from 'react'
import { api } from '../services/data'
import { describeCdn, type IconCdnMode } from '../services/iconUrl'

const CDN_OPTIONS: { label: string; value: IconCdnMode }[] = [
  { label: 'jsDelivr（国内可用，推荐）', value: 'jsdelivr' },
  { label: 'Statically', value: 'statically' },
  { label: 'GitHack', value: 'githack' },
  { label: '自定义 Base URL', value: 'custom' },
  { label: '不使用加速', value: 'none' },
]

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
  const cdnMode: IconCdnMode = settings.iconCdnMode || 'jsdelivr'

  return (
    <div className="settings-scroll">
      {/* 页面头部 */}
      <div className="page-head">
        <div>
          <h2 className="page-title"><span className="page-title-emoji">⚙️</span>网站设置</h2>
          <p className="page-desc">管理站点基本信息、外观和功能开关</p>
        </div>
        <div className="head-actions">
          {message && <span className={`save-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
          <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 基本信息 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon">📝</div>
          <div>
            <h3 className="card-title">基本信息</h3>
            <p className="card-desc">站点标题、描述、SEO 等基础配置</p>
          </div>
        </header>

        {/* 网站图标 */}
        <div className="field" style={{ marginBottom: 16 }}>
          <label className="field-label">网站图标 (Favicon)</label>
          <div className="favicon-row">
            <div className="favicon-preview">
              {favicon ? (
                <img src={favicon} alt="favicon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <span>🌐</span>
              )}
            </div>
            <input
              type="text"
              className="field-input"
              value={favicon}
              onChange={(e) => update('favicon', e.target.value)}
              placeholder="输入图标 URL，如 https://example.com/favicon.ico"
            />
          </div>
        </div>

        <div className="form-grid-2">
          {fields.map((field) => (
            <div key={field.key} className={`field ${field.key === 'footerHtml' || field.key === 'githubUrl' ? 'field-full' : ''}`}>
              <label className="field-label">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea className="field-textarea" value={settings[field.key] || ''} onChange={(e) => update(field.key, e.target.value)} rows={3} />
              ) : (
                <input className="field-input" type={field.type} value={settings[field.key] || ''} onChange={(e) => update(field.key, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 显示开关 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.28)' }}>🎛️</div>
          <div>
            <h3 className="card-title">显示设置</h3>
            <p className="card-desc">控制前台页面元素的显示与隐藏</p>
          </div>
        </header>

        <div className="switch-grid">
          {[
            { key: 'showGithub', name: 'GitHub 按钮', desc: '在首页显示 GitHub 仓库链接按钮' },
            { key: 'showRuntime', name: '运行时间', desc: '在页脚显示站点运行天数' },
            { key: 'showLogin', name: '管理入口', desc: '在页脚显示后台管理登录入口' },
            { key: 'showRating', name: '评分显示', desc: '在网站卡片上显示评分星级' },
          ].map((item) => (
            <div key={item.key} className={`switch-card ${settings[item.key] ? 'active' : ''}`}>
              <div className="switch-info">
                <div className="switch-name">{item.name}</div>
                <div className="switch-desc">{item.desc}</div>
              </div>
              <button className={`toggle-switch ${settings[item.key] ? 'on' : ''}`} onClick={() => update(item.key, !settings[item.key])}>
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 导航跳转卡片 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon" style={{ background: 'linear-gradient(135deg, #4F8CFF, #8C6CFF)', boxShadow: '0 6px 20px rgba(79,140,255,0.28)' }}>🧭</div>
          <div>
            <h3 className="card-title">导航跳转卡片</h3>
            <p className="card-desc">配置首页顶部的快捷导航按钮，最多 3 个</p>
          </div>
        </header>

        {[0, 1, 2].map((i) => {
          const cards = (settings.navCards || []) as { title: string; icon: string; url: string }[]
          const card = cards[i] || { title: '', icon: '', url: '' }
          return (
            <div key={i} className="nav-card-row">
              <span className="nav-card-idx">{i + 1}</span>
              <input className="field-input" style={{ width: 80 }} value={card.icon} placeholder="图标"
                onChange={(e) => {
                  const newCards = [...cards]
                  newCards[i] = { ...newCards[i], icon: e.target.value }
                  update('navCards', newCards)
                }} />
              <input className="field-input" style={{ flex: 1 }} value={card.title} placeholder="按钮标题"
                onChange={(e) => {
                  const newCards = [...cards]
                  newCards[i] = { ...newCards[i], title: e.target.value }
                  update('navCards', newCards)
                }} />
              <input className="field-input" style={{ flex: 2 }} value={card.url} placeholder="跳转链接，如 https://example.com"
                onChange={(e) => {
                  const newCards = [...cards]
                  newCards[i] = { ...newCards[i], url: e.target.value }
                  update('navCards', newCards)
                }} />
            </div>
          )
        })}
        <p className="card-hint">留空的卡片不会显示。卡片将在首页顶部搜索框右侧展示。</p>
      </section>

      {/* 图标 CDN 加速 */}
      <section className="settings-card">
        <header className="card-head">
          <div className="card-icon">🌍</div>
          <div>
            <h3 className="card-title">图标 CDN 加速</h3>
            <p className="card-desc">让所有 GitHub raw 图片自动走更快镜像，国内访问更顺畅</p>
          </div>
        </header>

        <div className="field">
          <label className="field-label">加速策略</label>
          <select className="field-select" value={cdnMode} onChange={(e) => update('iconCdnMode', e.target.value)}>
            {CDN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="field-hint">
            当前选择：<strong style={{ color: '#3478F6' }}>{describeCdn(cdnMode)}</strong>
          </p>
        </div>

        {cdnMode === 'custom' && (
          <div className="field" style={{ marginTop: 12 }}>
            <label className="field-label">自定义 Base URL</label>
            <input
              className="field-input"
              type="text"
              value={settings.iconCdnCustomBase || ''}
              onChange={(e) => update('iconCdnCustomBase', e.target.value)}
              placeholder="https://your-cdn.example.com/"
            />
            <p className="field-hint">
              最终 URL 形如：<code>{settings.iconCdnCustomBase || 'https://your-cdn.example.com/'}raw.githubusercontent.com/owner/repo/branch/path</code>
            </p>
          </div>
        )}

        <p className="card-hint">
          配置后 <code>raw.githubusercontent.com</code> 域名的图标 URL 会自动替换为更快镜像。
        </p>
      </section>

      <div className="form-actions">
        <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
