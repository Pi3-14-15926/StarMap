import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Websites } from './pages/Websites'
import { Categories } from './pages/Categories'
import { Tags } from './pages/Tags'
import { Settings } from './pages/Settings'
import { Info } from './pages/Info'
import { Icons } from './pages/Icons'
import { isAuthenticated } from './services/auth'
import { ConfirmProvider } from './components/ConfirmModal'
import { ToastProvider } from './components/Toast'
import './styles.css'

export default function AdminApp() {
  const [logged, setLogged] = useState(() => isAuthenticated())

  useEffect(() => {
    setLogged(isAuthenticated())
  }, [])

  // 后台也读取并应用主题
  useEffect(() => {
    const saved = localStorage.getItem('starmap_theme')
    document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light')
  }, [])

  if (!logged) return <Login onSuccess={() => setLogged(true)} />

  const handleLogout = () => {
    localStorage.removeItem('starmap_token')
    localStorage.removeItem('starmap_user')
    localStorage.removeItem('starmap_repo')
    localStorage.removeItem('starmap_branch')
    setLogged(false)
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Routes>
          <Route element={<Dashboard onLogout={handleLogout} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Info />} />
            <Route path="websites" element={<Websites />} />
            <Route path="categories" element={<Categories />} />
            <Route path="icons" element={<Icons />} />
            <Route path="tags" element={<Tags />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </ConfirmProvider>
    </ToastProvider>
  )
}