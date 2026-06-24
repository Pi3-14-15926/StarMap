import { useState, useRef } from 'react'
import { api } from '../services/data'
import { localApi } from '../services/local'
import { commitAllData } from '../services/github'
import { getRepoDisplay, isAuthenticated } from '../services/auth'

export function ImportExport() {
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

  /* 导出数据 */
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

  /* 导入数据 */
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

  /* 写入默认 - 将当前设置烘焙到 src/defaults.ts */
  const handleBakeDefaults = async () => {
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

  /* 恢复默认 - 重置所有设置为初始值 */
  const handleResetDefaults = async () => {
    try {
      localApi.resetAll()
      showMessage('✅ 所有数据已恢复为默认值')
    } catch (e: any) {
      showMessage(`❌ 恢复失败: ${e.message}`)
    }
  }

  /* 发布到 GitHub */
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

  const repoDisplay = getRepoDisplay()
  const loggedIn = isAuthenticated()

  return (
    <div>
      <div className="admin-toolbar">
        <span>导入导出</span>
        {message && <span className={`admin-msg ${message.startsWith('✅') ? 'ok' : 'err'}`}>{message}</span>}
      </div>

      <div className="io-section-header">
        <div className="io-section-icon">📋</div>
        <div>
          <h3 className="io-section-title">导入导出</h3>
          <p className="io-section-desc">数据备份、迁移、发布到 GitHub 仓库</p>
        </div>
      </div>

      <div className="io-grid">
        {/* 导出数据 */}
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

        {/* 导入数据 */}
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

        {/* 写入默认 */}
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

        {/* 发布到 GitHub */}
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
