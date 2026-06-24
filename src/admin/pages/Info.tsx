import { useState, useEffect, useRef } from 'react'
import { api } from '../services/data'
import { localApi } from '../services/local'
import { commitAllData } from '../services/github'
import { getRepoDisplay, isAuthenticated } from '../services/auth'

export function Info() {
  const [info, setInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [baking, setBaking] = useState(false)
  const [commitUrl, setCommitUrl] = useState('')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 4000)
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [dbRes, tagRes] = await Promise.all([
          api.getDb(),
          api.getTags(),
        ])
        const db = dbRes?.content || []
        const totalSites = db.reduce((a: number, cat: any) =>
          a + (cat.children || []).reduce((b: number, sub: any) => b + (sub.nav?.length || 0), 0), 0)
        setInfo({
          totalSites,
          totalCategories: db.length,
          totalSubCategories: db.reduce((a: number, cat: any) => a + (cat.children?.length || 0), 0),
          totalTags: tagRes?.content?.length || 0,
        })
      } catch { }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const [dbRes, settingsRes, searchRes, tagRes] = await Promise.all([
        api.getDb(),
        api.getSettings(),
        api.getSearch(),
        api.getTags(),
      ])
      const wrapper = {
        exportTime: new Date().toISOString(),
        version: '1.0.0',
        db: dbRes?.content || [],
        settings: settingsRes?.content || {},
        search: searchRes?.content || [],
        tags: tagRes?.content || [],
      }
      const blob = new Blob([JSON.stringify(wrapper, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `starmap-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showMessage('✅ 导出成功')
    } catch (e: any) {
      showMessage(`❌ 导出失败: ${e.message}`)
    } finally {
      setExporting(false)
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string
        const data = JSON.parse(text)
        if (!data.db && !data.settings && !data.search && !data.tags) {
          showMessage('❌ 无效的备份文件：缺少必需字段')
          setImporting(false)
          return
        }
        await Promise.all([
          data.db ? api.saveDb(data.db) : Promise.resolve(),
          data.settings ? api.saveSettings(data.settings) : Promise.resolve(),
          data.search ? api.saveSearch(data.search) : Promise.resolve(),
          data.tags ? api.saveTags(data.tags) : Promise.resolve(),
        ])
        showMessage(`✅ 导入成功！${data.db?.length || 0} 个分类`)
      } catch (err: any) {
        showMessage(`❌ 导入失败: ${err.message}`)
      } finally {
        setImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.onerror = () => { showMessage('❌ 文件读取失败'); setImporting(false) }
    reader.readAsText(file)
  }

  const handleBakeDefaults = async () => {
    if (!import.meta.env.DEV) {
      showMessage('⚠️ 写入默认配置仅在本地开发环境可用')
      return
    }
    setBaking(true)
    try {
      const settingsRes = await api.getSettings()
      const settings = settingsRes?.content || {}
      const res = await fetch('/__bake-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '未知错误' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      showMessage('✅ 默认配置已写入 src/defaults.ts')
    } catch (e: any) {
      showMessage(`❌ 写入失败: ${e.message}`)
    } finally {
      setBaking(false)
    }
  }

  const handleResetDefaults = async () => {
    try {
      localApi.resetAll()
      showMessage('✅ 所有数据已恢复为默认值')
    } catch (e: any) {
      showMessage(`❌ 恢复失败: ${e.message}`)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    setCommitUrl('')
    try {
      const result = await commitAllData()
      setCommitUrl(`https://github.com/${result.repo}/commits/main`)
      showMessage(`✅ 已提交 ${result.files} 个文件到 ${result.repo}`)
    } catch (e: any) {
      showMessage(`❌ 发布失败: ${e.message}`)
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <div className="admin-loading">加载中...</div>

  const repoDisplay = getRepoDisplay()
  const loggedIn = isAuthenticated()

  return (
    <div className="dash-scroll">
      <div className="page-head">
        <div>
          <h2 className="page-title"><span className="page-title-emoji">📊</span>统计概览</h2>
          <p className="page-desc">StarMap 管理后台概览</p>
        </div>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
      </div>

      {info && (
        <div className="admin-info-grid">
          <div className="admin-info-card stat-blue">
            <div className="admin-info-icon">🌐</div>
            <div className="admin-info-content">
              <div className="admin-info-value">{info.totalSites}</div>
              <div className="admin-info-label">收录网站</div>
              <div className="admin-info-desc">所有分类累计</div>
            </div>
          </div>
          <div className="admin-info-card stat-purple">
            <div className="admin-info-icon">📂</div>
            <div className="admin-info-content">
              <div className="admin-info-value">{info.totalCategories}</div>
              <div className="admin-info-label">一级分类</div>
              <div className="admin-info-desc">导航分类总数</div>
            </div>
          </div>
          <div className="admin-info-card stat-green">
            <div className="admin-info-icon">📑</div>
            <div className="admin-info-content">
              <div className="admin-info-value">{info.totalSubCategories}</div>
              <div className="admin-info-label">子分类</div>
              <div className="admin-info-desc">所有一级分类下</div>
            </div>
          </div>
          <div className="admin-info-card stat-pink">
            <div className="admin-info-icon">🏷️</div>
            <div className="admin-info-content">
              <div className="admin-info-value">{info.totalTags}</div>
              <div className="admin-info-label">标签数量</div>
              <div className="admin-info-desc">所有标签累计</div>
            </div>
          </div>
        </div>
      )}

      {/* 导入导出 */}
      <div className="io-section-header">
        <div className="io-section-icon">📋</div>
        <div>
          <h3 className="io-section-title">导入导出</h3>
          <p className="io-section-desc">数据备份、迁移、发布到 GitHub 仓库</p>
        </div>
      </div>

      <div className="io-grid">
        <div className="io-card">
          <div className="io-mini-icon">📤</div>
          <div className="io-content">
            <h4 className="io-title">导出数据</h4>
            <p className="io-desc">将分类、设置打包为 JSON 文件下载到本地</p>
            <button className="admin-btn-primary" disabled={exporting} onClick={handleExport}>
              {exporting ? '导出中...' : '导出数据'}
            </button>
          </div>
        </div>

        <div className="io-card">
          <div className="io-mini-icon">📥</div>
          <div className="io-content">
            <h4 className="io-title">导入数据</h4>
            <p className="io-desc">从备份 JSON 文件恢复所有数据到 localStorage</p>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            <button className="admin-btn-primary" disabled={importing} onClick={() => fileInputRef.current?.click()}>
              {importing ? '导入中...' : '导入数据'}
            </button>
          </div>
        </div>

        <div className="io-card">
          <div className="io-mini-icon">🔧</div>
          <div className="io-content">
            <h4 className="io-title">写入默认</h4>
            <p className="io-desc">将当前设置烘焙到 src/defaults.ts，构建后所有设备样式一致</p>
            <div className="action-row">
              <button className="admin-btn-primary" disabled={baking} onClick={handleBakeDefaults}>
                {baking ? '写入中...' : '写入设置'}
              </button>
              <button className="admin-btn" onClick={handleResetDefaults}>恢复默认</button>
            </div>
          </div>
        </div>

        <div className="io-card">
          <div className="io-mini-icon">🚀</div>
          <div className="io-content">
            <h4 className="io-title">发布到 GitHub</h4>
            <p className="io-desc">将 localStorage 中的所有数据提交到仓库，触发 GitHub Pages 重新构建</p>
            {loggedIn && (
              <div className="io-meta">
                <span className="io-meta-pill">
                  <span className="io-meta-label">当前目标</span>
                  <span className="io-meta-value">{repoDisplay}</span>
                </span>
              </div>
            )}
            <div className="action-row">
              <button className="admin-btn-primary" disabled={publishing || !loggedIn} onClick={handlePublish}>
                {publishing ? '提交中...' : '立即发布'}
              </button>
              {commitUrl && (
                <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="io-commit-link">
                  查看提交记录 →
                </a>
              )}
            </div>
            {!loggedIn && <p className="io-login-hint">请先登录 GitHub 账号以使用发布功能</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
