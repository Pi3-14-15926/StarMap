import { useState } from 'react'
import { verifyToken } from '../services/github'

interface AuthProps {
  onLogin: () => void
}

export function AuthPage({ onLogin }: AuthProps) {
  const [token, setToken] = useState(localStorage.getItem('starmap_github_token') || '')
  const [repoUrl, setRepoUrl] = useState(localStorage.getItem('starmap_repo_url') || 'https://github.com/your-username/StarMap')
  const [branch, setBranch] = useState(localStorage.getItem('starmap_branch') || 'main')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!token.trim()) { setError('请输入 GitHub Token'); return }
    setLoading(true)
    setError('')

    try {
      const valid = await verifyToken(token.trim())
      if (valid) {
        localStorage.setItem('starmap_github_token', token.trim())
        localStorage.setItem('starmap_repo_url', repoUrl.trim())
        localStorage.setItem('starmap_branch', branch.trim())
        onLogin()
      } else {
        setError('Token 无效，请检查权限')
      }
    } catch (err: any) {
      setError(err.message || '验证失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--apple-bg)',
      }}
    >
      <div
        style={{
          width: 420,
          padding: 48,
          background: 'var(--apple-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--apple-shadow)',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          StarMap 管理后台
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--apple-text-secondary)', fontSize: 14, marginBottom: 32 }}>
          使用 GitHub Token 进行身份验证
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--apple-text-secondary)', display: 'block', marginBottom: 6 }}>
              GitHub Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--apple-text-secondary)', display: 'block', marginBottom: 6 }}>
              仓库地址
            </label>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--apple-text-secondary)', display: 'block', marginBottom: 6 }}>
              分支
            </label>
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14 }}
            />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: '#fff2f0', color: '#ff4d4f', borderRadius: 6, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: loading ? '#ccc' : 'var(--color-primary)',
              color: '#fff',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {loading ? '验证中...' : '登录'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--apple-text-tertiary)', textAlign: 'center', marginTop: 8 }}>
            Token 仅存储在本地浏览器中，不会上传到第三方
          </p>
        </div>
      </div>
    </div>
  )
}
