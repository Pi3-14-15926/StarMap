import { useState } from 'react'
import { verifyToken, setConfig } from '../services/github'

interface LoginProps {
  onSuccess: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const [token, setToken] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /* 跳过登录，进入本地模式 */
  const handleSkip = () => {
    localStorage.setItem('starmap_local_mode', 'true')
    onSuccess()
  }

  const handleLogin = async () => {
    if (!token.trim()) { setError('请输入 GitHub Token'); return }
    if (!repoUrl.trim()) { setError('请输入仓库地址'); return }
    setLoading(true)
    setError('')
    try {
      const result = await verifyToken(token.trim())
      if (result.valid) {
        setConfig(token.trim(), repoUrl.trim(), branch.trim())
        localStorage.removeItem('starmap_local_mode')
        onSuccess()
      } else {
        setError(result.error || 'Token 无效')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4F8CFF" />
                <stop offset="100%" stopColor="#8C6CFF" />
              </linearGradient>
            </defs>
            <rect width="56" height="56" rx="16" fill="url(#logo-grad)" />
            <path d="M28 14l4.5 9 9 2.25-6.75 6.75 1.5 9.75L28 35l-8.25 6 1.5-9.75L14.5 25.25l9-2.25z" fill="#fff" />
          </svg>
        </div>
        <h1 className="admin-login-title">StarMap 管理后台</h1>
        <p className="admin-login-desc">使用 GitHub Token 登录，通过 GitHub API 管理数据</p>

        <div className="admin-login-form">
          <div className="admin-form-group">
            <label>GitHub Token</label>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div className="admin-form-group">
            <label>仓库地址</label>
            <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo" />
          </div>
          <div className="admin-form-group">
            <label>分支</label>
            <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
          </div>

          {error && <div className="admin-form-error">{error}</div>}

          <button className="admin-btn-primary admin-btn-block" onClick={handleLogin} disabled={loading}>
            {loading ? '验证中...' : '连接 GitHub'}
          </button>

          <div className="admin-login-divider"><span>或</span></div>

          <button className="admin-btn admin-btn-block" onClick={handleSkip} style={{ fontSize: 14, padding: '10px 0' }}>
            ⚡ 跳过，进入本地模式
          </button>

          <p className="admin-login-tip">
            本地模式下可直接管理数据，无需配置 Token。后续可在「系统设置」中连接 GitHub。
          </p>
        </div>
      </div>
    </div>
  )
}
