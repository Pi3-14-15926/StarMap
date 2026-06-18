import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Websites } from './pages/Websites'
import { Categories } from './pages/Categories'
import { Tags } from './pages/Tags'
import { SearchEngines } from './pages/SearchEngines'
import { Settings } from './pages/Settings'
import { BookmarkImport } from './pages/BookmarkImport'
import { Info } from './pages/Info'
import { isLoggedIn } from './services/github'
import './styles.css'

export function isLocalMode(): boolean {
  return localStorage.getItem('starmap_local_mode') === 'true'
}

export default function AdminApp() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) return null

  const logged = isLoggedIn() || isLocalMode()

  if (!logged) return <Login onSuccess={() => setReady(false)} />

  const handleLogout = () => {
    localStorage.removeItem('starmap_local_mode')
    localStorage.removeItem('starmap_token')
    setReady(false)
  }

  return (
    <Routes>
      <Route element={<Dashboard onLogout={handleLogout} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Info />} />
        <Route path="websites" element={<Websites />} />
        <Route path="categories" element={<Categories />} />
        <Route path="tags" element={<Tags />} />
        <Route path="search" element={<SearchEngines />} />
        <Route path="settings" element={<Settings />} />
        <Route path="bookmark" element={<BookmarkImport />} />
      </Route>
    </Routes>
  )
}
