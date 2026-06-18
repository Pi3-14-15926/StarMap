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

  const handleLogin = async () => {
    if (!token.trim()) { setError('请输入 GitHub Token'); return }
    if (!repoUrl.trim()) { setError('请输入仓库地址'); return }
    setLoading(true)
    setError('')
    try {
      const result = await verifyToken(token.trim())
      if (result.valid) {
        setConfig(token.trim(), repoUrl.trim(), branch.trim())
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
          <svg width="40" height="40" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#1677FF" />
            <path d="M14 5l3 6 6 1.5-4.5 4 1 6.5L14 19l-5.5 4 1-6.5L5 12.5l6-1.5z" fill="#fff" />
          </svg>
        </div>
        <h1 className="admin-login-title">StarMap 管理后台</h1>
        <p className="admin-login-desc">使用 GitHub Token 登录，通过 GitHub API 管理数据</p>

        <div className="admin-login-form">
          <div className="admin-form-group">
            <label>GitHub Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div className="admin-form-group">
            <label>仓库地址</label>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
            />
          </div>
          <div className="admin-form-group">
            <label>分支</label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
          </div>

          {error && <div className="admin-form-error">{error}</div>}

          <button className="admin-btn-primary admin-btn-block" onClick={handleLogin} disabled={loading}>
            {loading ? '验证中...' : '登录'}
          </button>

          <p className="admin-login-tip">
            Token 仅存储在本地浏览器，不会上传到第三方。需要 repo 权限。
          </p>
        </div>
      </div>
    </div>
  )
}
