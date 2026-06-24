import { useState } from 'react'
import { validateToken, saveLogin } from '../services/auth'

interface LoginProps {
  onSuccess: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!token.trim()) { setError('请输入 GitHub Token'); return }
    setLoading(true)
    setError('')
    try {
      const user = await validateToken(token.trim())
      saveLogin(token.trim(), user)
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="logo-mark">
            <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="StarMap" className="logo-img" />
          </div>
          <h1 className="brand-name">StarMap</h1>
          <p className="brand-sub">管理员登录</p>
        </header>

        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-field">
          <label className="form-label">GitHub Token</label>
          <input
            className="form-input"
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            disabled={loading}
            onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
          />
        </div>

        <button
          className="login-btn"
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? '验证中...' : '登录'}
        </button>

        <div className="login-hint">
          <div className="hint-head">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shield-icon">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
            <span className="hint-title">安全认证</span>
          </div>
          <p className="hint-desc">Token 仅存储在本地浏览器，不会上传到任何服务器</p>
        </div>
      </div>

      {/* 装饰 */}
      <div className="login-decoration" aria-hidden="true">
        <div className="deco-orb deco-orb-1"></div>
        <div className="deco-orb deco-orb-2"></div>
        <div className="deco-orb deco-orb-3"></div>
        <svg className="deco-shield" viewBox="0 0 200 200" width="240" height="240" fill="none">
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F8CFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8C6CFF" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <path
            d="M100 20 L170 50 L170 110 C170 145 138 175 100 185 C62 175 30 145 30 110 L30 50 Z"
            fill="url(#shieldGrad)"
            stroke="#4F8CFF"
            strokeWidth="1.5"
            strokeOpacity="0.18"
          />
          <path
            d="M70 105 L92 127 L135 80"
            fill="none"
            stroke="#4F8CFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.22"
          />
        </svg>
      </div>
    </div>
  )
}