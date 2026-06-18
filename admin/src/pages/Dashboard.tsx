import { useState, useEffect } from 'react'
import { getFileContent, DATA_FILES, saveNavData, saveSettings, saveSearchEngines, saveTags } from '../services/github'
import type { NavData, Settings, TagItem } from '@ui/types'

type Section = 'websites' | 'settings' | 'search' | 'tags' | 'categories'

export function Dashboard() {
  const [section, setSection] = useState<Section>('websites')
  const [navData, setNavData] = useState<NavData>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [searchEngines, setSearchEngines] = useState<any[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [navRes, settingsRes, searchRes, tagsRes] = await Promise.all([
        getFileContent(DATA_FILES.nav.db),
        getFileContent(DATA_FILES.nav.settings),
        getFileContent(DATA_FILES.nav.search),
        getFileContent(DATA_FILES.nav.tag),
      ])
      if (navRes.data) setNavData(navRes.data)
      if (settingsRes.data) setSettings(settingsRes.data)
      if (searchRes.data) setSearchEngines(searchRes.data)
      if (tagsRes.data) setTags(tagsRes.data)
    } catch (err: any) {
      setMessage(`加载失败: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await Promise.all([
        saveNavData(navData),
        settings ? saveSettings(settings) : Promise.resolve(),
        saveSearchEngines(searchEngines),
        saveTags(tags),
      ])
      setMessage('✅ 保存成功')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage(`❌ 保存失败: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('starmap_github_token')
    window.location.reload()
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'websites', label: '网站管理' },
    { key: 'categories', label: '分类管理' },
    { key: 'tags', label: '标签管理' },
    { key: 'search', label: '搜索引擎' },
    { key: 'settings', label: '系统设置' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>正在加载数据...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--apple-bg)' }}>
      {/* 侧边导航 - Apple 风格 */}
      <aside
        style={{
          width: 220,
          background: 'var(--apple-card)',
          borderRight: '1px solid var(--apple-border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: '-0.02em' }}>管理后台</h2>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: section === s.key ? 600 : 400,
                color: section === s.key ? 'var(--color-primary)' : 'var(--apple-text)',
                background: section === s.key ? 'var(--mi-orange-light)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (section !== s.key) e.currentTarget.style.background = 'var(--color-bg)'
              }}
              onMouseLeave={(e) => {
                if (section !== s.key) e.currentTarget.style.background = 'transparent'
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            textAlign: 'left',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          ← 退出登录
        </button>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, padding: 32, maxWidth: 960 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>
            {sections.find((s) => s.key === section)?.label}
          </h1>

          {/* 保存按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {message && (
              <span style={{ fontSize: 13, color: message.includes('✅') ? 'var(--color-success)' : 'var(--color-error)' }}>
                {message}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 24px',
                background: saving ? '#ccc' : 'var(--color-primary)',
                color: '#fff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-fast)',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? '保存中...' : '保存到 GitHub'}
            </button>
          </div>
        </div>

        {/* 不同 section 的内容 */}
        {section === 'websites' && (
          <div>
            <p style={{ color: 'var(--apple-text-secondary)', marginBottom: 16, fontSize: 14 }}>
              共 {navData.reduce((acc, c1) => acc + c1.nav.reduce((a, c2) => a + c2.nav.reduce((b, c3) => b + (c3.nav?.length || 0), 0), 0), 0)} 个网站
            </p>
            <pre
              contentEditable
              suppressContentEditableWarning
              style={{
                background: 'var(--color-bg-container)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                fontSize: 13,
                fontFamily: 'monospace',
                minHeight: 400,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                outline: 'none',
              }}
              onBlur={(e) => {
                try {
                  const parsed = JSON.parse(e.currentTarget.textContent || '[]')
                  setNavData(parsed)
                } catch { /* ignore invalid json while editing */ }
              }}
            >
              {JSON.stringify(navData, null, 2)}
            </pre>
          </div>
        )}

        {section === 'categories' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>分类结构（1/2/3级）</h3>
            {navData.map((c1) => (
              <div key={c1.id} style={{ marginBottom: 16, padding: 16, background: 'var(--apple-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--apple-shadow)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>📁 {c1.title} (ID: {c1.id})</h4>
                {c1.nav.map((c2) => (
                  <div key={c2.id} style={{ paddingLeft: 20, marginBottom: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--apple-text-secondary)' }}>├─ {c2.title} (ID: {c2.id})</p>
                    {c2.nav.map((c3) => (
                      <div key={c3.id} style={{ paddingLeft: 20, fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                        │  └─ {c3.title} (ID: {c3.id}) - {c3.nav?.length || 0} 个网站
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {section === 'tags' && (
          <div>
            {tags.map((tag, idx) => (
              <div key={tag.id} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                <input
                  value={tag.name}
                  onChange={(e) => {
                    const newTags = [...tags]
                    newTags[idx] = { ...tag, name: e.target.value }
                    setTags(newTags)
                  }}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                  placeholder="标签名"
                />
                <input
                  value={tag.color}
                  onChange={(e) => {
                    const newTags = [...tags]
                    newTags[idx] = { ...tag, color: e.target.value }
                    setTags(newTags)
                  }}
                  style={{ width: 100, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                  placeholder="颜色"
                />
                <span style={{ width: 24, height: 24, borderRadius: 4, background: tag.color }} />
                <button
                  onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                  style={{ color: 'var(--color-error)', fontSize: 13, padding: '4px 8px' }}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              onClick={() => setTags([...tags, { id: Date.now(), name: '', color: '#1677ff' }])}
              style={{ marginTop: 8, padding: '8px 16px', color: 'var(--color-primary)', fontSize: 14, borderRadius: 6, border: '1px dashed var(--color-primary)' }}
            >
              + 添加标签
            </button>
          </div>
        )}

        {section === 'search' && (
          <div>
            {searchEngines.map((engine, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                <input
                  value={engine.name}
                  onChange={(e) => {
                    const newEngines = [...searchEngines]
                    newEngines[idx] = { ...engine, name: e.target.value }
                    setSearchEngines(newEngines)
                  }}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                  placeholder="名称"
                />
                <input
                  value={engine.url}
                  onChange={(e) => {
                    const newEngines = [...searchEngines]
                    newEngines[idx] = { ...engine, url: e.target.value }
                    setSearchEngines(newEngines)
                  }}
                  style={{ flex: 2, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                  placeholder="搜索 URL"
                />
                <input
                  value={engine.icon}
                  onChange={(e) => {
                    const newEngines = [...searchEngines]
                    newEngines[idx] = { ...engine, icon: e.target.value }
                    setSearchEngines(newEngines)
                  }}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)' }}
                  placeholder="图标 URL"
                />
                <button
                  onClick={() => {
                    const newEngines = [...searchEngines]
                    newEngines[idx] = { ...engine, isDefault: !engine.isDefault }
                    setSearchEngines(newEngines.map((e, i) => ({ ...e, isDefault: i === idx })))
                  }}
                  style={{
                    padding: '4px 12px', borderRadius: 6,
                    background: engine.isDefault ? 'var(--color-primary)' : 'var(--color-bg)',
                    color: engine.isDefault ? '#fff' : 'var(--color-text)',
                    fontSize: 12,
                  }}
                >
                  {engine.isDefault ? '默认' : '设为默认'}
                </button>
                <button
                  onClick={() => setSearchEngines(searchEngines.filter((_, i) => i !== idx))}
                  style={{ color: 'var(--color-error)', fontSize: 13 }}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              onClick={() => setSearchEngines([...searchEngines, { name: '', url: '', icon: '', isDefault: false }])}
              style={{ marginTop: 8, padding: '8px 16px', color: 'var(--color-primary)', fontSize: 14, borderRadius: 6, border: '1px dashed var(--color-primary)' }}
            >
              + 添加搜索引擎
            </button>
          </div>
        )}

        {section === 'settings' && settings && (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, color: 'var(--apple-text-secondary)', fontWeight: 500 }}>{key}</label>
                {typeof value === 'boolean' ? (
                  <button
                    onClick={() => setSettings({ ...settings, [key]: !value })}
                    style={{
                      padding: '8px 12px', borderRadius: 6,
                      background: value ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: value ? '#fff' : 'var(--color-text)',
                      fontSize: 13,
                      textAlign: 'center',
                    }}
                  >
                    {String(value)}
                  </button>
                ) : (
                  <input
                    value={String(value)}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 13 }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
